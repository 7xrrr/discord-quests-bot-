import {
  AutocompleteInteraction,
  CommandInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from "discord.js";
import { CustomClient } from "./Client";
import { LoggerService } from "../services/logging/Logger";
import { CacheService } from "../services/cache/Cache";
import { ICommandSettings } from "../database/models/commandsSettings";

export abstract class Command {
  public enabled: boolean = true;

  protected logger = LoggerService.getInstance();
  protected cache = CacheService.getInstance();
  protected client: CustomClient = CustomClient.getInstance();

  public data!:
    | SlashCommandBuilder
    | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">
    | SlashCommandSubcommandsOnlyBuilder
    | SlashCommandOptionsOnlyBuilder;
  public help!: {
    description: string;
    usage: string;
    example: string;
    Gif: string;
  };

  public subCommandName?: string;
  public isSubcommand: boolean = false;
  public isSubcommandGroup: boolean = false;

  public cooldown: number = 3000;
  public category: string = "General";

  public requiredPermission?: bigint;
  public requiredRoles: Map<string, string> = new Map();
  public ownerOnly: boolean = false;

  public hasAutocomplete: boolean = false;
  public name = this.isSubcommand && this.subCommandName ? `${this?.data?.name}-${this?.subCommandName}` : this?.data?.name;
  constructor() {

  }

  abstract execute(interaction: CommandInteraction): Promise<void>;

  autocomplete?(interaction: AutocompleteInteraction): Promise<void>;

  setSettings(ICommandSettings: ICommandSettings): void {
    this.cooldown = ICommandSettings.cooldown;
   
    this.category = ICommandSettings.category;
    this.requiredPermission = ICommandSettings.requiredPermission;
    this.requiredRoles = ICommandSettings.requiredRoles;
    this.help = ICommandSettings.help;
    this.enabled = ICommandSettings.enabled;
  }
}

// export type CommandContext = {
//   cache: typeof CacheService.prototype;
//   db: typeof Database.prototype;
//   logger: typeof Logger.prototype;
//   startTime: number;
// };
