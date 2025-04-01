

import { AutocompleteInteraction, ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import configSeason from "../config";
import { errorMessage, successMessage } from "../../../utils/tools";
import { PlayerManager } from "../../../class/PlayerManager";
import { rankManager } from "../../../class/RankManager";
import { settingsMain, SettingsManager } from "../../../class/settingsManager";
import { ms } from "../../../utils/ms";



export default class startSeason extends configSeason {

    public cooldown = this.client.config.leaderboardUpdate.cooldown;
    public category = this.client.config.leaderboardUpdate.category;



    public ownerOnly: boolean = true
    public isSubcommand: boolean = true;
    public subCommandName?: string = "force-check";

    public data = new SlashCommandBuilder()
        .setName("admin")
        .setDescription("Admin commands for managing the ranking system")

        .addSubcommand((subcommand) =>
            subcommand.setName("force-check").setDescription("Force check promotions/demotions")
        )









    public async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply({ flags: "Ephemeral" });
        const lastRefresh = SettingsManager._data?.lastRefresh || 0;
        if (Date.now() - lastRefresh < ms("1h")) return errorMessage("You can only force refresh once every hour", interaction.editReply.bind(interaction));
        this.client.emit("leaderboardUpdate", interaction.guildId);
        settingsMain.emit("update", true);
 

        return successMessage(`Triggered Leaderboard update it may take a while to show up`, interaction.editReply.bind(interaction));









    }


}
