import dotenv from 'dotenv';

dotenv.config();

export const config = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4o'
  },
  agent: {
    apiKey: process.env.AGENT_API_KEY || 'default-key'
  },
  whatsapp: {
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || 'test-token',
    apiKey: process.env.WHATSAPP_API_KEY || 'default-key'
  },
  server: {
    port: parseInt(process.env.PORT || '3001'),
    env: process.env.NODE_ENV || 'development'
  },
  database: {
    url: process.env.DATABASE_URL || '',
    directUrl: process.env.DIRECT_URL || ''
  }
};
