import express from "express";
import { createServer } from "http";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import { prisma } from "./lib/prisma";
import agentRoutes from "./routes/agent";
import { OmbudsmanAgent } from "./agent/ombudsman-agent";
import { WebSocketGateway } from "./websocket/gateway";
import { logger } from "./lib/logger";

dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3000;

// Initialize agent and WebSocket gateway
const agent = new OmbudsmanAgent();
const wsGateway = new WebSocketGateway(agent);

app.use(helmet());
app.use(cors());
app.use(morgan("combined"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/agent", agentRoutes);

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
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    res.json({ status: "Database connected", result });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
    res.status(500).json({ status: "Database connection failed", error: errorMessage });
  }
});

// WebSocket upgrade handling
server.on('upgrade', (request, socket, head) => {
  wsGateway.handleUpgrade(request, socket, head);
});

server.listen(PORT, () => {
  logger.info({ port: PORT }, 'Citizen Interface Server started successfully');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info({}, 'Received SIGTERM, shutting down gracefully');
  await wsGateway.close();
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info({}, 'Received SIGINT, shutting down gracefully');
  await wsGateway.close();
  await prisma.$disconnect();
  process.exit(0);
});

export default app;
export { server, agent, wsGateway };
