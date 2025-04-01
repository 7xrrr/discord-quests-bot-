import {
  ClientOptions,
  Collection,
  Client as DiscordClient,
  GatewayIntentBits,
  Partials,
} from "discord.js";
import { Command } from "./Command";
import { EventHandler } from "../handlers/EventHandler";
import { CommandHandler } from "../handlers/CommandHandler";
import { IBlacklisted } from "../database/models/blacklisted";
import config from "../config/config";
export class CustomClient extends DiscordClient {
  public config = config;
  
  public cooldowns: Collection<
    string,
    {
      command: string;
      userID: string;
      expiresAt: number;
      replyed: boolean;
    }
  > = new Collection();
  public blacklisted: Collection<string, IBlacklisted> = new Collection();

  static instance: CustomClient;

  public commands: Collection<string, Command> = new Collection();

  private eventsLoaded: boolean = false;
  private commandsLoaded: boolean = false;
  private databaseLoaded: boolean = false;
  private servicesLoaded: boolean = false;
  private BotIsReady: boolean = false;
  //   public registry: Registry;

  constructor(options: ClientOptions) {
    super(options);
    // this.registry = new Registry(this);
    // new CommandHandler().loadCommands();
    // new EventHandler().loadEvents();
  }

  public static getInstance(): CustomClient {
    if (!CustomClient.instance) {
      CustomClient.instance = new CustomClient({
        intents: [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildMessages,
          GatewayIntentBits.GuildMembers,
          GatewayIntentBits.MessageContent,
        ],
        partials: [
          Partials.Message,
          Partials.Channel,
          Partials.GuildMember,
          Partials.User,
        ],
      });
    }
    return CustomClient.instance;
  }

  public async initialize(): Promise<void> {
    await this.login(process.env.DISCORD_TOKEN);
  }

  public registerAll() {
    new CommandHandler().loadCommands();
    new EventHandler().loadEvents();
  }

  public getisBotReady(): boolean {
    return this.BotIsReady;
  }
  public getisEventsLoaded(): boolean {
    return this.eventsLoaded;
  }
  public getisCommandsLoaded(): boolean {
    return this.commandsLoaded;
  }
  public getisDatabaseLoaded(): boolean {
    return this.databaseLoaded;
  }
  public getisServicesLoaded(): boolean {
    return this.servicesLoaded;
  }

  public setisBotReady(value: boolean) {
    this.BotIsReady = value;
  }
  public setisEventsLoaded(value: boolean) {
    this.eventsLoaded = value;
  }
  public setisCommandsLoaded(value: boolean) {
    this.commandsLoaded = value;
  }
  public setisDatabaseLoaded(value: boolean) {
    this.databaseLoaded = value;
  }
  public setisServicesLoaded(value: boolean) {
    this.servicesLoaded = value;
  }
}
