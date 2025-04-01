import { Schema, model, Document, Model } from "mongoose";

export interface IBlacklisted extends Document {
  userID: string;
  guildID: string;

  xp: boolean;
  commands: boolean;
}

export const BlacklistedSchema = new Schema<IBlacklisted>({
  userID: {
    type: String,
    required: true,
  },
  guildID: {
    type: String,
    required: true,
  },

  xp: {
    type: Boolean,
    default: true,
  },
  commands: {
    type: Boolean,
    default: false,
  },
});

export const Blacklisted: Model<IBlacklisted> = model<IBlacklisted>(
  "Blacklisted",
  BlacklistedSchema
);
