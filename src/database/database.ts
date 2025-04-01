import mongoose from "mongoose";
import { CustomClient } from "../core/Client";
import { LoggerService } from "../services/logging/Logger";
import { CronJob } from "cron";
import { exec, execSync } from "child_process";
import path from "path";
import fs from "fs";
import { CacheService } from "../services/cache/Cache";
import { CommandSettings } from "./models/commandsSettings";
import { Blacklisted } from "./models/blacklisted";
export class MongooseService {
  private static instance: MongooseService;
  private connection: mongoose.Mongoose | undefined;
  private logger = LoggerService.getInstance();
  private backupJob: CronJob | undefined;
  private backupDirectory = path.join(__dirname, "..", "..", "backups");
  private cache = CacheService.getInstance();
  private client = CustomClient.getInstance();

  private constructor() {
    // * Setup backup directory
    if (!fs.existsSync(this.backupDirectory)) {
      fs.mkdirSync(this.backupDirectory);
    }
  }

  public static getInstance(): MongooseService {
    if (!MongooseService.instance) {
      MongooseService.instance = new MongooseService();
    }
    return MongooseService.instance;
  }

  // * A method to connect to the MongoDB database
  public async connect(): Promise<boolean> {
    try {
      // ! check if the MONGO_URL environment variable is set
      if (!process.env?.MONGO_URL) {
        this.logger.error("MONGO_URL environment variable not set", {
          service: "MongooseService",
        });
        return false;
      }

      // * Validate MongoDB URL format
      if (!this.isValidMongoURL(process.env.MONGO_URL)) {
        this.logger.error(
          "Invalid MongoDB URL format. Must start with mongodb:// or mongodb+srv://",
          {
            service: "MongooseService",
          }
        );
        return false;
      }
      // * connect to the mongodb database
      this.connection = await mongoose.connect(process.env.MONGO_URL);

      if (!this.connection) return false;
      this.logger.info(
        `Connected to ${
          process.env.MONGO_URL.includes("localhost") ||
          process.env.MONGO_URL.includes("127.0.0.1")
            ? "Local "
            : "Remote "
        }MongoDB database`,
        {
          service: "MongooseService",
        }
      );
      return true;
    } catch (error) {
      this.logger.error("Failed to connect to MongoDB " + error, {
        service: "MongooseService",
      });
      return false;
    }
  }

  // * A method to shedule a cron job to backup the database
  public async sheduleBackupJob(
    sheducleTime: string = process.env?.BACKUP_CRON || "0 0 * * *"
  ): Promise<void> {
    // * Schedule a cron job to backup the database every 24 hours
    this.backupJob = new CronJob(
      sheducleTime,
      async () => {
        try {
          let backup = await this.backupData();
          if (backup) {
            this.logger.info("Database backup successful At " + new Date(), {
              service: "MongooseService",
            });
          } else {
            this.logger.error("Failed to backup MongoDB At " + new Date(), {
              service: "MongooseService",
            });
          }
        } catch (error) {
          this.logger.error(
            "Failed to backup MongoDB At " + new Date() + " Error : " + error,
            {
              service: "MongooseService",
            }
          );
        }
      },
      null,
      true,
      "UTC"
    );
  }

  // * Helper method to validate MongoDB URL format
  private isValidMongoURL(url: string): boolean {
    return url.startsWith("mongodb://") || url.startsWith("mongodb+srv://");
  }

  public async disconnect(): Promise<void> {
    try {
      await mongoose.disconnect();
      this.logger.info("Disconnected from MongoDB", {
        service: "MongooseService",
      });
    } catch (error) {
      this.logger.error("Failed to disconnect from MongoDB " + error, {
        service: "MongooseService",
      });
      throw error;
    }
  }

  // * A Helper method to check if the MongoDB tools are installed
  public async checkTools(): Promise<boolean> {
    try {
      return new Promise((resolve, reject) => {
        exec("mongodump --version", async (error, stdout, stderr) => {
          if (error) {
            this.logger.error("MongoDB tools not found", {
              service: "MongooseService",
            });
            reject(false);
          }
          resolve(true);
        });
      });
    } catch (error) {
      this.logger.error("Failed to check MongoDB tools " + error, {
        service: "MongooseService",
      });
      return false;
    }
  }

