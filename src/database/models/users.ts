import { Schema, model, Document } from "mongoose";

export interface SuspendedInfo {
    status: boolean;
    expire?: number;
    date?: number;
    reason?: string;
    staff?: {
        username?: string;
        id?: string;
    };
}

export interface Rank {
    id: string;
    name: string;
}

interface SeasonXP {
    points: number;
    lastActive: Date;
    position?: number;
    rank?: Rank;
    decay?: {
        last: number;
        next: number;
        active: boolean;
    },
    
    messagesCount?: number;
    characterCount?: number;
    wordsCount?: number;
    suspended: SuspendedInfo;
}

interface XPData {
    totalPoints: number;
    totalMessages: number;
    totalCharacters: number;
    seasons: { [key: string]: SeasonXP }; // Normal object instead of Map
}

interface ActiveDayStats {
    xp: number;
    messageCount: number;
    characterCount: number;
    wordsCount: number;
}
export interface HistoryEntry {
    action: string;
    description: string;
    id?: string,
    newValue: any;
    oldValue: any;
    staff: {
        username?: string;
        id?: string;
    };
    date?: number;
}


export interface IUser extends Document {
    _id: string;
    userId: string;
    xp: number;
    level: number;
    activeDays: { [key: string]: ActiveDayStats }; // Normal object instead of Map
    lastDecay: number;
    suspended: SuspendedInfo;
    ranking: XPData;
    history: HistoryEntry[],
    createdAt: Date;
}







const UserSchema = new Schema<IUser>(
    {
        _id: { type: String, required: true },
        userId: { type: String, required: true },
        activeDays: { type: Object, default: {} }, // Using a plain object instead of a Map
        level: { type: Number, default: 0 },
        suspended: {
            status: { type: Boolean, default: false },
            expire: { type: Number },
            date: {type:Number},
            reason: { type: String },
            staff: {
                username: { type: String },
                id: { type: String },
            },
        },
        history: {
            type: [
                {
                    id: String,
                    action: String,
                    description: String,
                    newValue: Schema.Types.Mixed,
                    oldValue: Schema.Types.Mixed,
                    staff: {
                        username: String,
                        id: String,
                    },
                    date: Number,
                }
            ],
            default: [],
        },
        xp: { type: Number, default: 0 },
        ranking: {
            totalPoints: { type: Number, default: 0 },
            totalMessages: { type: Number, default: 0 },
            totalCharacters: { type: Number, default: 0 },
            seasons: { type: Object, default: {} }, // Using a plain object instead of a Map
        },
        
    },
    { timestamps: true }
);

// Ensure userId is always assigned to _id when creating documents
UserSchema.pre("save", function (next) {
    if (!this._id) {
        this._id = this.userId;
    }
    next();
});

const UserModel = model<IUser>("User", UserSchema);
export default UserModel;
