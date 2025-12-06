import { ComplaintStatus, ComplaintPriority, Gender } from '@prisma/client';
export interface ComplaintSubmissionData {
    fullName?: string | null;
    gender?: Gender | null;
    email: string;
    phone: string;
    address?: string | null;
    subject?: string;
    description: string;
    ministry: string;
    category: string;
    incidentDate?: Date | null;
    isAnonymous?: boolean;
}
export interface EvidenceMetadata {
    fileName: string;
    fileSize: number;
    fileType: string;
    url?: string;
    uploadThingKey?: string;
}
export interface ComplaintWithEvidence {
    complaint: any;
    evidence?: EvidenceMetadata[];
}
export declare class ComplaintsService {
    /**
     * Generate a unique tracking number using nanoid
     */
    generateTrackingNumber(): string;
    /**
     * Create a new complaint in the database
     */
    createComplaint(data: ComplaintSubmissionData): Promise<any>;
    /**
     * Add evidence items to a complaint
     */
    addEvidenceToComplaint(complaintId: string, evidenceItems: EvidenceMetadata[]): Promise<any[]>;
    /**
     * Get complaint by tracking number
     */
    getComplaintByTrackingNumber(trackingNumber: string): Promise<any | null>;
    /**
     * Update complaint status
     */
    updateComplaintStatus(complaintId: string, newStatus: ComplaintStatus, note: string, updatedBy?: string): Promise<any>;
    /**
     * Get complaints by email (for citizen tracking)
     */
    getComplaintsByEmail(email: string): Promise<any[]>;
    /**
     * Process evidence upload metadata from uploadthing
     */
    processEvidenceUpload(complaintId: string, uploadThingData: any[]): Promise<any[]>;
    /**
     * Generate evidence upload URL for uploadthing
     */
    generateEvidenceUploadUrl(complaintId: string, trackingNumber: string): string;
    /**
     * Determine complaint priority based on category
     */
    determinePriority(category: string): ComplaintPriority;
    /**
     * Validate complaint submission data
     */
    validateSubmissionData(data: ComplaintSubmissionData): {
        isValid: boolean;
        errors: string[];
    };
    /**
     * Validate email format
     */
    private isValidEmail;
    /**
     * Validate phone number format
     */
    private isValidPhone;
    /**
     * Get complaint statistics for dashboard
     */
    getComplaintStatistics(): Promise<any>;
}
//# sourceMappingURL=complaints.service.d.ts.map