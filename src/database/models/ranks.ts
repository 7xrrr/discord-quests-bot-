import { Schema, model, Document } from "mongoose";
import config from "../../config";

// Reward type for ranks
export enum rewardType {
    role = 1,
    message = 2,
    badge = 3
}

interface RankReward {
    type: rewardType;
    value: string;
}

interface Decay {
    decay: boolean;
    decayRate: number;
    decayInterval: number;
    inActiveTime: number;
}

interface Promotion {
    type: "auto" | "competitive"; // Auto = regular promotions, Competitive = Master/Elite swap
    interval: number; // Time interval in milliseconds
}

export interface IRank extends Document {
    rankId: string;
    name: string;
    pointsRequirement: number;
    deleted?: boolean;


    theme: {
        colorMain: string;
        colorSecondary: string;
    }
    decay?: Decay;
    maxUsers?: number;
    rewards?: string[];
    promotion?: Promotion;
}

const RankSchema = new Schema<IRank>(
    {
        rankId: { type: String, required: true, unique: true },
        name: { type: String, required: true },
        pointsRequirement: { type: Number, required: true },
        deleted: { type: Boolean, default: false },
        decay: {
            decay: { type: Boolean, default: false },
            decayRate: { type: Number, default: config.decay.decayRate },
            decayInterval: { type: Number, default: config.decay.decayInterval },
            inActiveTime: { type: Number, default: config.decay.inActiveTime }
        },
        theme: {
            colorMain: { type: String, default: "#000000" },
            colorSecondary: { type: String, default: "#000000" }
        },
        maxUsers: { type: Number, default: 0 },
        rewards: { type: [String], default: [] },
        promotion: {
            type: { type: String, enum: ["auto", "competitive"], default: "auto" },
            interval: { type: Number, default: 0 }
        }
    },
    { timestamps: true }
);

const RankModel = model<IRank>("Rank", RankSchema);
export default RankModel;
