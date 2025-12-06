import { ComplaintsService } from './complaints.service';
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

export class TrackingService {
  private complaintsService: ComplaintsService;

  constructor() {
    this.complaintsService = new ComplaintsService();
  }

  /**
   * Validate tracking number format
   */
  validateTrackingNumber(trackingNumber: string): { isValid: boolean; error?: string } {
    if (!trackingNumber || typeof trackingNumber !== 'string') {
      return { isValid: false, error: 'Tracking number is required' };
    }

    // Check format: OMB-XXXXXXXX-XXXXXXXX
    if (!/^OMB-[A-Z0-9]+-[A-Z0-9]+$/i.test(trackingNumber.trim())) {
      return { 
        isValid: false, 
        error: 'Invalid tracking number format. Expected format: OMB-XXXXXXXX-XXXXXXXX' 
      };
    }

    return { isValid: true };
  }

  /**
   * Track complaint by tracking number
   */
  async trackComplaint(query: TrackingQuery): Promise<TrackingResponse> {
    const { trackingNumber, includeHistory = false, includeEvidence = false } = query;

    try {
      // Validate tracking number format
      const validation = this.validateTrackingNumber(trackingNumber);
      if (!validation.isValid) {
        return this.createErrorResponse(
          trackingNumber,
          'INVALID_FORMAT',
          validation.error || 'Invalid tracking number format'
        );
      }

      // Find complaint
      const complaint = await this.complaintsService.getComplaintByTrackingNumber(trackingNumber.trim());
      
      if (!complaint) {
        return this.createErrorResponse(
          trackingNumber,
          'NOT_FOUND',
          'I cannot find a complaint with that tracking number. Please verify the tracking number and try again.'
        );
      }

      // Format response
      return this.createSuccessResponse(complaint, includeHistory, includeEvidence);

    } catch (error) {
      console.error('Error tracking complaint:', error);
      
      return this.createErrorResponse(
        trackingNumber,
        'SYSTEM_ERROR',
        'I\'m experiencing technical difficulties while tracking your complaint. Please try again later or contact our support team.'
      );
    }
  }

  /**
   * Get multiple complaints by email (for citizen portal)
   */
  async trackComplaintsByEmail(email: string): Promise<{ success: boolean; complaints: any[]; message: string }> {
    try {
      if (!email || !this.isValidEmail(email)) {
        return {
          success: false,
          complaints: [],
          message: 'Please provide a valid email address.'
        };
      }

      const complaints = await this.complaintsService.getComplaintsByEmail(email);
      
      if (complaints.length === 0) {
        return {
          success: true,
          complaints: [],
          message: 'No complaints found for this email address.'
        };
      }

      return {
        success: true,
        complaints: complaints.map(this.formatComplaintSummary),
        message: `Found ${complaints.length} complaint(s) for this email address.`
      };

    } catch (error) {
      console.error('Error tracking complaints by email:', error);
      
      return {
        success: false,
        complaints: [],
        message: 'I\'m experiencing technical difficulties. Please try again later.'
      };
    }
  }

  /**
   * Create success response with structured template
   */
  private createSuccessResponse(complaint: any, includeHistory: boolean, includeEvidence: boolean): TrackingResponse {
    const status = this.formatStatus(complaint.status);
    const lastUpdated = this.formatDate(complaint.updatedAt);
    const submittedDate = this.formatDate(complaint.submittedAt);

    let message = `I found your complaint! Here are the details:

**Tracking Number:** ${complaint.trackingNumber}
**Status:** ${status}
**Ministry:** ${complaint.ministry}
**Subject:** ${complaint.subject}
**Submitted:** ${submittedDate}
**Last Updated:** ${lastUpdated}`;

    if (includeHistory && complaint.statusHistory && complaint.statusHistory.length > 0) {
      message += `\n\n**Status History:**`;
      complaint.statusHistory.slice(0, 3).forEach((history: any, index: number) => {
        message += `\n${index + 1}. ${this.formatStatus(history.status)} - ${this.formatDate(history.timestamp)}`;
      });
    }

    if (includeEvidence && complaint.evidence && complaint.evidence.length > 0) {
      message += `\n\n**Evidence Files:** ${complaint.evidence.length} file(s) uploaded`;
    }

    // Add next steps based on status
    message += this.getNextStepsMessage(complaint.status);

    return {
      success: true,
      trackingNumber: complaint.trackingNumber,
      status: complaint.status,
      ministry: complaint.ministry,
      lastUpdated,
      submittedDate,
      subject: complaint.subject,
      message
    };
  }

  /**
   * Create error response with user-friendly message
   */
  private createErrorResponse(
    trackingNumber: string, 
    errorType: 'NOT_FOUND' | 'INVALID_FORMAT' | 'SYSTEM_ERROR',
    message: string
  ): TrackingResponse {
    return {
      success: false,
      trackingNumber,
      message,
      errorType
    };
  }

  /**
   * Format status for display
   */
  private formatStatus(status: ComplaintStatus): string {
    const statusMap: { [key in ComplaintStatus]: string } = {
      [ComplaintStatus.submitted]: 'Submitted - Under Initial Review',
      [ComplaintStatus.under_review]: 'Under Review - Being Investigated',
      [ComplaintStatus.investigating]: 'Investigating - Active Investigation',
      [ComplaintStatus.resolved]: 'Resolved - Case Closed',
      [ComplaintStatus.closed]: 'Closed - No Further Action',
      [ComplaintStatus.rejected]: 'Rejected - Case Not Proceeding'
    };

    return statusMap[status] || status;
  }

  /**
   * Format date for display
   */
  private formatDate(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Get next steps message based on status
   */
  private getNextStepsMessage(status: ComplaintStatus): string {
    switch (status) {
      case ComplaintStatus.submitted:
        return '\n\n**Next Steps:** Your complaint is being reviewed. You should receive an update within 2-3 business days.';
      
      case ComplaintStatus.under_review:
        return '\n\n**Next Steps:** An investigator is reviewing your case. You may be contacted for additional information.';
      
      case ComplaintStatus.investigating:
        return '\n\n**Next Steps:** Active investigation is underway. Significant updates will be communicated to you.';
      
      case ComplaintStatus.resolved:
        return '\n\n**Next Steps:** Your case has been resolved. You should receive a detailed resolution summary via email.';
      
      case ComplaintStatus.closed:
        return '\n\n**Next Steps:** This case is closed. If you have new information, you may need to file a new complaint.';
      
      case ComplaintStatus.rejected:
        return '\n\n**Next Steps:** This complaint was not accepted for investigation. You should receive an explanation via email.';
      
      default:
        return '\n\n**Next Steps:** We are processing your complaint and will provide updates as they become available.';
    }
  }

  /**
   * Format complaint summary for email tracking
   */
  private formatComplaintSummary = (complaint: any) => {
    return {
      trackingNumber: complaint.trackingNumber,
      status: this.formatStatus(complaint.status),
      ministry: complaint.ministry,
      subject: complaint.subject,
      submittedDate: this.formatDate(complaint.submittedAt),
      lastUpdated: this.formatDate(complaint.updatedAt)
    };
  };

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Generate tracking status update message
   */
  generateStatusUpdateMessage(oldStatus: ComplaintStatus, newStatus: ComplaintStatus, trackingNumber: string): string {
    return `Status Update for Complaint ${trackingNumber}:

Your complaint status has changed from "${this.formatStatus(oldStatus)}" to "${this.formatStatus(newStatus)}".

${this.getNextStepsMessage(newStatus)}

Thank you for your patience as we process your complaint.`;
  }
}
