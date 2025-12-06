"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evidenceToolHandlers = exports.evidenceTools = void 0;
exports.uploadEvidenceHandler = uploadEvidenceHandler;
exports.attachEvidenceToComplaintHandler = attachEvidenceToComplaintHandler;
exports.evidenceTools = [
    {
        type: "function",
        function: {
            name: "upload_evidence",
            description: "Upload and process evidence files (photos, documents)",
            parameters: {
                type: "object",
                properties: {
                    sessionId: {
                        type: "string",
                        description: "The session identifier"
                    },
                    filename: {
                        type: "string",
                        description: "Name of the uploaded file"
                    },
                    mimeType: {
                        type: "string",
                        description: "MIME type of the file"
                    },
                    fileSize: {
                        type: "integer",
                        description: "Size of the file in bytes"
                    },
                    fileData: {
                        type: "string",
                        description: "Base64 encoded file data"
                    }
                },
                required: ["sessionId", "filename", "mimeType", "fileSize", "fileData"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "attach_evidence_to_complaint",
            description: "Attach uploaded evidence to a specific complaint",
            parameters: {
                type: "object",
                properties: {
                    trackingNumber: {
                        type: "string",
                        description: "The complaint tracking number"
                    },
                    evidenceIds: {
                        type: "array",
                        items: { type: "string" },
                        description: "Array of evidence item IDs to attach"
                    }
                },
                required: ["trackingNumber", "evidenceIds"]
            }
        }
    }
];
async function uploadEvidenceHandler(args, context) {
    try {
        const { sessionId, filename, mimeType, fileSize, fileData } = args;
        const { prisma } = context;
        // Validate file size (max 10MB)
        if (fileSize > 10 * 1024 * 1024) {
            return {
                success: false,
                error: "File too large",
                message: "File size must be less than 10MB"
            };
        }
        // Validate file type
        const allowedTypes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf', 'text/plain', 'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        if (!allowedTypes.includes(mimeType)) {
            return {
                success: false,
                error: "Invalid file type",
                message: "Only images, PDFs, and documents are allowed"
            };
        }
        // Create evidence record with a temporary placeholder
        // We'll update it when attaching to a real complaint
        const tempComplaintId = "temp-" + Date.now();
        const evidence = await prisma.evidenceItem.create({
            data: {
                fileName: filename,
                fileSize,
                fileType: mimeType,
                uploadedAt: new Date(),
                complaintId: tempComplaintId
            }
        });
        // In a real implementation, you would store the file data in cloud storage
        // For now, we'll just log that we received it
        console.log(`Evidence uploaded: ${filename} (${fileSize} bytes) - ID: ${evidence.id}`);
        return {
            success: true,
            data: {
                evidenceId: evidence.id,
                fileName: evidence.fileName,
                fileSize: evidence.fileSize,
                fileType: evidence.fileType,
                uploadedAt: evidence.uploadedAt
            },
            message: "Evidence uploaded successfully"
        };
    }
    catch (error) {
        return {
            success: false,
            error: error.message,
            message: "Failed to upload evidence"
        };
    }
}
async function attachEvidenceToComplaintHandler(args, context) {
    try {
        const { trackingNumber, evidenceIds } = args;
        const { prisma } = context;
        const complaint = await prisma.complaint.findUnique({
            where: { trackingNumber }
        });
        if (!complaint) {
            return {
                success: false,
                error: "Complaint not found",
                message: "No complaint found with this tracking number"
            };
        }
        // Update evidence items to link them to the complaint
        const updatedEvidence = await prisma.evidenceItem.updateMany({
            where: {
                id: { in: evidenceIds }
            },
            data: {
                complaintId: complaint.id
            }
        });
        return {
            success: true,
            data: {
                trackingNumber,
                attachedCount: updatedEvidence.count,
                evidenceIds
            },
            message: `Successfully attached ${updatedEvidence.count} evidence items to complaint ${trackingNumber}`
        };
    }
    catch (error) {
        return {
            success: false,
            error: error.message,
            message: "Failed to attach evidence to complaint"
        };
    }
}
exports.evidenceToolHandlers = {
    upload_evidence: uploadEvidenceHandler,
    attach_evidence_to_complaint: attachEvidenceToComplaintHandler,
};
//# sourceMappingURL=evidence-tools.js.map