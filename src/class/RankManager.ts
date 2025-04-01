import { Collection, SnowflakeUtil } from "discord.js";
import RankModel, { IRank } from "../database/models/ranks";
import config from "../config";
import ms from "ms";
import EventEmitter from "events";
import { PlayerManager } from "./PlayerManager";





const ranksCache = new Collection<string, Rank>();
export class rankManager {
    static async loadRanks() {
        const ranks = await RankModel.find({
            $or: [
                { deleted: false }, // Explicitly marked as not deleted
                { deleted: { $exists: false } } // Doesn't have the field
            ]
        });
        ranksCache.clear();
        ranks.forEach(rankDoc => {
            const rank = new Rank(rankDoc);

            ranksCache.set(rankDoc.rankId, rank);
        });

    }

    static async getRanks(force: boolean = false): Promise<Collection<string, Rank>> {
        if (force || ranksCache.size === 0) {
            await this.loadRanks();
        }
        return ranksCache.sort((a, b) => a.pointsrequirements - b.pointsrequirements);

    }
    static async getRank(query: string, force: boolean = false): Promise<Rank | undefined> {
        if (force || ranksCache.size === 0) {
            await this.loadRanks();
        }
        return ranksCache.find(rank => rank.name === query || rank.rankId === query);
    }
    static async createRank(name: string, pointsRequirement: number, color: string) {
        const docSave = await new RankModel({ rankId: SnowflakeUtil.generate().toString(), name: name, pointsRequirement: pointsRequirement, theme: { colorMain: color, colorSecondary: color }, promotion: { type: "auto", interval: 0 }, }).save()
        const rank = new Rank(docSave);
        ranksCache.set(docSave.rankId, rank);
        return rank?.rankId ? rank : null;
    }

}


export class Rank extends EventEmitter {
    rankDoc: IRank;
    onSave: boolean = false;
    changes: string[] = [];
    changesTools: Record<string, Function> = {
        pointsRequirement: () => PlayerManager.updatePlayersRankPoints(this.rankId),
        name: () => PlayerManager.updatePlayersRankNames(this.rankId),
    };
    constructor(data: IRank) {
        super();
        this.rankDoc = data;

    }
    get pointsrequirements(): number {
        return this.rankDoc.pointsRequirement;
    }
    set pointsrequirements(Value: number) {
        this.rankDoc.pointsRequirement = Value;
        this.markModified("pointsRequirement");
        this.save();
    }
    get deleted() {
        return this.rankDoc.deleted || false;
    }
    async delete() {
        this.rankDoc.deleted = true;
        this.markModified("deleted");

        this.emit("delete");
        await this.save();
        ranksCache.delete(this.rankDoc.rankId);
        this.destroy();



    }
    get name() {
        return this.rankDoc.name;
    }
    set name(value: string) {
        this.rankDoc.name = value;
        this.markModified("name");
        this.save();
    }
    get colorMain() {
        return this.rankDoc.theme.colorMain || "#000000";
    }
    set colorMain(value: string) {
        this.rankDoc.theme.colorMain = value;
        this.markModified("theme.colorMain");
        this.save();
    }
    get colorSecondary() {
        return this.rankDoc?.theme?.colorSecondary || "#000000";
    }
    set colorSecondary(value: string) {
        this.rankDoc.theme.colorSecondary = value;
        this.markModified("theme.colorSecondary");
        this.save();
    }
    get rankId() {
        return this.rankDoc.rankId;
    }

    set rewards(value: string[] | string) {
        if (!this.rankDoc.rewards) this.rankDoc.rewards = [];
        this.rankDoc.rewards = [...value]
        this.markModified("rewards");
        this.save();

    }
    get rewards() {
        return this.rankDoc?.rewards || [];
    }
    get promoteMode() {
        return this.rankDoc.promotion?.type || "auto"
    }
    set decayInterval(value: number) {
        if (!this.rankDoc.decay) { this.rankDoc.decay = { decay: false, decayInterval: config.decay.decayInterval, decayRate: config.decay.decayRate, inActiveTime: config.decay.inActiveTime }; }// Ensure decay object exists }

        this.rankDoc.decay.decayInterval = value;
        this.markModified("decay");
        this.save();
    }
    set decayRate(value: number) {
        if (!this.rankDoc.decay) { this.rankDoc.decay = { decay: false, decayInterval: config.decay.decayInterval, decayRate: config.decay.decayRate, inActiveTime: config.decay.inActiveTime }; }// Ensure decay object exists }
        this.rankDoc.decay.decayRate = value >= 100 ? 100 : value < 0 ? 0 : value;
        this.markModified("decay");
        this.save();
    }
    set inActiveTime(value: number) {
        if (!this.rankDoc.decay) { this.rankDoc.decay = { decay: false, decayInterval: config.decay.decayInterval, decayRate: config.decay.decayRate, inActiveTime: config.decay.inActiveTime }; }// Ensure decay object exists }
        this.rankDoc.decay.inActiveTime = value < ms("5m") ? ms("5m") : value
        this.markModified("decay");
        this.save();
    }

    set promoteMode(mode: "auto" | "competitive") {
        if (!this.rankDoc.promotion) this.rankDoc.promotion = {
            interval: 0,
            type: "auto"
        };
        this.rankDoc.promotion.type = mode;
        this.markModified("promotion");
        this.save();

    }
    get decay() {
        return this.rankDoc.decay?.decay === true;
    }
    set decay(value: boolean) {
        if (!this.rankDoc.decay) this.rankDoc.decay = {
            decay: false,
            decayInterval: 0,
            decayRate: 0,
            inActiveTime: 0
        };
        this.rankDoc.decay.decay = value;
        this.markModified("decay");
        this.save();
    }
    get decayRate() {
        return this.rankDoc.decay?.decayRate || 0;
    }

    get limit() {
        return this.rankDoc.maxUsers || 0;
    }
    set limit(value: number) {
        this.rankDoc.maxUsers = value;
        this.markModified("maxUsers");
        this.save();
    }
    async save(): Promise<void> {
        if (this.onSave) return;

        this.onSave = true;
        return new Promise((resolve, reject) => {
            setTimeout(async () => {
                try {
                    await this.rankDoc.save();
                    this.onSave = false;
                    console.log(`Rank ${this.rankDoc.rankId} saved.`);
                    this.emit("update");
                    for (const key of this.changes) {
                        if (this.changesTools[key]) {
                            this.changesTools[key]();
                        }
                    }
                    if (this.changes.length > 0) this.changes = [];
                    resolve();

                } catch (error) {
                    console.error(`Error saving rank ${this.rankDoc.rankId}:`, error);
                    this.onSave = false
                    reject(error);
                }
            }, 2500);
        })
    };

    markModified(path: string | string[]): void {
        const pathArray = Array.isArray(path) ? path : [path];
        for (const path of pathArray) {
            this.rankDoc.markModified(path);
            if (!this.changes.includes(path)) this.changes.push(path);
        }
    }
    destroy(): void {

        try {
            this.removeAllListeners();



            Object.keys(this).forEach((key) => {
                (this as any)[key] = undefined;
            });
            Object.setPrototypeOf(this, null);

        } catch (error) {
            console.error(`[Rank] Error destroying rank ${this.rankId}:`, error);
        }
    }
}