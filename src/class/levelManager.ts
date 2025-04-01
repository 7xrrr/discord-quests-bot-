import { Message } from "discord.js";
import config from "../config";
import { SpamDetector } from "./SpamDetector";

const cooldown = new Set<string>();

export class LevelingSystem {
    private static readonly initialXP: number = config.levels.initialXP;
    private static readonly scalingFactor: number = config.levels.scalingFactor;
    private static readonly cooldownTime: number = config.levels.perMessageXP.cooldown;
    private static readonly wordRequirement: number = config.levels.perMessageXP.wordRequirement;
    private static readonly charRequirement: number = config.levels.perMessageXP.charRequirement;
    private static readonly baseXP: number = config.levels.perMessageXP.baseXP;
    private static readonly wordBonus: number = config.levels.perMessageXP.wordBonus;
    private static readonly charBonus: number = config.levels.perMessageXP.charBonus;
    private static readonly rankBaseXP: number = config.rankConfig.perMessage.baseXP;
    private static readonly rankWordBonus: number = config.rankConfig.perMessage.wordBonus;
    private static readonly rankCharBonus: number = config.rankConfig.perMessage.charBonus;
    private static readonly rankWordRequirement: number = config.rankConfig.perMessage.wordRequirement;
    private static readonly rankCharRequirement: number = config.rankConfig.perMessage.charRequirement;
    private static readonly rankCooldown: number = config.rankConfig.perMessage.cooldown;
    



    static getLevelFromXP(xp: number): number {
        if (this.scalingFactor <= 0) throw new Error("Scaling factor must be greater than 0");

        const value = 1 + 8 * ((xp - this.initialXP) / this.scalingFactor);
        return value < 0 ? 1 : Math.floor((-1 + Math.sqrt(value)) / 2) + 1;
    }

    static getXPForLevel(level: number): number {
        return this.initialXP + (this.scalingFactor * (level - 1) * level) / 2;
    }

    static getProgressToNextLevel(xp: number): { currentLevelXP: number; nextLevelXP: number; nextLevel: number; currentLevel: number } {
        const currentLevel = this.getLevelFromXP(xp);
        const currentLevelXP = this.getXPForLevel(currentLevel) - this.getXPForLevel(currentLevel - 1);
        const nextLevelXP = this.getXPForLevel(currentLevel + 1) - this.getXPForLevel(currentLevel);

        return { currentLevelXP, nextLevelXP, nextLevel: currentLevel + 1, currentLevel };
    }

    static isOnCooldown(userId: string, type: string = "xp"): boolean {
        return cooldown.has(`${userId}-${type}`);
    }

    static setOnCooldown(userId: string, type: string = "xp"): void {
        cooldown.add(`${userId}-${type}`);
        setTimeout(() => cooldown.delete(`${userId}-${type}`), this.cooldownTime);

    }

    static underRequirement(message: Message,type:string="xp"): boolean {
        const content = message.content.trim();
        if (!content) return true;

        const words = content.split(/\s+/).length;
        const characters = content.length;
        const { wordRequirement, charRequirement } = type === "xp" ? { wordRequirement: this.wordRequirement, charRequirement: this.charRequirement } : { wordRequirement: this.rankWordRequirement, charRequirement: this.rankCharRequirement };

        return words < wordRequirement || characters < charRequirement || SpamDetector.isSpam(message.content);
    }

    static calcMessageXp(message: Message): { messageLength: number; wordCount: number; xp: number } {
        if (this.underRequirement(message) || this.isOnCooldown(message.author.id)) {
            return { messageLength: 0, wordCount: 0, xp: 0 };
        }

        const content = message.content.trim();
        const words = content.split(/\s+/).length;
        const characters = content.length;

        const xp = Math.round(
            this.baseXP + words * this.wordBonus + Math.min(characters * this.charBonus, characters * 0.1)
        );

        this.setOnCooldown(message.author.id);

        return { messageLength: characters, wordCount: words, xp };
    };
    static calcMessageXpForRank(message: Message): { messageLength: number; wordCount: number; points: number } {
        if (this.underRequirement(message,"rank") || this.isOnCooldown(message.author.id, "rank")) {
            return { messageLength: 0, wordCount: 0, points: 0 };
        }

        const content = message.content.trim();
        const words = content.split(/\s+/).length;
        const characters = content.length;

        const points = Math.round(
            this.rankBaseXP + words * this.rankWordBonus + Math.min(characters * this.rankCharBonus, characters * 0.1)
        );

        this.setOnCooldown(message.author.id, "rank");


        return { messageLength: characters, wordCount: words, points: points };


    }


}
