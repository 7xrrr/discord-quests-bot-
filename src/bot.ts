import { config } from "dotenv";
import { CustomClient } from "./core/Client";
import { MongooseService } from "./database/database";
import { LoggerService } from "./services/logging/Logger";
import { cli } from "winston/lib/winston/config";
import { ProfileMaker } from "./class/profileMaker";
export const startTimestamp = Date.now();
import fs from "fs"
config();
// * Create a new static instance of LoggerService
const logger = LoggerService.getInstance();

// * Initialize the client with required intents and partials
export const client = CustomClient.getInstance();

// * Setup global error handlers first
process.on("unhandledRejection", (error) => {
  logger.error(
    `Custom Unhandled Rejection: ${
      error instanceof Error ? error.message : String(error)
    }`,
    {
      service: "Process",
      error,
    }
  );
});

process.on("uncaughtException", (error) => {
  console.log(error);
  
  logger.error(`Custom Uncaught Exception: ${error.message}`, {
    service: "Process",
    error,
  });
});


// * Attempt database connection but continue even if it fails
(async () => {
  try {    
    // * Register all commands and events
    client.registerAll();


    // * connect to the MongoDB database
    const mongo = MongooseService.getInstance();
    const dbConnected = await mongo.connect();

    if (!dbConnected) {
      logger.warn("Starting bot without database connection", {
        service: "DatabaseService",
      });
    } else {
      client.setisDatabaseLoaded(dbConnected);
    /*  let profile = await ProfileMaker.createProfile("527826654660132890");
    
      const progress = profile?.svg;
      if(progress) {
        await fs.writeFileSync(`527826654660132890.svg`, progress);
        console.log(`Progress for "527826654660132890" saved`);
      }
     
      setInterval(async () => {
        profile = await ProfileMaker.createProfile("527826654660132890");
      
      const progress = profile?.svg;
      if(progress) {
        await fs.writeFileSync(`527826654660132890.svg`, progress);
        console.log(`Progress for "527826654660132890" saved`);
      }
        
      }, 2000);*/
      logger.info("Database connection successful", {
        service: "DatabaseService",
      });
      
      

      let cacheData = await mongo.cacheData();

      if (cacheData && cacheData.success) {
        if (cacheData.totalCached < 1) {
          logger.warn("No data cached", {
            service: "DatabaseService",
          });
        } else {
          if (cacheData.data) {
            for (const [key, value] of Object.entries(cacheData.data)) {
              logger.info(
                `Total \x1b[32m${key}\x1b[0m cached: \x1b[32m${value}\x1b[0m`,
                {
                  service: "DatabaseService",
                }
              );
            }
          }
        }
      } else {
        logger.error("Failed to cache data", {
          service: "DatabaseService",
        });
      }
    }
  } catch (error: any) {
    logger.error(`Database connection failed: ${error.message}`, {
      service: "DatabaseService",
      error,
    });
  }

  // * Initialize client after database connection attempt
  try {
    client.initialize();
    logger.info("Bot initialization successful", {
      service: "Bot",
    });
  } catch (error: any) {
    logger.error(`Bot initialization failed: ${error.message}`, {
      service: "Bot",
      error,
    });
  }
})();
