import axios from 'axios';
import path from 'path';
import ChatHistory from '../models/chatHistoryModel.js';
import Dataset from '../models/datasetModel.js';
import Report from '../models/reportModel.js';

/**
 * sendMessage
 *
 * Supports two modes:
 *  - General chat (no datasetId): answers questions about marketing, data, 
 *    business strategy, etc. using only the LLM system prompt.
 *  - Dataset chat (with datasetId): fuses CSV data, all generated reports,
 *    dataset metadata, AND the current session's message history before
 *    calling the LLM.
 *
 * In both modes, the last 8 conversation turns (from the same sessionId)
 * are passed as `history` to FastAPI so the LLM can maintain continuity.
 */
export async function sendMessage(req, res) {
    try {
        const { message, datasetId, sessionId } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({ success: false, message: "Message is required" });
        }
        if (!sessionId) {
            return res.status(400).json({ success: false, message: "sessionId is required" });
        }

        // ── Fetch recent conversation history for this session (last 8 turns) ──
        let conversationHistory = [];
        try {
            const pastTurns = await ChatHistory.find({
                userId:    req.user.id,
                sessionId: sessionId,
            })
            .sort({ createdAt: -1 })
            .limit(8)
            .lean();

            // Reverse to chronological order (oldest first) for LLM context
            conversationHistory = pastTurns.reverse().map(turn => ({
                role:    'user',
                content: turn.message || turn.question || '',
                aiReply: turn.response || turn.answer || '',
            }));
        } catch (histErr) {
            console.warn("[ChatController] History fetch warning:", histErr.message);
        }

        // ── Source 1: Dataset File & Metadata ────────────────────────────────
        let dataset          = null;
        let absoluteFilePath = null;
        let datasetMetadata  = {};

        if (datasetId) {
            try {
                dataset = await Dataset.findOne({ _id: datasetId, userId: req.user.id });
                if (dataset) {
                    if (dataset.filePath) {
                        absoluteFilePath = path.resolve(dataset.filePath);
                    }
                    datasetMetadata = {
                        datasetName:      dataset.datasetName || dataset.originalFilename || 'Unknown',
                        originalFilename: dataset.originalFilename,
                        description:      dataset.description || '',
                        fileSize:         dataset.fileSize ? `${(dataset.fileSize / 1024).toFixed(1)} KB` : 'N/A',
                        fileType:         dataset.fileType || 'csv',
                        uploadedAt:       dataset.uploadedAt || dataset.createdAt,
                        status:           dataset.uploadStatus || 'completed',
                    };
                }
            } catch (dErr) {
                console.warn("[ChatController] Dataset lookup warning:", dErr.message);
            }
        }

        // ── Source 2: Reports strictly matching this datasetId ───────────────
        let reportsForContext = [];
        if (datasetId) {
            try {
                const reports = await Report.find({ datasetId, userId: req.user.id })
                    .select('_id title reportType content reportContent summary')
                    .lean();

                reportsForContext = reports.map(r => ({
                    id:            r._id ? r._id.toString() : '',
                    title:         r.title || 'Report',
                    reportType:    r.reportType || 'summary',
                    content:       r.content || r.reportContent || '',
                    reportContent: r.reportContent || r.content || '',
                    summary:       r.summary || {},
                }));

                console.log(`[Node.js Chat] Loaded ${reportsForContext.length} report(s) strictly for datasetId=${datasetId}`);
            } catch (rErr) {
                console.warn("[Node.js Chat] Report fetch warning:", rErr.message);
            }
        }

        // ── Call FastAPI RAG Pipeline Endpoint ───────────────────────────────
        let aiResponse  = null;
        let citations   = [];
        let datasetType = "generic";

        console.log(
            `[Node.js Chat] Frontend request received | sessionId=${sessionId} | ` +
            `datasetId=${datasetId || 'none'} | message="${message.trim().substring(0, 50)}…"`
        );
        console.log(
            `[Node.js Chat] Calling FastAPI endpoint POST http://127.0.0.1:8000/api/chat | ` +
            `datasetId=${datasetId || 'none'} | reports=${reportsForContext.length}`
        );

        try {
            const aiCall = await axios.post('http://127.0.0.1:8000/api/chat', {
                message:     message.trim(),
                datasetId:   datasetId  || null,
                filePath:    absoluteFilePath || null,
                datasetType: "generic",
                reports:     reportsForContext,
                metadata:    datasetMetadata,
                history:     conversationHistory,
            }, {
                timeout: 60000,
            });

            if (aiCall.data && (aiCall.data.response || aiCall.data.answer)) {
                aiResponse  = aiCall.data.response || aiCall.data.answer;
                citations   = aiCall.data.citations || aiCall.data.sources || [];
                datasetType = aiCall.data.datasetType || "generic";
                console.log(`[Node.js Chat] ← FastAPI OK | intent=${aiCall.data.intent} | responseLength=${aiResponse.length} chars | retrievedChunks=${aiCall.data.retrievedDocuments ?? 0}`);
            }
        } catch (aiErr) {
            const errDetail = aiErr.response?.data?.detail || aiErr.message;
            console.error("[Node.js Chat] FastAPI /api/chat error:", errDetail);

            if (aiErr.code === 'ECONNREFUSED' || aiErr.message.includes('ECONNREFUSED')) {
                aiResponse = (
                    "### ⚠️ FastAPI RAG Service Unavailable\n\n" +
                    "The FastAPI AI backend server is currently offline or unreachable (`http://127.0.0.1:8000`).\n\n" +
                    "Please ensure the FastAPI service (`uvicorn app.main:app`) is running and try again."
                );
            } else {
                aiResponse = (
                    `### ⚠️ RAG Pipeline Error\n\n` +
                    `The AI engine encountered an error while processing your request:\n` +
                    `\`${String(errDetail)}\`\n\n` +
                    `Please check your backend configuration or retry in a moment.`
                );
            }
        }

        // ── Persist this turn in MongoDB ─────────────────────────────────────
        const chat = await ChatHistory.create({
            userId:    req.user.id,
            datasetId: datasetId || null,
            sessionId: sessionId,
            message:   message.trim(),
            question:  message.trim(),
            response:  aiResponse,
            answer:    aiResponse,
            citations: citations,
        });

        const populatedChat = await ChatHistory.findById(chat._id)
            .populate('datasetId', 'datasetName originalFilename');

        return res.status(201).json({
            success:  true,
            message:  "Message sent successfully",
            chat:     populatedChat,
        });

    } catch (err) {
        console.error("[ChatController] sendMessage error:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
}


/**
 * getSessions
 *
 * Returns a list of distinct conversation sessions for the user,
 * each with its first message as the title and the dataset it used.
 * Grouped for display in the sidebar.
 */
export async function getSessions(req, res) {
    try {
        // Aggregate: one doc per sessionId, pick the first message as title
        const sessions = await ChatHistory.aggregate([
            { $match: { userId: req.user.id } },
            { $sort:  { createdAt: 1 } },
            {
                $group: {
                    _id:        "$sessionId",
                    sessionId:  { $first: "$sessionId" },
                    title:      { $first: "$message" },
                    datasetId:  { $first: "$datasetId" },
                    createdAt:  { $first: "$createdAt" },
                    lastMsgAt:  { $last:  "$createdAt" },
                    msgCount:   { $sum: 1 },
                }
            },
            { $sort: { lastMsgAt: -1 } },   // most recent first for sidebar
            { $limit: 50 },
        ]);

        // Populate dataset names for sessions that have a dataset
        const datasetIds = [...new Set(sessions.filter(s => s.datasetId).map(s => String(s.datasetId)))];
        let datasetMap = {};
        if (datasetIds.length > 0) {
            const datasets = await Dataset.find({ _id: { $in: datasetIds } })
                .select('_id datasetName originalFilename')
                .lean();
            datasets.forEach(d => { datasetMap[String(d._id)] = d; });
        }

        const enriched = sessions.map(s => ({
            ...s,
            dataset: s.datasetId ? datasetMap[String(s.datasetId)] || null : null,
        }));

        return res.status(200).json({ success: true, sessions: enriched });

    } catch (err) {
        console.error("[ChatController] getSessions error:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
}


/**
 * getChatHistory
 *
 * Returns all messages for a specific sessionId.
 * Falls back to datasetId-scoped query for backward compatibility.
 */
export async function getChatHistory(req, res) {
    try {
        let filter = { userId: req.user.id };

        // sessionId takes priority; fall back to datasetId for old clients
        if (req.query.sessionId) {
            filter.sessionId = req.query.sessionId;
        } else if (req.params.datasetId && req.params.datasetId !== 'all') {
            filter.datasetId = req.params.datasetId;
        }

        const chats = await ChatHistory.find(filter)
            .populate('datasetId', 'datasetName originalFilename createdAt')
            .sort({ createdAt: 1 })
            .lean();

        return res.status(200).json({
            success: true,
            message: "Chat history fetched successfully",
            count:   chats.length,
            chats,
        });

    } catch (err) {
        console.error("[ChatController] getChatHistory error:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
}


/**
 * clearChatHistory
 *
 * Deletes all messages in a session or all messages for a dataset.
 */
export async function clearChatHistory(req, res) {
    try {
        let filter = { userId: req.user.id };

        if (req.query.sessionId) {
            filter.sessionId = req.query.sessionId;
        } else if (req.params.datasetId && req.params.datasetId !== 'all') {
            filter.datasetId = req.params.datasetId;
        }

        const result = await ChatHistory.deleteMany(filter);

        return res.status(200).json({
            success: true,
            message: `Cleared ${result.deletedCount} message(s)`,
        });

    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}
