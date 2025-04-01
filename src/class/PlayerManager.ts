import { Collection, SnowflakeUtil } from "discord.js";
import UserModel, { HistoryEntry, IUser, Rank, SuspendedInfo } from "../database/models/users";
import { LevelingSystem } from "./levelManager";
import { calculatePercentage, getCurrentDayInUSA } from "../utils/tools";
import { SeasonManager } from "./seasonManager";
import { ms } from "humanize-ms";
import config from "../config";
import { rankManager } from "./RankManager";
import { Rank as rankClass } from "./RankManager";
import { EventEmitter } from "stream";
const playerCache = new Collection<string, Player>();


export class PlayerManager extends EventEmitter {
    static cleanCache(userID: string): void {
        playerCache.delete(userID);
    }
    static async getAllPlayers(): Promise<Player[]> {
        const season = await SeasonManager.getCurrentSeason(true);
        if(!season) return [];
        
        const users = await UserModel.find({
            [`ranking.seasons.${season.id}.points`]: { $exists: true },	
        });
        const players = users.map(user => {
            const player = new Player(user);
            player.season = season.id;
            return player;
        });
        return players;
        
    }
    constructor() {
        super();
    }

    static async getUser(userId: string, createIfNotExists = false, forceRefresh = false): Promise<Player | null> {
        if (!forceRefresh) {
            const cachedPlayer = playerCache.get(userId);
            if (cachedPlayer) return cachedPlayer;
        }

        let userData = await UserModel.findById(userId);
        if (!userData && createIfNotExists) {
            userData = await this.createPlayer(userId);
        }

        if (userData) {
            const player = new Player(userData);
            
            playerCache.set(userId, player);
            return player;
        }

        return null;
    }

    static async createPlayer(userId: string): Promise<IUser | null> {
        try {
            const newUser = await new UserModel({ _id: userId, userId }).save();
            const player = new Player(newUser);
            playerCache.set(userId, player);
            return newUser;
        } catch (error) {
            console.error(`Error creating user ${userId}:`, error);
            return null;
        }
    }
    static async getRankByPoints(points: number): Promise<rankClass | null> {
        const ranks = await rankManager.getRanks();
        if (!ranks || ranks.size === 0) return null;


        const ranksList = ranks
            .filter(rank => !rank.promoteMode || rank.promoteMode !== "competitive")
            .sort((a, b) => b.pointsrequirements - a.pointsrequirements);


        const bestRank = ranksList.find(rank => rank.pointsrequirements <= points);


        return bestRank || null;
    }

    static async updatePlayersRankPoints(rankId: string): Promise<void> {
        console.log("Updating players rank points");
        const rank = await rankManager.getRank(rankId);
        if (!rank) return console.log("No rank found.");
        const currentSeason = await SeasonManager.getCurrentSeason();
        if (!currentSeason) return console.log("No current season found.");
        const players = await UserModel.find({

            $or: [
                {
                    [`ranking.seasons.${currentSeason.id}.rank.id`]: rankId,
                },
                {
                    [`ranking.seasons.${currentSeason.id}.points`]: { $gte: rank.pointsrequirements },
                }
            ]


        });
        console.log(`Found ${players.length} players with rank ${rankId}`);
        for (const player of players) {
            const season = player.ranking.seasons[currentSeason.id];
            const playerClass = await PlayerManager.getUser(player.userId);
            const rank = await this.getRankByPoints(season.points);
            const playerRank = playerClass?.rank?.id && await rankManager.getRank(`${playerClass?.rank?.id}`) || null;


            if (playerRank && playerRank.promoteMode === "competitive") continue;

            else if (playerClass && rank) {

                console.log(`Updating rank for ${player.userId} to ${rank.name}`);
                playerClass.setRank({
                    id: rank.rankId,
                    name: rank.name,
                }).then(() => console.log(`Updated rank for ${player.userId} to ${rank.name}`));

            } else {
                console.log(`No rank found for ${player.userId}`);
            }
        }
    }
    static async updatePlayersRankNames(rankId: string): Promise<void> {
        const rank = await rankManager.getRank(rankId);
        if (!rank) return console.log("No rank found.");
        const currentSeason = await SeasonManager.getCurrentSeason();
        if (!currentSeason) return console.log("No current season found.");

        const players = await UserModel.find({
            [`ranking.seasons.${currentSeason.id}.rank.id`]: rankId,
        });
        for (const player of players) {
            const playerClass = playerCache.get(player.userId);
            if (playerClass) {
                playerClass.setRank({
                    id: rankId,
                    name: rank.name,

                }).then(() => console.log(`Updated rank for ${player.userId} to ${rank.name}`));
            }
        }
    }
}

