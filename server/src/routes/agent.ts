import { Router, Request, Response } from 'express';
import { ConversationManager, AgentRequest } from '../agent/conversation-manager';
import { MediaService } from '../services/media.service';
import { randomBytes } from 'crypto';
import { AgentMessage, AgentResponse, MediaFile } from '../types/agent.types';

const router = Router();
const conversationManager = new ConversationManager();
const mediaService = new MediaService();

// Extend Request interface to include files (without multer types for now)
interface MulterRequest extends Request {
  files?: any[]; // Using any for now until multer is properly installed
}

// Session management endpoint (kept for WebSocket client initialization)
router.post('/session', (req, res) => {
  try {
    const sessionId = randomBytes(16).toString('hex');
    res.json({ 
      sessionId,
      message: 'New session created. Connect via WebSocket to start chatting with Leoma.',
      websocketUrl: `ws://localhost:${process.env.PORT || 3000}`,
      agent: 'Leoma'
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to create session',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// NOTE: Chat and message endpoints removed - use WebSocket instead
// See README.md for WebSocket integration instructions

// Get session status
router.get('/session/:sessionId/status', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const status = await conversationManager.getSessionStatus(sessionId);

    if (status.error) {
      res.status(404).json(status);
      return;
    }

    res.json(status);
  } catch (error) {
    console.error('Session status error:', error);
    res.status(500).json({
      error: 'Failed to get session status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Health check for agent service
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    agent: 'Leoma',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    whatsappWebhooks: {
      active: true,
      endpoints: {
        verification: 'GET /webhook/whatsapp',
        messages: 'POST /webhook/whatsapp'
      },
      activePhoneSessions: phoneSessionMap.size,
      connectedPhones: Array.from(phoneSessionMap.keys())
    },
    activeSessions: phoneSessionMap.size,
    services: {
      conversationManager: 'active',
      mediaService: 'active'
    }
  });
});

// Cleanup expired sessions (admin endpoint)
router.post('/cleanup', async (req, res) => {
  try {
    const { maxAgeHours = 24 } = req.body;
    const deletedCount = await conversationManager.cleanupExpiredSessions(maxAgeHours);
    
    res.json({
      message: 'Cleanup completed',
      deletedSessions: deletedCount,
      maxAgeHours
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({
      error: 'Failed to cleanup sessions',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Phone to session mapping for WhatsApp users
const phoneSessionMap = new Map<string, string>();

// Helper to detect if string is base64 or binary data
function isBinaryOrBase64(str: string): boolean {
  if (!str || str.length < 50) return false;
  
  // Check if it looks like base64 (starts with common JPEG/image headers)
  if (str.startsWith('/9j/') || str.startsWith('iVBORw') || str.startsWith('R0lGOD')) {
    return true;
  }
  
  // Check if mostly non-printable characters
  const nonPrintable = str.split('').filter(c => {
    const code = c.charCodeAt(0);
    return code < 32 || code > 126;
  }).length;
  
  return nonPrintable / str.length > 0.3;
}

// API key middleware for webhook security
function requireApiKey(req: Request, res: Response, next: any) {
  const apiKeyHeader = req.headers["x-api-key"] as string | undefined;
  const apiKeyQuery = typeof req.query.api_key === "string" ? (req.query.api_key as string) : undefined;
  const expected = process.env.WHATSAPP_API_KEY || "default-key";

  if (!apiKeyHeader && !apiKeyQuery) {
    res.status(401).json({ error: "Unauthorized: API key is required" });
    return;
  }

  if (apiKeyHeader !== expected && apiKeyQuery !== expected) {
    res.status(401).json({ error: "Unauthorized: Invalid API key" });
    return;
  }

  next();
}

// Get or create session ID for phone number
function getOrCreateSessionId(phone: string): string {
  let sessionId = phoneSessionMap.get(phone);
  if (!sessionId) {
    sessionId = randomBytes(16).toString('hex');
    phoneSessionMap.set(phone, sessionId);
    console.log(`Created new session ${sessionId} for phone ${phone}`);
  }
  return sessionId;
}

// WhatsApp webhook verification (GET)
router.get('/webhook/whatsapp', (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN || "test-token";

  console.log({ mode, token, challenge }, "WhatsApp webhook verification request");

  if (mode === "subscribe" && token === expectedToken) {
    console.log("WhatsApp webhook verified successfully");
    res.status(200).send(challenge);
  } else {
    console.warn("WhatsApp webhook verification failed");
    res.sendStatus(403);
  }
});

// WhatsApp webhook message handler (POST)
router.post('/webhook/whatsapp', requireApiKey, async (req: Request, res) => {
  try {
    const { event, message, from, phoneE164, messageType, location, media } = req.body;

    console.log({ event, from, phoneE164, message }, "Received WhatsApp message");

    // Handle different events
    if (event === "connected") {
      res.json({ status: "success", message: "WhatsApp client connected" });
      return;
    }

    if (event === "disconnected") {
      res.json({ status: "success", message: "WhatsApp client disconnected" });
      return;
    }

    if (event === "message") {
      // Extract phone number from JID if needed
      let phone = phoneE164;
      if (!phone && from && from.includes("@c.us")) {
        const phoneNumber = from.split("@")[0];
        phone = `+${phoneNumber}`;
      }

      if (!phone) {
        res.status(400).json({ error: "Phone number required" });
        return;
      }

      // Get or create session for this phone number
      const sessionId = getOrCreateSessionId(phone);

      // Handle location shares from WhatsApp
      let locationContext;
      if (messageType === "location" && location) {
        console.log(
          {
            phone,
            latitude: location.latitude,
            longitude: location.longitude,
            description: location.description,
          },
          "Location share received"
        );

        // Filter out binary/base64 data from description
        const cleanDescription = (location.description && !isBinaryOrBase64(location.description)) 
          ? location.description 
          : (location.address && !isBinaryOrBase64(location.address))
            ? location.address
            : null;

        locationContext = {
          hasLocation: true,
          latitude: location.latitude,
          longitude: location.longitude,
          locationDescription: cleanDescription,
        };
      }

      // Handle media attachments
      let mediaFiles: MediaFile[] = [];
      if (media && media.data) {
        console.log(
          {
            phone,
            mimeType: media.mimetype,
            size: media.size,
            filename: media.filename
          },
          "Media attachment received"
        );
        
        // Validate media file
        const mediaFile: MediaFile = {
          name: media.filename || 'media',
          type: media.mimetype,
          size: media.size,
          buffer: Buffer.from(media.data, 'base64'),
          mimeType: media.mimetype
        };

        const validation = mediaService.validateFile(mediaFile);
        if (!validation.isValid) {
          console.error(`Invalid media file: ${validation.error}`);
        } else {
          mediaFiles.push(mediaFile);
        }
      }

      // Handle text-only messages or provide welcome
      let textMessage = message;
      if (!textMessage || !textMessage.trim()) {
        textMessage = "Welcome! I'm Leoma, your AI assistant for the Ombudsman office of Sierra Leone. I'm here to help you file complaints against government officials, track existing complaints, and provide information about the complaint process. How can I help you today?";
      }

      // Prepare agent message using existing structure
      const agentMessage: AgentMessage = {
        userId: phone, // Use phone as userId for WhatsApp
        message: textMessage.trim(),
        media: mediaFiles,
        sessionId,
        locationContext: locationContext ? {
          hasLocation: true,
          latitude: location.latitude,
          longitude: location.longitude,
          locationDescription: locationContext.locationDescription
        } : undefined
      };

      // Process message through existing conversation manager
      console.log({
        phone,
        sessionId,
        messageLength: textMessage.length,
        hasMedia: mediaFiles.length > 0,
        messageType
      }, "Processing message through conversation manager");

      const response = await conversationManager.processMessageWithMedia(agentMessage);

      // Process media if any and attach to session
      let evidenceUploaded = false;
      if (mediaFiles.length > 0 && response.shouldAttachMedia) {
        try {
          const processedMedia = await mediaService.processBatchFiles(mediaFiles);
          await mediaService.attachMediaToSession(response.sessionId, processedMedia);
          evidenceUploaded = true;
          console.log({ sessionId: response.sessionId, mediaCount: processedMedia.length }, "Media attached to session");
        } catch (error: any) {
          console.error({
            error: error.message,
            stack: error.stack,
            sessionId: response.sessionId
          }, 'Error processing media');
          // Continue with message processing even if media fails
        }
      }

      const agentResponse: AgentResponse = {
        message: response.message,
        sessionId: response.sessionId,
        state: response.state,
        shouldEndSession: response.shouldEndSession,
        trackingNumber: response.trackingNumber,
        evidenceUploaded
      };

      console.log({
        phone,
        sessionId: response.sessionId,
        trackingNumber: response.trackingNumber,
        messageLength: response.message.length,
        agentResponse: response.message.substring(0, 100),
        evidenceUploaded,
        state: response.state
      }, "Agent response sent");

      res.json({
        answer: response.message,
        sessionId: response.sessionId,
        trackingNumber: response.trackingNumber,
        status: "success",
        evidenceUploaded
      });
      return;
    }

    res.json({ status: "unknown_event" });
  } catch (error: any) {
    const errorDetails = {
      error: error.message,
      stack: error.stack,
      errorName: error.name,
      errorCode: error.code,
      body: req.body
    };
    console.error(errorDetails, "Error processing WhatsApp webhook");
    res.status(500).json({
      answer: "Sorry, I encountered an error. Please try again.",
      status: "error",
    });
  }
});

export default router;
