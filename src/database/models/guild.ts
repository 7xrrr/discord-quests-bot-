import { Schema, model, Document } from "mongoose";

export interface iGuild extends Document {
    guildId: string;
    notification: {
        enabled: boolean;
        rankUpChannel?: string | null;
        rankDownChannel?: string | null;
        highPlayerRankUpChannel?: string | null;
        highPlayerRankDownChannel?: string | null;
    };
}

const GuildSchema = new Schema<iGuild>(
    {
        guildId: { type: String, required: true, unique: true },
        notification: {
            enabled: { type: Boolean, default: false },
            rankUpChannel: { type: String, default: null },
            rankDownChannel: { type: String, default: null },
            highPlayerRankUpChannel: { type: String, default: null },
            highPlayerRankDownChannel: { type: String, default: null },
        }
    },
    { timestamps: true }
);

const GuildModel = model<iGuild>("Guild", GuildSchema);
export default GuildModel;
