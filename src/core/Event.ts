import type { ClientEvents } from "discord.js";
import { LoggerService } from "../services/logging/Logger";
import { CacheService } from "../services/cache/Cache";
import { CustomClient } from "./Client";
export abstract class baseDiscordEvent {
  public name: keyof ClientEvents;
  public once: boolean;

  protected logger = LoggerService.getInstance();
  protected cache = CacheService.getInstance();
  protected customClient = CustomClient.getInstance();

  
  constructor(name: keyof ClientEvents, once: boolean) {
    this.name = name;
    this.once = once;
  }

  abstract executeEvent(
    ...args: ClientEvents[keyof ClientEvents]
  ): Promise<void> | void;
}
