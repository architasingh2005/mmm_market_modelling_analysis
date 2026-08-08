import path from 'path';
import axios from 'axios';
import Dataset from '../models/datasetModel.js';
import Report from '../models/reportModel.js';

// Upload a new dataset
export async function uploadDataset(req, res) {
    try {
        // Check if file was uploaded
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Please upload a CSV file",
            });
        }

        // Extract optional metadata from req.body
        const { datasetName, description } = req.body;

        // Check if a dataset with the same filename already has completed reports.
        // This prevents duplicate orphan records from re-uploads.
        const existing = await Dataset.findOne({
            userId: req.user.id,
            originalFilename: req.file.originalname,
        });
        if (existing) {
            const existingReportCount = await Report.countDocuments({ datasetId: existing._id });
            if (existingReportCount > 0) {
                // Clean up the newly uploaded file since we won't process it
                try {
                    const fs = await import('fs');
                    fs.unlinkSync(req.file.path);
                } catch (_) { /* ignore cleanup errors */ }
                return res.status(409).json({
                    success: false,
                    message: `A dataset named "${req.file.originalname}" has already been uploaded and analyzed. Delete the existing dataset first if you want to re-upload.`,
                    existingDatasetId: existing._id,
                });
            }
        }

        // Save dataset record in MongoDB first so we have an _id to link reports to
        const dataset = await Dataset.create({
            userId: req.user.id,
            datasetName: datasetName || req.file.originalname,
            description: description || '',
            filename: req.file.filename,
            originalFilename: req.file.originalname,
            filePath: req.file.path,
            fileSize: req.file.size,
            fileType: req.file.mimetype,
        });

        // ── Call FastAPI pipeline ────────────────────────────────────────────
        let aiResponse;
        try {
            const absoluteFilePath = path.resolve(dataset.filePath);
            console.log(`[Dataset Upload] File: ${dataset.originalFilename}`);
            console.log(`[Dataset Upload] Calling FastAPI → ${absoluteFilePath}`);

            aiResponse = await axios.post('http://127.0.0.1:8000/api/analyze', {
                filePath: absoluteFilePath,
                datasetId: dataset._id.toString(),
            }, {
                timeout: 120000, // 120 s — large CSVs can take time
            });

            console.log(`[Dataset Upload] FastAPI done. Dataset type: ${aiResponse.data.datasetType}. Reports: ${aiResponse.data.reports?.length ?? 0}`);
        } catch (aiErr) {
            const errDetail = aiErr.response?.data?.detail || aiErr.response?.data || aiErr.message;
            console.error('[Dataset Upload] FastAPI error:', errDetail);

            // ── IMPORTANT: Delete the orphan dataset record so it doesn't litter
            //    the DB with empty entries that confuse the chat context lookup.
            try {
                await Dataset.deleteOne({ _id: dataset._id });
                console.log(`[Dataset Upload] Cleaned up orphan dataset record ${dataset._id}`);
            } catch (cleanErr) {
                console.warn('[Dataset Upload] Failed to clean up orphan dataset:', cleanErr.message);
            }

            return res.status(500).json({
                success: false,
                message: 'AI analysis failed',
                error: String(errDetail),
            });
        }

        // ── Save each report as a separate document ──────────────────────────
        const pipelineData = aiResponse.data;
        const reportList = pipelineData.reports ?? [];

        if (reportList.length === 0) {
            return res.status(500).json({
                success: false,
                message: 'FastAPI returned no reports. Check the pipeline logs.',
            });
        }

        const savedReports = [];
        for (const rpt of reportList) {
            try {
                const saved = await Report.create({
                    userId: req.user.id,
                    datasetId: dataset._id,
                    reportType: rpt.reportType || 'summary',
                    title: rpt.title || 'Report',
                    content: rpt.content || '',
                    reportContent: rpt.content || '',
                    summary: rpt.summary || {},
                    status: 'completed',
                    generatedAt: new Date(),
                });
                savedReports.push(saved);
                console.log(`[Dataset Upload] Saved report: "${rpt.title}" (${rpt.reportType})`);
            } catch (saveErr) {
                console.error(`[Dataset Upload] Failed to save report "${rpt.title}":`, saveErr.message);
                // Continue saving remaining reports even if one fails
            }
        }

        return res.status(201).json({
            success: true,
            message: `Dataset uploaded. ${savedReports.length} report(s) generated.`,
            dataset,
            report: savedReports[0],   // kept for frontend compatibility
            reports: savedReports,
            datasetType: pipelineData.datasetType,
        });

    } catch (err) {
        console.error('[Dataset Upload] Unexpected error:', err.message);
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
}


// Get all datasets for the logged-in user
export async function getAllDatasets(req, res) {
    try {
        const datasets = await Dataset.find({ userId: req.user.id }).sort({ createdAt: -1 });

        return res.status(200).json({
            message: "Datasets fetched successfully",
            success: true,
            count: datasets.length,
            datasets,
        });

    } catch (err) {
        return res.status(500).json({
            message: err.message,
            success: false,
        });
    }
}

// Get a single dataset by ID for the logged-in user
export async function getDatasetById(req, res) {
    try {
        const dataset = await Dataset.findOne({
            _id: req.params.id,
            userId: req.user.id,
        });

        if (!dataset) {
            return res.status(404).json({
                message: "Dataset not found",
                success: false,
            });
        }

        return res.status(200).json({
            message: "Dataset fetched successfully",
            success: true,
            dataset,
        });

    } catch (err) {
        return res.status(500).json({
            message: err.message,
            success: false,
        });
    }
}

// Delete a dataset by ID for the logged-in user
export async function deleteDataset(req, res) {
    try {
        const deletedDataset = await Dataset.findOneAndDelete({
            _id: req.params.id,
            userId: req.user.id,
        });

        if (!deletedDataset) {
            return res.status(404).json({
                message: "Dataset not found",
                success: false,
            });
        }

        return res.status(200).json({
            message: "Dataset deleted successfully",
            success: true,
        });

    } catch (err) {
        return res.status(500).json({
            message: err.message,
            success: false,
        });
    }
}
