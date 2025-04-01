import { User } from "discord.js";
import { Player } from "../class/PlayerManager";

interface Key {
    description: string;
    pass: "user" | "player";
    key: (user: User | Player) => any;
}

export default {
    [`user.id`]: {
        description: "The ID of the user",
        pass: "user",
        key: (user: User) => user.id,
    },
    [`user.tag`]: {
        description: "The tag of the user",
        pass: "user",
        key: (user: User) => user.tag,
    },
    [`user.avatar`]: {
        description: "The avatar of the user",
        pass: "user",
        key: (user: User) => user.displayAvatarURL(),
    },
    [`user.username`]: {
        description: "The username of the user",
        pass: "user",
        key: (user: User) => user.username,
    },
    [`user.displayName`]: {
        description: "The display name of the user",
        pass: "user",
        key: (user: User) => user.displayName,
    },
    [`position`]: {
        description: "The position of the user in the leaderboard",
        pass: "player",
        key: (player: Player) => player.position ?? "N/A",
    },
    [`rank.name`]: {
        description: "The name of the rank of the user",
        pass: "player",
        key: (player: Player) => player.rank?.name ?? "Unranked",
    },
    [`rank.id`]: {
        description: "The ID of the rank of the user",
        pass: "player",
        key: (player: Player) => player.rank?.id ?? "None",
    },
    [`points`]: {
        description: "The points of the user",
        pass: "player",
        key: (player: Player) => player.points ?? 0,
    },
    [`level`]: {
        description: "The level of the user",
        pass: "player",
        key: (player: Player) => player.level ?? 1,
    },
    [`activedays`]: {
        description: "The active days of the user (count)",
        pass: "player",
        key: (player: Player) => player.ActiveDaysCount ?? 0,
    },
    [`totalMessages`]: {
        description: "The total messages of the user",
        pass: "player",
        key: (player: Player) => player?.userDoc?.ranking?.totalMessages ?? 0,  
    }
} as Record<string, Key>;
