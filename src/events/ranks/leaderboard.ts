import { Client, ClientEvents, Events } from "discord.js";
import { baseDiscordEvent } from "../../core/Event";
import { client } from "../../bot";
import { settingsMain, SettingsManager } from "../../class/settingsManager";
import { PlayerManager } from "../../class/PlayerManager";
import { rankManager } from "../../class/RankManager";
export default class ReadyEvent extends baseDiscordEvent {
    name: keyof ClientEvents = Events.ClientReady;
    once = true;

    async executeEvent(client: Client<true>) {


    }
}
client.on("leaderboardUpdate", async () => {
    if (SettingsManager.disabled) return;

    console.log("Leaderboard has been updated");

    SettingsManager.lastRefresh = Date.now();
    settingsMain.emit("update", true);

    let players = await PlayerManager.getAllPlayers();
    if (!players.length) return;

    players.sort((a, b) => b.points - a.points); // Sort players by points
    players = players.filter(p => !p.suspended && p?.points > 0); // Filter out suspended players or players with 0 points

    let ranks = await rankManager.getRanks(true);
    if (!ranks.size) return;

    // Sort competitive ranks from highest to lowest points requirement
    const competitiveRanks = ranks
        .filter(r => r.promoteMode === "competitive")
        .sort((a, b) => b.pointsrequirements - a.pointsrequirements);

    const casualRanks = ranks.filter(r => r.promoteMode === "auto");

    const rankCache = new Map<string, number>();

    for (let index = 0; index < players.length; index++) {
        const player = players[index];
        const position = index + 1;


        // Find the best available competitive rank
        let assignedRank = competitiveRanks.find(r => {
            const currentMembers = rankCache.get(r.rankId) || 0;
            if (r.pointsrequirements <= player.points && currentMembers < r.limit) {
                rankCache.set(r.rankId, currentMembers + 1);
                return true;
            }
            return false;
        });

        // If no competitive rank is available, fallback to the best casual rank
        if (!assignedRank) {
            assignedRank = casualRanks.find(r => r.pointsrequirements <= player.points);
        }

        if (!assignedRank) continue;

        // Set player's rank and position
        player.setRank({ id: assignedRank.rankId, name: assignedRank.name });
        player.position = position;
    }
});
