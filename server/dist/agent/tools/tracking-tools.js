"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trackingToolHandlers = exports.trackingTools = void 0;
exports.getComplaintStatusHandler = getComplaintStatusHandler;
exports.listUserComplaintsHandler = listUserComplaintsHandler;
exports.trackingTools = [
    {
        type: "function",
        function: {
            name: "get_complaint_status",
            description: "Get the current status of a specific complaint",
            parameters: {
                type: "object",
                properties: {
                    trackingNumber: {
                        type: "string",
                        description: "The complaint tracking number (e.g., OMB-2024-12345)"
                    }
                },
                required: ["trackingNumber"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "list_user_complaints",
            description: "List all complaints filed by a specific user",
            parameters: {
                type: "object",
                properties: {
                    userId: {
                        type: "string",
                        description: "User identifier (phone number or email)"
                    },
                    status: {
                        type: "string",
                        description: "Filter by complaint status (optional)"
                    }
                },
                required: ["userId"]
            }
        }
    }
];
async function getComplaintStatusHandler(args, context) {
    try {
        const { trackingNumber } = args;
        const { prisma } = context;
        const complaint = await prisma.complaint.findUnique({
            where: { trackingNumber },
            include: {
                evidence: true,
                statusHistory: {
                    orderBy: { timestamp: 'desc' },
                    take: 5
                },
                assignedOfficer: {
                    select: {
                        fullName: true,
                        email: true,
                        officerRole: true
                    }
                }
            }
        });
        if (!complaint) {
            return {
                success: false,
                error: "Complaint not found",
                message: "No complaint found with this tracking number"
            };
        }
        return {
            success: true,
            data: {
                trackingNumber: complaint.trackingNumber,
                status: complaint.status,
                priority: complaint.priority,
                subject: complaint.subject,
                ministry: complaint.ministry,
                category: complaint.category,
                submittedAt: complaint.submittedAt,
                updatedAt: complaint.updatedAt,
                assignedOfficer: complaint.assignedOfficer,
                evidenceCount: complaint.evidence.length,
                recentStatusHistory: complaint.statusHistory
            }
        };
    }
    catch (error) {
        return {
            success: false,
            error: error.message,
            message: "Failed to get complaint status"
        };
    }
}
async function listUserComplaintsHandler(args, context) {
    try {
        const { userId, status } = args;
        const { prisma } = context;
        const whereClause = {};
        // Search by phone or email
        whereClause.OR = [
            { phone: userId },
            { email: userId }
        ];
        if (status) {
            whereClause.status = status;
        }
        const complaints = await prisma.complaint.findMany({
            where: whereClause,
            orderBy: { submittedAt: 'desc' },
            select: {
                trackingNumber: true,
                subject: true,
                status: true,
                priority: true,
                ministry: true,
                category: true,
                submittedAt: true,
                updatedAt: true,
                evidence: {
                    select: { id: true }
                }
            }
        });
        return {
            success: true,
            data: {
                complaints: complaints.map(c => ({
                    trackingNumber: c.trackingNumber,
                    subject: c.subject,
                    status: c.status,
                    priority: c.priority,
                    ministry: c.ministry,
                    category: c.category,
                    submittedAt: c.submittedAt,
                    updatedAt: c.updatedAt,
                    evidenceCount: c.evidence.length
                })),
                totalCount: complaints.length
            }
        };
    }
    catch (error) {
        return {
            success: false,
            error: error.message,
            message: "Failed to list user complaints"
        };
    }
}
exports.trackingToolHandlers = {
    get_complaint_status: getComplaintStatusHandler,
    list_user_complaints: listUserComplaintsHandler,
};
//# sourceMappingURL=tracking-tools.js.map