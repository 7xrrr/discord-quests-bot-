import { SnowflakeUtil } from "discord.js";
import config from "../config";
import RankModel from "../database/models/ranks";
import SettingsModel, { iSettings } from "../database/models/settings";
import { EventEmitter } from "stream";

export class SettingsManager extends EventEmitter {
    public  static _data: iSettings | null = null;
  


    public static get disabled() {
        return this._data?.forceDisable || false;
    }
    public static set disabled(value: boolean) {
        if (!this._data) return;
        this._data.forceDisable = value;
        this.markModified("forceDisable");
        this.save();
    }
    public static get refreshTime() {
        return this._data?.refreshTime || 0;
    }
    public static set refreshTime(value: number) {
        if (!this._data) return;
        this._data.refreshTime = value;
        this.markModified("refreshTime");
        this.save();
    }
    public static get lastRefresh() {
        return this._data?.lastRefresh || 0;
    }
    public static set lastRefresh(value: number) {
        if (!this._data) return;
        this._data.lastRefresh = value;
        this.markModified("lastRefresh");
        this.save();
    }

    public static async loadUp(): Promise<iSettings | null> {
        try {
            let settings = await SettingsModel.findOne();
            
            if (!settings || !settings.firstLoad) {
                if (!settings) {
                    settings = await new SettingsModel({}).save();
                }

                if (!settings.firstLoad) {
                    await this.initializeRanks();
                    settings.firstLoad = true;
                    settings.markModified("firstLoad");
                    await settings.save();
                }
            }

            this._data = settings;
            return this.getData();
        } catch (error) {
            console.error("Error loading settings:", error);
            return null;
        }
    }
    public  static get decay() {
        return this._data?.decayEnabled || false;
    }
    public  static set decay(value: boolean) {
        if (!this._data) return;
        this._data.decayEnabled = value;
        this.markModified("decayEnabled");
        this.save();
    }


    private  static async initializeRanks(): Promise<void> {
        try {
            await Promise.all(
                config.ranks.map(rank =>
                    new RankModel({
                        rankId: SnowflakeUtil.generate().toString(),
                        name: rank.name,
                        pointsRequirement: rank.pointsRequirement,
                        decay: Boolean(rank?.decay?.decay),
                        maxUsers: rank.maxUsers || 0,
                        rewards: rank.rewards || [],
                        promotion: rank.promotion || { type: "auto", interval: 0 },
                    }).save()
                )
            );
        } catch (error) {
            console.error("Error initializing ranks:", error);
        }
    }

    public static markModified(paths: string | string[]): void {
        if (!this._data) return;
        
        (Array.isArray(paths) ? paths : [paths]).forEach(path => this._data!.markModified(path));
    }

    public static async save(): Promise<void> {
        if (!this._data) return;
        try {
            await this._data.save();
        } catch (error) {
            console.error("Error saving settings:", error);
        }
    }

    public static getData(): iSettings | null {
        return this._data ? this._data.toObject() : null;
    }
    
    
}
export const settingsMain = new SettingsManager();