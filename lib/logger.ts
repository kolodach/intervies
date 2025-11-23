import pino, { type Logger } from "pino";

export const logger: Logger =
  process.env.NODE_ENV === "production"
    ? // JSON in production
      pino({ level: process.env.LOG_LEVEL || "info" })
    : // Pretty print in development
      pino({
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
          },
        },
        level: "info",
      });
