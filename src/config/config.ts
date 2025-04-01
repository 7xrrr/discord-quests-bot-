import { PermissionFlagsBits } from "discord.js";

export default {
  blacklist: {
    requiredPermission: PermissionFlagsBits.Administrator,
    cooldown: 3000,
    category: "Moderation",
    enabled: true,
  },
  ping: {
    cooldown: 3000,
    category: "General",
    enabled: true
  },
  seasonStart: {
    requiredPermission: PermissionFlagsBits.Administrator,
    category: "Season",
    ownerOnly:true,
    cooldown: 3000,
    enabled: true,
  },
  rank: {
    requiredPermission: PermissionFlagsBits.Administrator,
    category: "rank",
    ownerOnly:true,
    cooldown: 3000,
    enabled: true,
  },
  reward: {
    requiredPermission: PermissionFlagsBits.Administrator,
    category: "reward",
    ownerOnly:true,
    cooldown: 3000,
    enabled: true,
  },
  rewardCreate: {
    requiredPermission: PermissionFlagsBits.Administrator,
    category: "reward",
    ownerOnly:true,
    cooldown: 3000,
  },
  rankCreate: {
    requiredPermission: PermissionFlagsBits.Administrator,
    category: "rank",
    ownerOnly:true,
    cooldown: 3000,
    enabled: true,
  },
  endSeason: {
    requiredPermission: PermissionFlagsBits.Administrator,
    category: "Season",
    ownerOnly:true,
    cooldown: 3000,
    enabled: true,
  },
  startSeason: {
    requiredPermission: PermissionFlagsBits.Administrator,
    category: "Season",
    ownerOnly:true,
    cooldown: 3000,
    enabled: true,
  },
  lockUser: {
    requiredPermission: PermissionFlagsBits.Administrator,
    category: "Moderation",
    ownerOnly:true,
    cooldown: 3000,
    enabled: true,
  },
  pointsSet: {
    requiredPermission: PermissionFlagsBits.Administrator,
    category: "Moderation",
    ownerOnly:true,
    cooldown: 3000,
    enabled: true,
  },
  rankSet: {
    requiredPermission: PermissionFlagsBits.Administrator,
    category: "Moderation",
    ownerOnly:true,
    cooldown: 3000,
    enabled: true,
  },
  forceDecay: {
    requiredPermission: PermissionFlagsBits.Administrator,
    category: "Moderation",
    ownerOnly:true,
    cooldown: 3000,
    enabled: true,
  },
  leaderboardUpdate: {
    requiredPermission: PermissionFlagsBits.Administrator,
    category: "Moderation",
    ownerOnly:true,
    cooldown: 3000 * 10 * 2,
    enabled: true,
  },
  settings: {
    requiredPermission: PermissionFlagsBits.Administrator,
    category: "Moderation",
    ownerOnly:true,
    cooldown: 3000 * 10 * 2,
    enabled: true,
  },
  playerEditor: {
    requiredPermission: PermissionFlagsBits.Administrator,
    category: "Moderation",
    ownerOnly:true,
    cooldown: 3000,
    enabled: true,
    
  },
  channels: {
    requiredPermission: PermissionFlagsBits.Administrator,
    category: "Moderation",
    ownerOnly:true,
    cooldown: 3000,
    enabled: true,
    description: "set ranking notification channel",

  }

  

} satisfies Config;

interface Config {
  [key: string]: {
    description?: string;
    help?: {
      description: string;
      usage: string;
      example: string;
      Gif: string;
    };
    requiredPermission?: bigint;
    cooldown?: number;
    category?: string;
    enabled?: boolean;
    ownerOnly?: boolean;
  };
}