export const PlayerManagerMain = new PlayerManager();
export class Player extends EventEmitter {
    userDoc: IUser;
    private onSave = false;
    private _level = 0;
    private _rank: Rank | null = null;
    public _season: number | null = null
    private inActiveTimeout?: ReturnType<typeof setTimeout>;

    constructor(data: IUser) {
        super();
        this.userDoc = data;
     
        playerCache.set(data.userId, this);
        this._level = LevelingSystem.getLevelFromXP(this.xp) || 0;
        this._rank = this.rank

        SeasonManager.getCurrentSeason().then(season => this._season = season?.id || null);
        this.save();


    }
    async loadSeason() {
        const season = await SeasonManager.getCurrentSeason(true);
        if (!season) return;
        this._season = season.id;
    }
    set season(value: number) {
        this._season = value;

    }
    updateTimeout(duration: string = config.cacheCleanUp): void {
        if (this.inActiveTimeout) {
            clearTimeout(this.inActiveTimeout);
        }

        const timeoutMs = ms(duration);
        this.inActiveTimeout = setTimeout(() => {
            console.log(`User ${this.userId} is now inactive.`);
            this.destroy();
        }, timeoutMs);
    }
    get rank(): Rank | null {

        return this._season && this.userDoc.ranking["seasons"][this._season]?.rank || null;
    }

    get ActiveDaysCount(): number {
        return Object.keys(this.userDoc.activeDays).length;
    };
    get lastActive(): Date {
        const key = (SeasonManager.currentSeason)?.id;
        if (!key) return new Date("09-09-09");
        return this.userDoc.ranking.seasons[key]?.lastActive || new Date("09-09-09");
    }

    async setDecay(value: boolean) {
        const key = (await SeasonManager.getCurrentSeason())?.id;
        if (!key) return;

        this._season = key;


        // Ensure ranking structure exists
        this.userDoc.ranking ??= { totalPoints: 0, totalMessages: 0, totalCharacters: 0, seasons: {} };

        // Ensure season data exists
        const seasonData = this.userDoc.ranking.seasons[key] ??= {
            points: 0,
            suspended: {
                status:false
            },
            lastActive: new Date(),
           
        };

        // Update decay value
        seasonData.decay = {
            active: value,
            last: Date.now(),
            next: 0,
        }


        // Mark as modified and save
        this.userDoc.markModified(`ranking`);
        await this.save();
    }
    
    get decay():boolean {
        const key = (SeasonManager.currentSeason)?.id;
        if (!key) return false;
        return this.userDoc.ranking.seasons[key]?.decay?.active || false;

    }

    async setRank(value: Rank | null) {
        const key = (await SeasonManager.getCurrentSeason())?.id;
        if (!key) return;
        this._season = key;

        this.userDoc.ranking ??= { totalPoints: 0, totalMessages: 0, totalCharacters: 0, seasons: {} };

        const seasonData = this.userDoc.ranking.seasons[key] ??= {
            points: 0,
            lastActive: new Date(),


            rank: { id: "Newbie", name: "Newbie" },
            messagesCount: 0,
            characterCount: 0,
            wordsCount: 0,
            suspended: {
                status: false,
            },
        };
        const oldRank = this.rank;
        if (oldRank?.id === value?.id) return;

        seasonData.rank = {
            id: value?.id || "unknown",
            name: value?.name || "unknown",
        }
      
    
        PlayerManagerMain.emit("rankChange", this,oldRank,value);
        this.userDoc.markModified("ranking");
        this.save();


    }
    get xp(): number {
        return this.userDoc.xp;
    }
    async getPosition(): Promise<number> {
        const key = (await SeasonManager.getCurrentSeason())?.id;
        if (!key) return 0;
        const players = await UserModel.find(
            { [`ranking.seasons.${key}.points`]: { $exists: true } },
            { _id: 0, userId: 1, [`ranking.seasons.${key}.points`]: 1 }
        ).sort({ [`ranking.seasons.${key}.points`]: -1 }); // Descending order
        const position = players.findIndex(player => player.userId === this.userId) + 1;

        this.position = position || NaN;
        return position;
    }


