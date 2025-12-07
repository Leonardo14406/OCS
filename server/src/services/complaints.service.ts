import { prisma } from '../lib/prisma';
import { ComplaintStatus, ComplaintPriority, Gender, UserRole } from '@prisma/client';
import { randomBytes } from 'crypto';

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

export class ComplaintsService {
  /**
   * Generate a unique tracking number using nanoid
   */
  generateTrackingNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const randomId = randomBytes(4).toString('hex').toUpperCase();
    return `OMB-${timestamp}-${randomId}`;
  }

  /**
   * Create a new complaint in the database
   */
  async createComplaint(data: ComplaintSubmissionData): Promise<any> {
    const trackingNumber = this.generateTrackingNumber();
    
    try {
      // Auto-assign to an officer in the same ministry (department) with the
      // lowest number of assignedComplaints to keep distribution even.
      let assignedOfficerId: string | null = null;

      if (data.ministry) {
        const officers = await prisma.account.findMany({
          where: {
            role: UserRole.officer,
            isActive: true,
            department: data.ministry,
          },
          select: {
            id: true,
            assignedComplaints: true,
          },
        });

        if (officers.length > 0) {
          const sorted = [...officers].sort((a, b) => {
            const aCount = a.assignedComplaints ?? 0;
            const bCount = b.assignedComplaints ?? 0;
            return aCount - bCount;
          });

          assignedOfficerId = sorted[0].id;
        }
      }

      const complaint = await prisma.complaint.create({
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
          status: ComplaintStatus.submitted,
          priority: this.determinePriority(data.category),
          submittedAt: new Date(),
          assignedOfficerId: assignedOfficerId || undefined,
        }
      });

      // If we assigned an officer, increment their assignedComplaints counter
      if (assignedOfficerId) {
        await prisma.account.update({
          where: { id: assignedOfficerId },
          data: {
            assignedComplaints: {
              increment: 1,
            },
          },
        });
      }

      // Create initial status history entry
      await prisma.complaintStatusHistory.create({
        data: {
          complaintId: complaint.id,
          status: ComplaintStatus.submitted,
          note: 'Complaint submitted via citizen portal',
          updatedBy: 'system'
        }
      });

      return complaint;
    } catch (error) {
      console.error('Error creating complaint:', error);
      throw new Error('Failed to create complaint in database');
    }
  }

  /**
   * Add evidence items to a complaint
   */
  async addEvidenceToComplaint(
    complaintId: string, 
    evidenceItems: EvidenceMetadata[]
  ): Promise<any[]> {
    try {
      const evidence = await Promise.all(
        evidenceItems.map(async (item) => {
          return await prisma.evidenceItem.create({
            data: {
              fileName: item.fileName,
              fileSize: item.fileSize,
              fileType: item.fileType,
              url: item.url,
              complaintId: complaintId,
              uploadedAt: new Date()
            }
          });
        })
      );

      return evidence;
    } catch (error) {
      console.error('Error adding evidence:', error);
      throw new Error('Failed to add evidence to complaint');
    }
  }

  /**
   * Get complaint by tracking number
   */
  async getComplaintByTrackingNumber(trackingNumber: string): Promise<any | null> {
    try {
      const complaint = await prisma.complaint.findUnique({
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
    } catch (error) {
      console.error('Error fetching complaint:', error);
      throw new Error('Failed to fetch complaint');
    }
  }

  /**
   * Update complaint status
   */
  async updateComplaintStatus(
    complaintId: string, 
    newStatus: ComplaintStatus, 
    note: string,
    updatedBy?: string
  ): Promise<any> {
    try {
      // Update complaint status
      const complaint = await prisma.complaint.update({
        where: { id: complaintId },
        data: { 
          status: newStatus,
          updatedAt: new Date()
        }
      });

      // Add status history entry
      await prisma.complaintStatusHistory.create({
        data: {
          complaintId,
          status: newStatus,
          note,
          updatedBy: updatedBy || 'system'
        }
      });

      return complaint;
    } catch (error) {
      console.error('Error updating complaint status:', error);
      throw new Error('Failed to update complaint status');
    }
  }

  /**
   * Get complaints by email (for citizen tracking)
   */
  async getComplaintsByEmail(email: string): Promise<any[]> {
    try {
      const complaints = await prisma.complaint.findMany({
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
    } catch (error) {
      console.error('Error fetching complaints by email:', error);
      throw new Error('Failed to fetch complaints');
    }
  }

  /**
   * Process evidence upload metadata from uploadthing
   */
  async processEvidenceUpload(
    complaintId: string,
    uploadThingData: any[]
  ): Promise<any[]> {
    const evidenceMetadata: EvidenceMetadata[] = uploadThingData.map(upload => ({
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
  generateEvidenceUploadUrl(complaintId: string, trackingNumber: string): string {
    // This would typically integrate with uploadthing's API
    // For now, return a placeholder that would be implemented in the uploadthing core
    return `/api/upload/evidence?complaintId=${complaintId}&trackingNumber=${trackingNumber}`;
  }

  /**
   * Determine complaint priority based on category
   */
  determinePriority(category: string): ComplaintPriority {
    if (!category) return ComplaintPriority.medium;
    
    const highPriorityCategories = [
      'corruption', 'fraud', 'harassment', 'discrimination', 
      'violence', 'misconduct', 'ethical_breach'
    ];
    
    const lowPriorityCategories = [
      'inquiry', 'information', 'general', 'service_delivery'
    ];
    
    const lowerCategory = category.toLowerCase();
    
    if (highPriorityCategories.some(cat => lowerCategory.includes(cat))) {
      return ComplaintPriority.high;
    }
    
    if (lowPriorityCategories.some(cat => lowerCategory.includes(cat))) {
      return ComplaintPriority.low;
    }
    
    return ComplaintPriority.medium;
  }

  /**
   * Validate complaint submission data
   */
  validateSubmissionData(data: ComplaintSubmissionData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

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
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone number format
   */
  private isValidPhone(phone: string): boolean {
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    const digitsOnly = phone.replace(/\D/g, '');
    return phoneRegex.test(phone) && digitsOnly.length >= 10;
  }

  /**
   * Get complaint statistics for dashboard
   */
  async getComplaintStatistics(): Promise<any> {
    try {
      const [
        totalComplaints,
        submittedCount,
        underReviewCount,
        investigatingCount,
        resolvedCount,
        rejectedCount
      ] = await Promise.all([
        prisma.complaint.count(),
        prisma.complaint.count({ where: { status: ComplaintStatus.submitted } }),
        prisma.complaint.count({ where: { status: ComplaintStatus.under_review } }),
        prisma.complaint.count({ where: { status: ComplaintStatus.investigating } }),
        prisma.complaint.count({ where: { status: ComplaintStatus.resolved } }),
        prisma.complaint.count({ where: { status: ComplaintStatus.rejected } })
      ]);

      return {
        total: totalComplaints,
        submitted: submittedCount,
        underReview: underReviewCount,
        investigating: investigatingCount,
        resolved: resolvedCount,
        rejected: rejectedCount
      };
    } catch (error) {
      console.error('Error fetching complaint statistics:', error);
      throw new Error('Failed to fetch complaint statistics');
    }
  }
}
