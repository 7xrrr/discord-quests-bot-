import { config } from "dotenv";
import { ShardingManager } from "discord.js";
import { join } from "path";
import fs from "fs";
import { LoggerService } from "./services/logging/Logger";


try {
  // ! load environment variables
  config();
  // ! create a new static instance of LoggerService
  const logger = LoggerService.getInstance();
  // * check if the bot is running in sharding mode
  if (process.env?.ShARD_ENABLED && process.env.ShARD_ENABLED === "true") {
    // * initialize bot file path
    let botFile;

    // * check if the bot is running in development mode or production mode
    if (__dirname.includes("dist")) {
      // * check if the bot file exists
      if (fs.existsSync(join(__dirname, "bot.js")))
        botFile = join(__dirname, "bot.js");
      else throw new Error("Bot file not found in dist folder (bot.js)");
    } else {
      // * check if the bot is running using bun or node-js
      if (typeof Bun !== "undefined") {
        // * check if the bot file exists
        if (fs.existsSync(join(__dirname, "bot.ts")))
          botFile = join(__dirname, "bot.ts");
        else throw new Error("Bot file not found in src folder (bot.ts)");
      } else {
        // * check if the bot file exists
        if (fs.existsSync(join(__dirname, "bot.ts")))
          botFile = join(__dirname, "bot.ts");
        else if (fs.existsSync(join(__dirname, "bot.js")))
          botFile = join(__dirname, "bot.js");
        else
          throw new Error(
            "Bot file not found in src folder (bot.ts or bot.js)"
          );
      }
    }

    // * check if the environment variable DISCORD_TOKEN is set
    if (!process.env.DISCORD_TOKEN) {
      throw new Error("DISCORD_TOKEN environment variable not set");
    }

    // * initialize manager exec arguments
    let mangerExecArgv = [
      "--optimize_for_size",
      "--gc_interval=100",
      "--max_old_space_size=512",
    ];

    // * check if the bot file is a typescript file and not running using bun to add ts-node/register to exec arguments
    if (
      botFile.endsWith(".ts") &&
      !__dirname.includes("dist") &&
      typeof Bun === "undefined"
    ) {
      mangerExecArgv.push("--require", "ts-node/register");
    }

    // * create a new instance of ShardingManager    
    const manager = new ShardingManager(botFile, {
      respawn: true,
      token: process.env.DISCORD_TOKEN,
      execArgv: mangerExecArgv,
      mode: "process",
    });

    // * log the shard spawn event once the shard is created
    manager.on("shardCreate", (shard) => {
      // * log the shard creation event
      logger.info(`🟢・Shard ${shard.id + 1} created successfully`);
      // * log the shard death event once the shard is destroyed
      shard.on("death", () => {
        logger.error(
          `🚨・Closing shard ${shard.id + 1}/${
            manager.totalShards
          } unexpectedly`
        );
      });
      // * log the shard ready event once the shard is ready
      shard.on("ready", () => {
        logger.info(
          `🟢・Shard ${shard.id + 1}/${manager.totalShards} ready and connected`
        );
      });
      // * log the shard disconnect event once the shard is disconnected
      shard.on("disconnect", () => {
        logger.warn(
          `🚨・Shard ${shard.id + 1}/${manager.totalShards} disconnected`
        );
      });
      // * log the shard reconnecting event once the shard is reconnecting
      shard.on("reconnecting", () => {
        logger.warn(
          `🚨・Shard ${shard.id + 1}/${manager.totalShards} reconnecting`
        );
      });
      // * log the shard spawn event once the shard is spawned
      shard.on("spawn", () => {
        logger.info(`🟢・Shard ${shard.id + 1}/${manager.totalShards} spawned`);
      });
      // * log the shard error event once the shard encounters an error
      shard.on("error", (error) => {
        logger.error(
          `🚨・Shard ${shard.id + 1}/${
            manager.totalShards
          } encountered an error: `,
          error
        );
      });
    });

    // * spawn the shards using the manager
    manager.spawn();
  } else {
    // * run the bot in single process mode
    require("./bot");
  }
} catch (error) {
  console.error(error);
}
