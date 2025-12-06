"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComplaintsService = void 0;
const prisma_1 = require("../lib/prisma");
const client_1 = require("@prisma/client");
const crypto_1 = require("crypto");
class ComplaintsService {
    /**
     * Generate a unique tracking number using nanoid
     */
    generateTrackingNumber() {
        const timestamp = Date.now().toString(36).toUpperCase();
        const randomId = (0, crypto_1.randomBytes)(4).toString('hex').toUpperCase();
        return `OMB-${timestamp}-${randomId}`;
    }
    /**
     * Create a new complaint in the database
     */
    async createComplaint(data) {
        const trackingNumber = this.generateTrackingNumber();
        try {
            const complaint = await prisma_1.prisma.complaint.create({
                data: {
                    trackingNumber,
                    complainantName: data.fullName || 'Anonymous',
                    email: data.email,
                    phone: data.phone,
                    address: data.address,
                    isAnonymous: !data.fullName || data.isAnonymous,
                    ministry: data.ministry,
                    category: data.category,
                    subject: data.subject || 'Complaint Submission',
                    description: data.description,
                    incidentDate: data.incidentDate,
                    status: client_1.ComplaintStatus.submitted,
                    priority: this.determinePriority(data.category),
                    submittedAt: new Date(),
                }
            });
            // Create initial status history entry
            await prisma_1.prisma.complaintStatusHistory.create({
                data: {
                    complaintId: complaint.id,
                    status: client_1.ComplaintStatus.submitted,
                    note: 'Complaint submitted via citizen portal',
                    updatedBy: 'system'
                }
            });
            return complaint;
        }
        catch (error) {
            console.error('Error creating complaint:', error);
            throw new Error('Failed to create complaint in database');
        }
    }
    /**
     * Add evidence items to a complaint
     */
    async addEvidenceToComplaint(complaintId, evidenceItems) {
        try {
            const evidence = await Promise.all(evidenceItems.map(async (item) => {
                return await prisma_1.prisma.evidenceItem.create({
                    data: {
                        fileName: item.fileName,
                        fileSize: item.fileSize,
                        fileType: item.fileType,
                        url: item.url,
                        complaintId: complaintId,
                        uploadedAt: new Date()
                    }
                });
            }));
            return evidence;
        }
        catch (error) {
            console.error('Error adding evidence:', error);
            throw new Error('Failed to add evidence to complaint');
        }
    }
    /**
     * Get complaint by tracking number
     */
    async getComplaintByTrackingNumber(trackingNumber) {
        try {
            const complaint = await prisma_1.prisma.complaint.findUnique({
                where: { trackingNumber },
                include: {
                    evidence: true,
                    statusHistory: {
                        orderBy: { timestamp: 'desc' }
                    },
                    notes: {
                        orderBy: { createdAt: 'desc' }
                    }
                }
            });
            return complaint;
        }
        catch (error) {
            console.error('Error fetching complaint:', error);
            throw new Error('Failed to fetch complaint');
        }
    }
    /**
     * Update complaint status
     */
    async updateComplaintStatus(complaintId, newStatus, note, updatedBy) {
        try {
            // Update complaint status
            const complaint = await prisma_1.prisma.complaint.update({
                where: { id: complaintId },
                data: {
                    status: newStatus,
                    updatedAt: new Date()
                }
            });
            // Add status history entry
            await prisma_1.prisma.complaintStatusHistory.create({
                data: {
                    complaintId,
                    status: newStatus,
                    note,
                    updatedBy: updatedBy || 'system'
                }
            });
            return complaint;
        }
        catch (error) {
            console.error('Error updating complaint status:', error);
            throw new Error('Failed to update complaint status');
        }
    }
    /**
     * Get complaints by email (for citizen tracking)
     */
    async getComplaintsByEmail(email) {
        try {
            const complaints = await prisma_1.prisma.complaint.findMany({
                where: { email },
                include: {
                    evidence: true,
                    statusHistory: {
                        orderBy: { timestamp: 'desc' },
                        take: 1
                    }
                },
                orderBy: { submittedAt: 'desc' }
            });
            return complaints;
        }
        catch (error) {
            console.error('Error fetching complaints by email:', error);
            throw new Error('Failed to fetch complaints');
        }
    }
    /**
     * Process evidence upload metadata from uploadthing
     */
    async processEvidenceUpload(complaintId, uploadThingData) {
        const evidenceMetadata = uploadThingData.map(upload => ({
            fileName: upload.name || upload.fileName,
            fileSize: upload.size || upload.fileSize,
            fileType: upload.type || upload.fileType,
            url: upload.url,
            uploadThingKey: upload.key || upload.uploadThingKey
        }));
        return await this.addEvidenceToComplaint(complaintId, evidenceMetadata);
    }
    /**
     * Generate evidence upload URL for uploadthing
     */
    generateEvidenceUploadUrl(complaintId, trackingNumber) {
        // This would typically integrate with uploadthing's API
        // For now, return a placeholder that would be implemented in the uploadthing core
        return `/api/upload/evidence?complaintId=${complaintId}&trackingNumber=${trackingNumber}`;
    }
    /**
     * Determine complaint priority based on category
     */
    determinePriority(category) {
        if (!category)
            return client_1.ComplaintPriority.medium;
        const highPriorityCategories = [
            'corruption', 'fraud', 'harassment', 'discrimination',
            'violence', 'misconduct', 'ethical_breach'
        ];
        const lowPriorityCategories = [
            'inquiry', 'information', 'general', 'service_delivery'
        ];
        const lowerCategory = category.toLowerCase();
        if (highPriorityCategories.some(cat => lowerCategory.includes(cat))) {
            return client_1.ComplaintPriority.high;
        }
        if (lowPriorityCategories.some(cat => lowerCategory.includes(cat))) {
            return client_1.ComplaintPriority.low;
        }
        return client_1.ComplaintPriority.medium;
    }
    /**
     * Validate complaint submission data
     */
    validateSubmissionData(data) {
        const errors = [];
        if (!data.email || !this.isValidEmail(data.email)) {
            errors.push('Valid email is required');
        }
        if (!data.phone || !this.isValidPhone(data.phone)) {
            errors.push('Valid phone number is required');
        }
        if (!data.description || data.description.trim().length < 10) {
            errors.push('Description must be at least 10 characters long');
        }
        if (!data.ministry || data.ministry.trim().length < 2) {
            errors.push('Ministry is required');
        }
        if (!data.category || data.category.trim().length < 2) {
            errors.push('Category is required');
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    /**
     * Validate email format
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    /**
     * Validate phone number format
     */
    isValidPhone(phone) {
        const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
        const digitsOnly = phone.replace(/\D/g, '');
        return phoneRegex.test(phone) && digitsOnly.length >= 10;
    }
    /**
     * Get complaint statistics for dashboard
     */
    async getComplaintStatistics() {
        try {
            const [totalComplaints, submittedCount, underReviewCount, investigatingCount, resolvedCount, rejectedCount] = await Promise.all([
                prisma_1.prisma.complaint.count(),
                prisma_1.prisma.complaint.count({ where: { status: client_1.ComplaintStatus.submitted } }),
                prisma_1.prisma.complaint.count({ where: { status: client_1.ComplaintStatus.under_review } }),
                prisma_1.prisma.complaint.count({ where: { status: client_1.ComplaintStatus.investigating } }),
                prisma_1.prisma.complaint.count({ where: { status: client_1.ComplaintStatus.resolved } }),
                prisma_1.prisma.complaint.count({ where: { status: client_1.ComplaintStatus.rejected } })
            ]);
            return {
                total: totalComplaints,
                submitted: submittedCount,
                underReview: underReviewCount,
                investigating: investigatingCount,
                resolved: resolvedCount,
                rejected: rejectedCount
            };
        }
        catch (error) {
            console.error('Error fetching complaint statistics:', error);
            throw new Error('Failed to fetch complaint statistics');
        }
    }
}
exports.ComplaintsService = ComplaintsService;
//# sourceMappingURL=complaints.service.js.map