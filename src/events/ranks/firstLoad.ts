import { Client, ClientEvents, Events } from "discord.js";
import { baseDiscordEvent } from "../../core/Event";
import { settingsMain, SettingsManager } from "../../class/settingsManager";
import { RewardManager } from "../../class/rewardManager";
import schedule from "node-schedule";

export default class ReadyEvent extends baseDiscordEvent {
  name: keyof ClientEvents = Events.ClientReady;
  once = true; // Should only fire once on startup

  private scheduledJob: schedule.Job | null = null;
  private settingsUpdateListener: (() => void) | null = null;

  private async initializeServices() {
    try {
      await Promise.all([
        SettingsManager.loadUp(),
        RewardManager.loadRewards(),
      ]);
    } catch (error) {
      this.logger.error("Failed to initialize services:", error);
      throw error;
    }
  }

  private scheduleLeaderboardUpdate(client: Client<true>) {
    // Clear existing job if it exists
    if (this.scheduledJob) {
      this.scheduledJob.cancel();
    }

    const now = Date.now();
    let nextUpdate = SettingsManager.lastRefresh + SettingsManager.refreshTime;

    console.log("Last Refresh:", SettingsManager.lastRefresh);
    console.log("Refresh Interval:", SettingsManager.refreshTime);
    console.log("Calculated Next Update:", nextUpdate);
    console.log("Current Time:", now);

    if (nextUpdate <= now) {
      this.logger.warn("Next leaderboard update time is in the past. Triggering now.");
      client.emit("leaderboardUpdate");

      // Reschedule for the next interval based on the current time
      nextUpdate = now + SettingsManager.refreshTime;
    }

    const nextUpdateDate = new Date(nextUpdate);
    this.scheduledJob = schedule.scheduleJob(nextUpdateDate, () => {
      try {
        client.emit("leaderboardUpdate");
        this.logger.info(`Triggered leaderboard update at ${new Date().toISOString()}`);

        // Reschedule for the next interval
        this.scheduleLeaderboardUpdate(client);
      } catch (error) {
        this.logger.error("Error in leaderboard update:", error);
      }
    });

    this.logger.info(`Next leaderboard update scheduled for: ${nextUpdateDate}`);
  }

  private setupSettingsListener(client: Client<true>) {
    // Remove existing listener if it exists
    if (this.settingsUpdateListener) {
      settingsMain.off("update", this.settingsUpdateListener);
    }

    this.settingsUpdateListener = () => {
      this.logger.info("Settings updated - rescheduling leaderboard update");
      this.scheduleLeaderboardUpdate(client);
    };

    settingsMain.on("update", this.settingsUpdateListener);
  }

  async executeEvent(client: Client<true>) {
    try {
      await this.initializeServices();
      this.setupSettingsListener(client);
      this.scheduleLeaderboardUpdate(client);

      this.logger.info(`Bot ready as ${client.user.tag}`);
    } catch (error) {
      this.logger.error("Error in ready event:", error);
    }
  }

  // Clean up when the event is unloaded
  cleanup() {
    if (this.scheduledJob) {
      this.scheduledJob.cancel();
      this.scheduledJob = null;
    }

    if (this.settingsUpdateListener) {
      settingsMain.off("update", this.settingsUpdateListener);
      this.settingsUpdateListener = null;
    }
  }
}
