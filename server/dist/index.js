"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const prisma_1 = require("./lib/prisma");
const agent_1 = __importDefault(require("./routes/agent"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use((0, morgan_1.default)("combined"));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Routes
app.use("/api/agent", agent_1.default);
app.get("/", (req, res) => {
    res.json({
        message: "Citizen Interface Server is running!",
        timestamp: new Date().toISOString(),
        agent: "Leoma AI Assistant available at /api/agent"
    });
});
app.get("/api/health", (req, res) => {
    res.json({ status: "OK", timestamp: new Date().toISOString() });
});
app.get("/api/test-db", async (req, res) => {
    try {
        const result = await prisma_1.prisma.$queryRaw `SELECT 1 as test`;
        res.json({ status: "Database connected", result });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
        res.status(500).json({ status: "Database connection failed", error: errorMessage });
    }
});
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
exports.default = app;
//# sourceMappingURL=index.js.map