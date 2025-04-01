import winston from "winston";
import "winston-daily-rotate-file";
import { Logtail } from "@logtail/node";
import { LogtailTransport } from "@logtail/winston";

export class LoggerService {
  private static instance: LoggerService;
  private logger: winston.Logger;

  private constructor() {
    // * File transport for daily rotated logs
    const fileTransport = new winston.transports.DailyRotateFile({
      filename: "logs/%DATE%.log",
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "14d",
    });

    // * Console transport for development
    const consoleTransport = new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
        winston.format.printf(
          ({ level, message, timestamp, service }) =>
            `\x1b[36m${timestamp}\x1b[0m [${level}]: \x1b[33m${service}\x1b[0m | ${message}`
        )
      ),
    });

    // * Create Winston logger
    this.logger = winston.createLogger({
      level: "info",
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      defaultMeta: { service: "discord-bot" },
      transports: [fileTransport],
      handleExceptions: true,
      handleRejections: true,
      exitOnError: false,
      exceptionHandlers: [
        new winston.transports.File({ filename: "logs/exceptions.log" }),
      ],
      rejectionHandlers: [
        new winston.transports.File({ filename: "logs/rejections.log" }),
      ],
    });
    // * Add console transport for development
    if (process.env.NODE_ENV !== "production") {
      this.logger.add(consoleTransport);
    }

    // * check if the environment variable LOGTAIL_ENABLE is set to true
    if (process.env?.LOGTAIL_ENABLE === "true") {
      try {
        // ! Check if the LOGTAIL_SOURCE_TOKEN and LOGTAIL_INGESTION_HOST are set
        if (
          !process.env["LOGTAIL_SOURCE_TOKEN"] ||
          process.env["LOGTAIL_SOURCE_TOKEN"].length <= 1
        )
          throw new Error("Logtail source token is missing");
        // ! Check if the LOGTAIL_INGESTION_HOST is set and in the correct format
        if (
          !process.env["LOGTAIL_INGESTION_HOST"] ||
          process.env["LOGTAIL_INGESTION_HOST"].length <= 1 ||
          !process.env["LOGTAIL_INGESTION_HOST"].includes("https://")
        )
          throw new Error(
            "Logtail ingestion host is missing or invalid format (https://)"
          );

        try {
          const logtail = new Logtail(process.env["LOGTAIL_SOURCE_TOKEN"], {
            endpoint: process.env["LOGTAIL_INGESTION_HOST"],
          });

          this.logger.add(new LogtailTransport(logtail, { level: "info" }));

          // ! Ensure that all logs are sent to Logtail
          logtail.flush();
        } catch (error) {
          this.logger.error("Error in creating logtail instance", error);
        }
      } catch (error) {
        this.logger.error("Error in creating logtail instance", error);
      }
    }
  }

  public static getInstance(): LoggerService {
    if (!LoggerService.instance) {
      LoggerService.instance = new LoggerService();
    }
    return LoggerService.instance;
  }

  public info(message: string, meta?: any): void {
    this.logger.info(message, meta);
  }

  public error(message: string, error?: any): void {
    this.logger.error(message, error);
  }

  public warn(message: string, meta?: any): void {
    this.logger.warn(message, meta);
  }

  public debug(message: string, meta?: any): void {
    this.logger.debug(message, meta);
  }
}
