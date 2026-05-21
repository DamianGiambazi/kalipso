// lib/logger.ts
// Structured logger — a singleton, instantiated once per process.
// Use this everywhere instead of console.log.
//
// Development: human-readable colorised output via pino-pretty
// Production (Vercel): structured JSON, ingested by Vercel's log stream
//
// Usage:
//   import { logger } from '@/lib/logger';
//   logger.info({ correlationId, statementLen: 42 }, 'notarize_start');
//   logger.error({ correlationId, err }, 'notarize_failed');

import pino from 'pino';
import { env } from './env';

const isDev = env.NODE_ENV === 'development';

export const logger = pino({
  level: isDev ? 'debug' : 'info',
  base: { app: 'kalipso' },
  timestamp: pino.stdTimeFunctions.isoTime,
  // In dev, format prettily for the terminal.
  // In prod (Vercel), emit raw JSON for the log stream.
  ...(isDev
    ? {
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss.l',
          ignore: 'pid,hostname,app',
        },
      },
    }
    : {}),
});

export type Logger = typeof logger;
