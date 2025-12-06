import { ComplaintStatus } from '@prisma/client';
export interface TrackingResponse {
    success: boolean;
    trackingNumber: string;
    status?: string;
    ministry?: string;
    lastUpdated?: string;
    submittedDate?: string;
    subject?: string;
    message: string;
    errorType?: 'NOT_FOUND' | 'INVALID_FORMAT' | 'SYSTEM_ERROR';
}
export interface TrackingQuery {
    trackingNumber: string;
    includeHistory?: boolean;
    includeEvidence?: boolean;
}
export declare class TrackingService {
    private complaintsService;
    constructor();
    /**
     * Validate tracking number format
     */
    validateTrackingNumber(trackingNumber: string): {
        isValid: boolean;
        error?: string;
    };
    /**
     * Track complaint by tracking number
     */
    trackComplaint(query: TrackingQuery): Promise<TrackingResponse>;
    /**
     * Get multiple complaints by email (for citizen portal)
     */
    trackComplaintsByEmail(email: string): Promise<{
        success: boolean;
        complaints: any[];
        message: string;
    }>;
    /**
     * Create success response with structured template
     */
    private createSuccessResponse;
    /**
     * Create error response with user-friendly message
     */
    private createErrorResponse;
    /**
     * Format status for display
     */
    private formatStatus;
    /**
     * Format date for display
     */
    private formatDate;
    /**
     * Get next steps message based on status
     */
    private getNextStepsMessage;
    /**
     * Format complaint summary for email tracking
     */
    private formatComplaintSummary;
    /**
     * Validate email format
     */
    private isValidEmail;
    /**
     * Generate tracking status update message
     */
    generateStatusUpdateMessage(oldStatus: ComplaintStatus, newStatus: ComplaintStatus, trackingNumber: string): string;
}
//# sourceMappingURL=tracking.service.d.ts.map