import { APIMessage, Collection, SnowflakeUtil } from "discord.js";
import { RewardModel, Reward as IReward } from "../database/models/rewards";
import EventEmitter from "events";

const rewardsCache = new Collection<string, Reward>();

export class RewardManager {
    static async loadRewards() {
        const rewards = await RewardModel.find({
            $or: [
                { deleted: false },
                { deleted: { $exists: false } }
            ]
        });
        rewardsCache.clear();
        rewards.forEach(rewardDoc => {
            const reward = new Reward(rewardDoc);
            rewardsCache.set(rewardDoc.id, reward);
        });
    }

    static async getRewards(force: boolean = false): Promise<Collection<string, Reward>> {
        if (force || rewardsCache.size === 0) {
            await this.loadRewards();
        }
        return rewardsCache;
    }

    static async getReward(query: string, force: boolean = false): Promise<Reward | undefined> {
        if (force || rewardsCache.size === 0) {
            await this.loadRewards();
        }
        return rewardsCache.find(reward => reward.name === query || reward.id === query);
    }

    static async createReward({
        name = "Unnamed Reward",
        roleId = null,
        messageURL = null,
        payload = {}
    }: {
        name: string;
        roleId?: string | null;
        messageURL?: string | null;
        payload: Record<string, any>;
    }) {
        const id = SnowflakeUtil.generate().toString();
        const rewardDoc = new RewardModel({
            name,
            id,
            roleId,
            messageURL,
            payload
        });
    
        await rewardDoc.save(); // Ensure it's saved to the database
        const reward = new Reward(rewardDoc);
        rewardsCache.set(id, reward);
        return reward;
    }
}    

export class Reward extends EventEmitter {
    rewardDoc: IReward;
    onSave: boolean = false;
    changes: string[] = [];
    
    constructor(data: IReward) {
        super();
        this.rewardDoc = data;
    }

    get name() {
        return this.rewardDoc.name;
    }
    set name(value: string) {
        this.rewardDoc.name = value;
        this.markModified("name");
        this.save();
    }
    get dmMessage() {
        return this.rewardDoc.dmMessage;
    }
    set dmMessage(value: boolean) {
        this.rewardDoc.dmMessage = value;
        this.markModified("dmMessage");
        this.save();
    }

    get roleId() {
        return this.rewardDoc.roleId;
    }
    set roleId(value: string) {
        this.rewardDoc.roleId = value;
        this.markModified("roleId");
        this.save();
    }

    get messageURL() {
        return this.rewardDoc.messageURL;
    }
    set messageURL(value: string) {
        this.rewardDoc.messageURL = value;
        this.markModified("messageURL");
        this.save();
    }

    get payload():APIMessage {
      
        return this.rewardDoc.payload 
    }
    set payload(value: APIMessage) {
        this.rewardDoc.payload = value;
        this.markModified("payload");
        this.save();
    }

    get id() {
        return this.rewardDoc.id;
    }
    set id(value: string) {
        this.rewardDoc.id = value;
        this.markModified("id");
        this.save();
    }

    async delete() {
        this.rewardDoc.deleted = true;
        this.markModified("deleted");
        this.emit("delete");
        await this.save();
        rewardsCache.delete(this.rewardDoc.id);
        this.destroy();
    }

    async save(): Promise<void> {
        if (this.onSave) return;
        this.onSave = true;
        return new Promise((resolve, reject) => {
            setTimeout(async () => {
                try {
                    await this.rewardDoc.save();
                    this.onSave = false;
                    console.log(`Reward ${this.rewardDoc.id} saved.`);
                    this.emit("update");
                    resolve();
                } catch (error) {
                    console.error(`Error saving reward ${this.rewardDoc.id}:`, error);
                    this.onSave = false;
                    reject(error);
                }
            }, 2500);
        });
    }

    markModified(path: string): void {
        this.rewardDoc.markModified(path);
        if (!this.changes.includes(path)) this.changes.push(path);
    }

    destroy(): void {
        try {
            this.removeAllListeners();
            Object.keys(this).forEach((key) => {
                (this as any)[key] = undefined;
            });
            Object.setPrototypeOf(this, null);
        } catch (error) {
            console.error(`[Reward] Error destroying reward ${this.id}:`, error);
        }
    }
}