    get position(): number {
        return this?.userDoc?.ranking?.seasons?.[`${this._season}`]?.position || NaN;
    }
    set position(value: number) {
        this.userDoc.ranking.seasons[`${this._season}`].position = value;
        this.userDoc.markModified("ranking");
        this.save();


    }
    set xp(value: number) {
        const diff = value - this.userDoc.xp;
        if (diff === 0) return;
        this.userDoc.xp = value;
        this.userDoc.markModified("xp");






        const currentLevel = LevelingSystem.getLevelFromXP(this.xp);
        if (currentLevel !== this._level) {
            this._level = currentLevel;
            console.log(`User ${this.userDoc.userId} leveled up to level ${this._level}!`);

        }
        this.save();
    };
    incressDailyXP({
        xp = 0,
        messageCount = 0,
        characterCount = 0,
        wordsCount = 0,
    }: {
        xp?: number;
        messageCount?: number;
        characterCount?: number;
        wordsCount?: number;
    }): void {
        const key = getCurrentDayInUSA();
        if (!this.userDoc.activeDays) this.userDoc.activeDays = {};
        if (!this.userDoc.activeDays["total"]) this.userDoc.activeDays["total"] = { xp: 0, messageCount: 0, characterCount: 0, wordsCount: 0 };
        this.userDoc.activeDays["total"].xp += xp;
        this.userDoc.activeDays["total"].messageCount += messageCount;
        this.userDoc.activeDays["total"].characterCount += characterCount;
        this.userDoc.activeDays["total"].wordsCount += wordsCount
        if (!this.userDoc.activeDays[key]) this.userDoc.activeDays[key] = { xp: 0, messageCount: 0, characterCount: 0, wordsCount: 0 };
        this.userDoc.activeDays[key].xp += xp;
        this.userDoc.activeDays[key].messageCount += messageCount;
        this.userDoc.activeDays[key].characterCount += characterCount;
        this.userDoc.activeDays[key].wordsCount += wordsCount;
        this.userDoc.markModified("activeDays");
        this.xp += xp;



    }

    async increaseSeasonPoints({
        points = 0,
        messageCount = 0,
        characterCount = 0,
        wordsCount = 0,
    }: {
        points?: number;
        messageCount?: number;
        characterCount?: number;
        wordsCount?: number;
    }): Promise<void> {
        const key = (await SeasonManager.getCurrentSeason())?.id;
        if (!key) {
            this._season = null;
            return;
        }
        this._season = key;

        // Ensure ranking structure exists
        this.userDoc.ranking ??= { totalPoints: 0, totalMessages: 0, totalCharacters: 0, seasons: {} };
        const seasonData = this.userDoc.ranking.seasons[key] ??= {
            points: 0,
            lastActive: new Date(),


            rank: { id: "Newbie", name: "Newbie" },
            messagesCount: 0,
            characterCount: 0,
            wordsCount: 0,
            suspended: {
                status: false,
            },
        };

        // Ensure numerical fields are initialized
        seasonData.messagesCount ??= 0;
        seasonData.characterCount ??= 0;
        seasonData.wordsCount ??= 0;

        // Update season-specific and total ranking stats
        seasonData.points += points;
        this.userDoc.ranking.totalPoints += points;
        seasonData.messagesCount += messageCount;
        this.userDoc.ranking.totalMessages += messageCount;
        seasonData.characterCount += characterCount;
        this.userDoc.ranking.totalCharacters += characterCount;
        seasonData.wordsCount += wordsCount;
        seasonData.lastActive = new Date();

        // Mark ranking as modified and ensure saving
        this.userDoc.markModified("ranking");
        this.save();
    }
    async addToHistory(data:HistoryEntry) {
        const id = SnowflakeUtil.generate().toString();
        const date = Date.now();
        const config:HistoryEntry = {...data,id,date};
        this.userDoc.history.push(config);
        this.userDoc.markModified("history");
        await this.save();

    }


