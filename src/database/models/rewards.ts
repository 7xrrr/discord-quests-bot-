import { APIMessage } from "discord.js";
import { Schema, model, Document } from "mongoose";

interface Reward extends Document {
    name: string;
    id: string;
    roleId: string;
    messageURL: string;
    payload: APIMessage;
    deleted: boolean;
    dmMessage: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

const RewardSchema = new Schema<Reward>(
    {
        name: { type: String, required: true },
        id: { type: String, required: true },
        roleId: { type: String, required: false },
        messageURL: { type: String, required: true },
        payload: { type: Object, required: true },
        dmMessage: { type: Boolean, required: false, default: false },
        deleted: { type: Boolean, default: false },
    },
    { timestamps: true }
);

const RewardModel = model<Reward>("Reward", RewardSchema);

export { RewardModel, Reward };
