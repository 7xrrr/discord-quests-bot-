import { ms } from "humanize-ms";
import SeasonModel, { iSeason } from "../database/models/seasons";
import { client } from "../bot";
import schedule, { Job } from "node-schedule";
import UserModel from "../database/models/users";

export class SeasonManager {
    static currentSeason: Season | null = null;
    static expireDate: number | null = null;

    static clearCache() {
        this.currentSeason = null;
        this.expireDate = null;

    }
    

    static async getCurrentSeason(force: boolean = false, makeNew: boolean = false): Promise<Season | null> {

        try {

            if (this.expireDate && this.expireDate < Date.now()) {
                this.currentSeason = null;
            }
            if (this.currentSeason && !force) return this.currentSeason;



            let seasonData = await SeasonModel.findOne({
                current: true,
                ended: false,
                endDate: { $gte: new Date() }
            }).sort({ seasonId: -1 }) as iSeason | null;
            let season = seasonData ? new Season(seasonData) : null;

            if (!season && makeNew) {
                this.currentSeason?.destroy();
                season = await this.createNewSeason();
            }

            if (!season) return null;

            this.currentSeason = season;
            this.expireDate = new Date(season.data.endDate).getTime();

            return season;
        } catch (error) {
            console.error("[SeasonManager] Error fetching current season:", error);
            return null;
        }
    }

    static async createNewSeason(time?: number| null): Promise<Season | null> {
        try {
            const lastSeason = await SeasonModel.findOne({}, { seasonId: 1, ended: 1, current: 1 }).sort({ seasonId: -1 }) as iSeason | null;

            const newSeasonId = (lastSeason?.seasonId || 0) + 1;

            const newSeason = new SeasonModel({
                seasonId: newSeasonId,
                current: true,
                ended: false,
                startDate: Date.now(),
                endDate: time && typeof (time) === "number" ? Date.now() + time : Date.now() + ms("99y"),

            });

            const savedSeason = await newSeason.save();
            return new Season(savedSeason);
        } catch (error) {
            console.error("[SeasonManager] Error creating new season:", error);
            return null;
        }
    }
}




export class Season {
    data: iSeason;
    id: number;
    scheduledJob: Job | null = null;

    constructor(data: iSeason) {
        this.data = data;
        this.id = data.seasonId;

        
        if (!this.data.ended && this.data.endDate) {
            const endDate = new Date(this.data.endDate);
            if (this.data.ended && endDate <= new Date()) {
                this.end({ reason: "Season expired" });
            } else {
                this.scheduledJob = schedule.scheduleJob(endDate, () => {
                    this.end({ reason: "Season expired" });
                });
            }
        }
    }

    async save(): Promise<void> {
        await this.data.save();
    }
    async getTopPlayers(limit:number=100): Promise<any> {
        const players = await UserModel.find({
            [`ranking.seasons.${this.id}.points`]: { $gt: 0 }
        }).sort({ [`ranking.seasons.${this.id}.points`]: -1 }).limit(limit);
        console.log(players);
        return players.map(e => e.toObject());
    };
    async getPlayersByRank(rankid:string,limit:number=100): Promise<any> {
        const players = await UserModel.find({
            [`ranking.seasons.${this.id}.rank.id`]: rankid
        }).sort({ [`ranking.seasons.${this.id}.points`]: -1 }).limit(limit);
        return players.map(e => e.toObject());
    }

    markModified(path: string | string[]): void {
        const pathArray = Array.isArray(path) ? path : [path];
        for (const path of pathArray) {
            this.data.markModified(path);
        }
    }

    async end({
        staff,
        reason = "No reason provided"
    }: {
        staff?: { id: string; username: string };
        reason?: string;
    } = {}): Promise<void> {
        this.data.ended = true;
        this.data.current = false;
        this.data.endDate = Date.now();
        this.data.end = {
            date: Date.now(),
            reason,
            staff: {
                id: staff?.id || "Unknown",
                username: staff?.username || "Unknown"
            }
        };

        SeasonManager.clearCache();
        this.markModified(["ended", "current", "endDate", "end"]);
        await this.save();

        client.emit("seasonEnd", this);

        // Cancel scheduled job when season ends
        this.cancelSchedule();
    }

    cancelSchedule(): void {
        if (this.scheduledJob) {
            this.scheduledJob.cancel();
            this.scheduledJob = null;
            console.log(`[Season] Scheduled job for season ${this.id} has been canceled.`);
        }
    }

    destroy(): void {
        try {
            this.cancelSchedule(); // Ensure job is canceled before destruction

            // Clear all properties dynamically
            Object.keys(this).forEach((key) => {
                (this as any)[key] = undefined;
            });

            Object.setPrototypeOf(this, null);
        } catch (error) {
            console.error(`[Season] Error destroying season ${this.id}:`, error);
        }
    }
}