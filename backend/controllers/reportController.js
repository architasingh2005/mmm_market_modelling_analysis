import Report from '../models/reportModel.js';
import Dataset from '../models/datasetModel.js';

// Get all reports for the logged-in user (excludes heavy report text to optimize response size)
export async function getAllReports(req, res) {
    try {
        const reports = await Report.find({ userId: req.user.id })
            .populate('datasetId', 'datasetName originalFilename createdAt')
            .select('-content -reportContent')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            message: "Reports fetched successfully",
            count: reports.length,
            reports,
        });
    } catch (err) {
        console.error("getAllReports error:", err);
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
}

// Get a single report by ID for the logged-in user
export async function getReportById(req, res) {
    try {
        const report = await Report.findOne({
            _id: req.params.id,
            userId: req.user.id,
        });

        if (!report) {
            return res.status(404).json({
                success: false,
                message: "Report not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Report fetched successfully",
            report,
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
}

// Download report content by ID for the logged-in user
export async function downloadReport(req, res) {
    try {
        const report = await Report.findOne({
            _id: req.params.id,
            userId: req.user.id,
        });

        if (!report) {
            return res.status(404).json({
                success: false,
                message: "Report not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Report fetched for download successfully",
            report,
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
}

// Delete a report by ID for the logged-in user
export async function deleteReport(req, res) {
    try {
        const deletedReport = await Report.findOneAndDelete({
            _id: req.params.id,
            userId: req.user.id,
        });

        if (!deletedReport) {
            return res.status(404).json({
                success: false,
                message: "Report not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Report deleted successfully",
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
}
