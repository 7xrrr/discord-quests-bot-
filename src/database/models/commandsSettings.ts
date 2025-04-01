import { Schema, model, Document, Model } from "mongoose";

export interface ICommandSettings extends Document {
  commandName: string;
  help: {
    description: string;
    usage: string;
    example: string;
    Gif: string;
  };

  enabled: boolean;

  cooldown: number;
  category: string;

  requiredPermission: bigint;
  requiredRoles: Map<string, string>;
}

const CommandSettingsSchema = new Schema<ICommandSettings>({
  commandName: {
    type: String,
    unique: true,
    required: true,
  },
  help: {
    description: {
      type: String,
    },
    usage: {
      type: String,
    },
    example: {
      type: String,
    },
    Gif: {
      type: String,
    },
  },
  enabled: {
    type: Boolean,
    default: true,
  },
  cooldown: {
    type: Number,
    default: 3000,
  },
  category: {
    type: String,
    default: "General",
  },
  requiredPermission: {
    type: BigInt,
  },
  requiredRoles: {
    type: Map,
    of: String,
    default: new Map(),
  },
});

export const CommandSettings: Model<ICommandSettings> = model<ICommandSettings>(
  "CommandSettings",
  CommandSettingsSchema
);
