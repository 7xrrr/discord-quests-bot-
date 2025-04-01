import { Schema, model, Document } from "mongoose";

export interface iSeason extends Document {
    seasonId: number;
    startDate: number;
    endDate: number;
    ended: boolean;
    current: boolean;
    end: {
        reason: string;
        staff:{
            id: string;
            username: string;
        }
        date: Number;
    }
    rewards: {
        rankId: string;
        reward: string;
    }[];
}

const SeasonSchema = new Schema<iSeason>(
    {
        seasonId: { type: Number, required: true, unique: true },
        startDate: { type: Number, required: false },
        endDate: { type: Number, required: false },
        ended: { type: Boolean, default: false },
        current: { type: Boolean, default: false },
        end: {
            reason: { type: String,  },
            date: { type: Date, default: null },
            staff: {
                id: { type: String,  },
                username: { type: String, },
            },
        },
        rewards: [
            {
                rankId: { type: String, required: false },
                reward: { type: String, required: false },
            },
        ],
    },
    { timestamps: true }
);

const SeasonModel = model<iSeason>("Seasons", SeasonSchema);
export default SeasonModel;