  // * A Helper method to backup the database data and store it in the backup directory
  public async backupData(
    backupURL: string = process.env?.MONGO_URL || ""
  ): Promise<boolean> {
    // ! check if the MONGO_URL environment variable is set
    if (!backupURL || backupURL.length <= 1) {
      this.logger.error("MONGO_URL environment variable not set", {
        service: "MongooseService",
      });
      return false;
    }
    // * Validate MongoDB URL format
    if (!this.isValidMongoURL(backupURL)) {
      this.logger.error(
        "Invalid MongoDB URL format. Must start with mongodb:// or mongodb+srv://",
        {
          service: "MongooseService",
        }
      );
      return false;
    }

    try {
      // * execute the mongodump command to backup the database
      return new Promise((resolve, reject) => {
        exec(
          `mongodump --uri="${backupURL}" --out="${this.backupDirectory}"`,
          (error, stdout, stderr) => {
            if (error) {
              this.logger.error("MongoDB tools not found", {
                service: "MongooseService",
              });
              reject(false);
            }

            this.logger.info(
              "Database backup successful " +
                stderr.split("\n")[1].split("\t")[1],
              {
                service: "MongooseService",
              }
            );

            resolve(true);
          }
        );
      });
    } catch (error) {
      this.logger.error("Failed to backup MongoDB " + error, {
        service: "MongooseService",
      });
      return false;
    }
  }

  // * A Helper method to restore the database data from the backup directory
  public async restoreData(
    backupUrl: string | undefined = process.env?.BACKUP_MONGO_URL
  ): Promise<boolean> {
    // ! check if the backupUrl is set
    if (
      !backupUrl ||
      !this.isValidMongoURL(backupUrl) ||
      backupUrl?.length <= 1
    ) {
      this.logger.error("Invalid MongoDB URL format", {
        service: "MongooseService",
      });
      return false;
    }

    // * check if the MongoDB tools are installed
    if (!(await this.checkTools())) {
      this.logger.error("MongoDB tools not found", {
        service: "MongooseService",
      });
      return false;
    }

    // * check if the backup file existsq
    let backupFile = path.join(
      this.backupDirectory,
      this.databaseName(),
      this.databaseName() + ".bson"
    );
    if (!fs.existsSync(backupFile)) {
      this.logger.error("Backup file not found", {
        service: "MongooseService",
      });
      return false;
    }

    return new Promise((resolve, reject) => {
      exec(
        `mongorestore --uri="${backupUrl}" --drop "${backupFile}"`,
        (error, stdout, stderr) => {
          if (error) {
            this.logger.error("MongoDB tools not found", {
              service: "MongooseService",
            });
            reject(false);
          }

          this.logger.info(
            `Database restore successful \x1b[33m${stderr
              .split("\n")
              [stderr.split("\n").length - 2].split(" ")}\x1b[0m`,

            {
              service: "MongooseService",
            }
          );
          resolve(true);
        }
      );
    });
  }

  public databaseName(): string {
    return mongoose.connection.db.databaseName;
  }

  /**
   * Cache commands and blacklist data from the database
   * @param ttl Optional TTL in seconds (default: 1 hour)
   * @returns Information about cached data
   */
  public async cacheData(): Promise<{
    success: boolean;
    totalCached: number;
    data?: {
      commands: number;
      blacklist: number;
    };
    error?: string;
  }> {
    try {
      // *Check if MongoDB connection exists
      if (!mongoose.connection || mongoose.connection.readyState !== 1) {
        this.logger.error("Cannot cache data - No MongoDB connection", {
          service: "MongooseService",
        });
        return {
          success: false,
          error: "No database connection",
          totalCached: 0,
        };
      }

      // * Get commands from database
      const CommandModel = await CommandSettings.find();
      const BlacklistModel = await Blacklisted.find();

      // * Cache commands and blacklist data

      CommandModel.map((command) => {
        if (this.client.commands.has(command.commandName)) {
          this.client.commands.get(command.commandName)?.setSettings(command);
        }
      });
      BlacklistModel.map((blacklist) => {
        this.client.blacklisted.set(blacklist.userID, blacklist);
      });

      this.printCacheChanged({
        commands: CommandModel.length,
        blacklist: BlacklistModel.length,
      });
      return {
        success: true,
        totalCached: CommandModel.length + BlacklistModel.length,
        data: {
          commands: CommandModel.length,
          blacklist: BlacklistModel.length,
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message, totalCached: 0 };
    }
  }

  protected printCacheChanged({
    commands,
    blacklist,
  }: {
    commands: number;
    blacklist: number;
  }) {
    this.logger.info(
      `\x1b[33m${commands} commands\x1b[0m and \x1b[33m${blacklist} blacklisted users\x1b[0m cached`,
      {
        service: "MongooseService",
      }
    );
  }
}
