"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
exports.GET = GET;
const complaints_service_1 = require("../services/complaints.service");
const complaintsService = new complaints_service_1.ComplaintsService();
async function POST(req, res) {
    try {
        const { trackingNumber, evidence } = req.body;
        if (!trackingNumber || !evidence) {
            return res.status(400).json({ error: 'Tracking number and evidence data are required' });
        }
        // Find complaint by tracking number
        const complaint = await complaintsService.getComplaintByTrackingNumber(trackingNumber);
        if (!complaint) {
            return res.status(404).json({ error: 'Complaint not found with provided tracking number' });
        }
        // Add evidence to complaint
        const evidenceItem = await complaintsService.addEvidenceToComplaint(complaint.id, [evidence]);
        return res.json({
            success: true,
            evidenceId: evidenceItem[0]?.id,
            message: 'Evidence uploaded successfully'
        });
    }
    catch (error) {
        console.error('Error handling evidence upload:', error);
        return res.status(500).json({ error: 'Failed to process evidence upload' });
    }
}
async function GET(req, res) {
    try {
        const trackingNumber = req.query.trackingNumber;
        if (!trackingNumber) {
            return res.status(400).json({ error: 'Tracking number is required' });
        }
        // Get complaint with evidence
        const complaint = await complaintsService.getComplaintByTrackingNumber(trackingNumber);
        if (!complaint) {
            return res.status(404).json({ error: 'Complaint not found' });
        }
        return res.json({
            success: true,
            evidence: complaint.evidence || [],
            complaintId: complaint.id,
            trackingNumber: complaint.trackingNumber
        });
    }
    catch (error) {
        console.error('Error fetching evidence:', error);
        return res.status(500).json({ error: 'Failed to fetch evidence' });
    }
}
//# sourceMappingURL=evidence.js.map