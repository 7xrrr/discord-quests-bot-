import { Schema, model, Document } from "mongoose";
import config from "../../config";

export interface iSettings extends Document {
    firstLoad: boolean,
    decayEnabled: boolean,
    globalLock: boolean,
    lastRefresh: number
    forceDisable: boolean,
    refreshTime: number

}

const SettingsSchema = new Schema<iSettings>(
    {
        firstLoad: { type: Boolean, default: false },

        decayEnabled: { type: Boolean, default: true },
        forceDisable: { type: Boolean, default: false },
        globalLock: { type: Boolean, default: false },
        lastRefresh: { type: Number, default: 0 },
        refreshTime: { type: Number, default: config.leaderboard.interval },
    },
    { timestamps: true }
);

const SettingsModel = model<iSettings>("Settings", SettingsSchema);
export default SettingsModel;
