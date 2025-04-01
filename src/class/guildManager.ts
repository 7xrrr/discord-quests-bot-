import { EventEmitter } from "stream";
import GuildModel, { iGuild } from "../database/models/guild";
import { Collection } from "discord.js";





export class serverManager {
    private static servers = new Collection<string, server>();

    static async getServer(guildId: string, createIfNotExists = false, force = false): Promise<server | null> {
        if (!force) {
            const cachedServer = this.servers.get(guildId);
            if (cachedServer) return cachedServer;
        }

        let guildDoc = await GuildModel.findOne({ guildId });

        if (!guildDoc && createIfNotExists) {
            guildDoc = new GuildModel({ guildId });
            await guildDoc.save();
        }

        if (!guildDoc) return null;

        const guild = new server(guildDoc);
        this.servers.set(guildId, guild);

        return guild;
    }
}


export class server extends EventEmitter {
    _doc: iGuild;
    onSave: boolean = false;
    changes: string[] = [];
    constructor(doc: iGuild) {
        super();
        this._doc = doc;


    }
    async save(): Promise<void> {
        this.emit("update");
        if (this.onSave) return;
        this.onSave = true;
        return new Promise((resolve, reject) => {
            setTimeout(async () => {
                try {
                    await this._doc.save();
                    this.onSave = false;
                    resolve();
                } catch (error) {

                    this.onSave = false
                    reject(error);
                }
            }, 500);
        })
    };
    get rankUpChannel() {
        return this._doc.notification.rankUpChannel || null;
    }
    set rankUpChannel(value: string | null) {
        this._doc.notification.rankUpChannel = value;
        this.markModified("notification.rankUpChannel");
        this.save();
    }

    get rankDownChannel() {
        return this._doc.notification.rankDownChannel || null;
    }
    set rankDownChannel(value: string | null) {
        this._doc.notification.rankDownChannel = value;
        this.markModified("notification.rankDownChannel");
        this.save();
    }
    get highPlayerRankUpChannel() {
        return this._doc.notification.highPlayerRankUpChannel || this.rankUpChannel;
    }
    set highPlayerRankUpChannel(value: string | null) {
        this._doc.notification.highPlayerRankUpChannel = value;
        this.markModified("notification.highPlayerRankUpChannel");
        this.save();
    }
    get highPlayerRankDownChannel() {

        return this._doc.notification.highPlayerRankDownChannel || this.rankDownChannel;
    }
    set highPlayerRankDownChannel(value: string | null) {
        this._doc.notification.highPlayerRankDownChannel = value;
        this.markModified("notification.highPlayerRankDownChannel");
        this.save();
    }
    
    markModified(path: string | string[]): void {
        const pathArray = Array.isArray(path) ? path : [path];
        for (const path of pathArray) {
            this._doc.markModified(path);
            if (!this.changes.includes(path)) this.changes.push(path);
        }
    }
}