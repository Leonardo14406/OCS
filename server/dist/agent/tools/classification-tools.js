"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.classificationToolHandlers = exports.classificationTools = void 0;
exports.classifyComplaintHandler = classifyComplaintHandler;
exports.getMinistryInfoHandler = getMinistryInfoHandler;
exports.classificationTools = [
    {
        type: "function",
        function: {
            name: "classify_complaint",
            description: "Classify a complaint into category and ministry",
            parameters: {
                type: "object",
                properties: {
                    description: {
                        type: "string",
                        description: "The complaint description to classify"
                    },
                    sessionId: {
                        type: "string",
                        description: "The session identifier"
                    }
                },
                required: ["description", "sessionId"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "get_ministry_info",
            description: "Get information about a specific ministry",
            parameters: {
                type: "object",
                properties: {
                    ministryName: {
                        type: "string",
                        description: "Name of the ministry"
                    }
                },
                required: ["ministryName"]
            }
        }
    }
];
async function classifyComplaintHandler(args, context) {
    try {
        const { description, sessionId } = args;
        const { prisma } = context;
        // Simple classification logic based on keywords
        const lowerDesc = description.toLowerCase();
        let category = "Other";
        let ministry = "Unknown";
        // Classification rules
        if (lowerDesc.includes('corrupt') || lowerDesc.includes('bribe') || lowerDesc.includes('money')) {
            category = "Corruption";
            ministry = "Anti-Corruption Commission";
        }
        else if (lowerDesc.includes('health') || lowerDesc.includes('hospital') || lowerDesc.includes('doctor')) {
            category = "Health Service";
            ministry = "Ministry of Health and Sanitation";
        }
        else if (lowerDesc.includes('school') || lowerDesc.includes('education') || lowerDesc.includes('teacher')) {
            category = "Education";
            ministry = "Ministry of Education";
        }
        else if (lowerDesc.includes('road') || lowerDesc.includes('infrastructure') || lowerDesc.includes('construction')) {
            category = "Infrastructure";
            ministry = "Ministry of Works and Infrastructure";
        }
        else if (lowerDesc.includes('police') || lowerDesc.includes('security') || lowerDesc.includes('arrest')) {
            category = "Police Conduct";
            ministry = "Sierra Leone Police";
        }
        else if (lowerDesc.includes('discriminat') || lowerDesc.includes('unfair') || lowerDesc.includes('bias')) {
            category = "Discrimination";
            ministry = "Human Rights Commission";
        }
        else if (lowerDesc.includes('finance') || lowerDesc.includes('civil servant') || lowerDesc.includes('salary')) {
            category = "Employment";
            ministry = "Public Service Commission";
        }
        else if (lowerDesc.includes('harassment') || lowerDesc.includes('intimidation')) {
            category = "Harassment";
            ministry = "Ministry of Internal Affairs";
        }
        // Update session with classification results
        await prisma.conversationSession.update({
            where: { sessionId },
            data: {
                classifiedMinistry: ministry,
                classifiedCategory: category
            }
        });
        return {
            success: true,
            data: {
                category,
                ministry,
                confidence: 0.8 // Mock confidence score
            },
            message: `Complaint classified as ${category} for ${ministry}`
        };
    }
    catch (error) {
        return {
            success: false,
            error: error.message,
            message: "Failed to classify complaint"
        };
    }
}
async function getMinistryInfoHandler(args, context) {
    try {
        const { ministryName } = args;
        const { prisma } = context;
        // Mock ministry information
        const ministryInfo = {
            "Ministry of Health and Sanitation": {
                description: "Responsible for healthcare services, hospitals, and public health",
                contact: "health@gov.sl",
                address: "Freetown, Sierra Leone"
            },
            "Ministry of Education": {
                description: "Oversees education system, schools, and educational programs",
                contact: "education@gov.sl",
                address: "Tower Hill, Freetown"
            },
            "Ministry of Works and Infrastructure": {
                description: "Manages public works, roads, and infrastructure development",
                contact: "works@gov.sl",
                address: "Freetown, Sierra Leone"
            },
            "Sierra Leone Police": {
                description: "Law enforcement and public safety",
                contact: "police@gov.sl",
                address: "Police Headquarters, Freetown"
            }
        };
        const info = ministryInfo[ministryName];
        if (!info) {
            return {
                success: false,
                error: "Ministry not found",
                message: "No information available for this ministry"
            };
        }
        return {
            success: true,
            data: {
                name: ministryName,
                ...info
            }
        };
    }
    catch (error) {
        return {
            success: false,
            error: error.message,
            message: "Failed to get ministry information"
        };
    }
}
exports.classificationToolHandlers = {
    classify_complaint: classifyComplaintHandler,
    get_ministry_info: getMinistryInfoHandler,
};
//# sourceMappingURL=classification-tools.js.map