    async save(): Promise<void> {
        if (this.onSave) return;
        this.onSave = true;
        setTimeout(async () => {
            try {
                await this.userDoc.save();
                this.onSave = false;
                console.log(`User ${this.userDoc.userId} saved.`);
            } catch (error) {
                console.error(`Error saving user ${this.userDoc.userId}:`, error);
                this.onSave = false
            }
        }, 2500);
    };



    get level(): number {
        return LevelingSystem.getLevelFromXP(this.xp);
    }

    get progressToNextLevel(): {
        currentLevelXP: number;
        nextLevelXP: number;
        nextLevel: number;
        currentLevel: number;
        progress: number;
    } {
        const currnetLevel = LevelingSystem.getLevelFromXP(this.xp);
        const currentLevelXp = this.xp - LevelingSystem.getXPForLevel(currnetLevel);
        const nextLevelXP = LevelingSystem.getXPForLevel(currnetLevel + 1) - LevelingSystem.getXPForLevel(currnetLevel);





        const progressXP = calculatePercentage(currentLevelXp, nextLevelXP);

        console.log(progressXP)


        return {
            currentLevelXP: currentLevelXp,
            nextLevelXP: nextLevelXP,
            nextLevel: currnetLevel + 1,
            currentLevel: currnetLevel,
            progress: progressXP

        }
    }
    get points(): number {
        const key = SeasonManager.currentSeason?.id
        if (!key) return 0;
        return this.userDoc.ranking.seasons[key]?.points || 0;

    }
    async calcRank() {
        const ranks = await rankManager.getRanks();
        const bestRank = await PlayerManager.getRankByPoints(this.points);
        if (!bestRank) return;
        const oldRank = ranks.get(`${this.rank?.id}`);


        if (oldRank?.rankId === bestRank.rankId) return;
        if(oldRank && oldRank?.pointsrequirements > bestRank.pointsrequirements) return;
        return this.setRank({
            id: bestRank.rankId,
            name: bestRank.name,
        });
    }

    set points(value: number) {
        const key = SeasonManager.currentSeason?.id
        if (!key) return;
        this.userDoc.ranking.seasons[key].points = value;
        if (this.userDoc.ranking.seasons[key].points < 0) this.userDoc.ranking.seasons[key].points = 0;
        this.calcRank();
        this.userDoc.markModified("ranking");
        this.save();
    }
    get suspendedGlobal(): boolean {
        const suspended = this.userDoc.suspended;
        return !!(suspended?.status && (!suspended.expire || suspended.expire > Date.now()));
    }

    get suspendedSeason(): boolean {
        const key = SeasonManager.currentSeason?.id;
        if (!key) return false;

        const seasonSuspended = this.userDoc.ranking.seasons[key]?.suspended;
        return !!(seasonSuspended?.status && (!seasonSuspended.expire || seasonSuspended.expire > Date.now()));
    }

    get suspended(): boolean {
        return this.suspendedGlobal || this.suspendedSeason;
    }



    get userId(): string {
        return this.userDoc.userId;
    }
    async suspendedUser(data: SuspendedInfo, type: "season" | "global" = "global"): Promise<void> {
        const key = SeasonManager.currentSeason?.id;
        if (!key) return;

        if (type === "global") {
            this.userDoc.suspended = data;
            this.userDoc.markModified("suspended");
        } else {
            // Ensure ranking & season exist before modifying
            this.userDoc.ranking ??= { seasons: {}, totalCharacters: 0, totalMessages: 0, totalPoints: 0 };
            this.userDoc.ranking.seasons ??= {};

            // Ensure the current season exists
            if (!this.userDoc.ranking.seasons[key]) {
                this.userDoc.ranking.seasons[key] = {
                    points: 0,
                    lastActive: new Date(),
                    suspended: {
                        status: false,

                    }
                };
            }

            this.userDoc.ranking.seasons[key].suspended = data;
            this.userDoc.markModified("ranking");
        }


        await this.save(); // Await to ensure it's properly saved
    }

    destroy(): void {
        if (this.inActiveTimeout) {
            clearTimeout(this.inActiveTimeout);
            this.inActiveTimeout = undefined;
        }
        this.save();
        Object.keys(this).forEach((key) => {
            (this as any)[key] = undefined;
        });

        Object.setPrototypeOf(this, null);

        playerCache.delete(this.userId);
        console.log(`User ${this.userId} removed from cache.`);
    }
}