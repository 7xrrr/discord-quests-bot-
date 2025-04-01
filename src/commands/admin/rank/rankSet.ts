

import { AutocompleteInteraction, ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import configSeason from "../config";
import { errorMessage, successMessage } from "../../../utils/tools";
import { PlayerManager } from "../../../class/PlayerManager";
import { rankManager } from "../../../class/RankManager";



export default class startSeason extends configSeason {

    public cooldown = this.client.config.pointsSet.cooldown;
    public category = this.client.config.pointsSet.category;



    public ownerOnly: boolean = true
    public isSubcommand: boolean = true;
    public subCommandName?: string = "rank-set";

    public data = new SlashCommandBuilder()
        .setName("admin")
        .setDescription("Admin commands for managing the ranking system")

        .addSubcommand((subcommand) =>
            subcommand
                .setName("rank-set")
                .setDescription("Manually set a user's rank")
                .addUserOption((option) =>
                    option.setName("user")
                        .setDescription("User to set rank for")
                        .setRequired(true)
                )
                .addStringOption((option) =>
                    option.setName("rank")
                        .setDescription("New rank")
                        .setRequired(true)
                        .setAutocomplete(true)
                )
        )





    public async autocomplete(interaction: AutocompleteInteraction): Promise<void> {
        const focusedValue = interaction.options.getFocused();
        const choices = await (await rankManager.getRanks()).map(rank => ({ name: rank.name, value: rank.rankId }));
        const filtered = focusedValue.trim().length > 0 ? choices.filter(choice => choice.name.toLowerCase().includes(focusedValue)).slice(0, 25) : [...choices].slice(0, 25);



        await interaction.respond(
            filtered
        );
    }






    public async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply({ flags: "Ephemeral" });
        const user = interaction.options.getUser("user", true);
        const rankId = interaction.options.getString("rank", true);
        const rank = await rankManager.getRank(rankId);
        const player = await PlayerManager.getUser(user.id, true);
        if (player?.rank?.id === rankId) return errorMessage("User already has this rank", interaction.editReply.bind(interaction));
        if (!rank) return errorMessage("Invalid rank", interaction.editReply.bind(interaction));
        if (!player) return errorMessage("Invalid user", interaction.editReply.bind(interaction));
        const oldPoints = player.points;
        const oldRank = player?.rank;
        player.setRank({
            id: rank.rankId,
            name: rank.name,

        })
        player.points = rank.pointsrequirements
        await player.addToHistory({
            action: `Rank Set`,
            description: `Rank: ${rank.name} (${rank.rankId})`,
            oldValue: `Points: ${oldPoints}, ${oldRank?.name ? `Rank: ${oldRank.name} (${oldRank.id})` : ""}`,
            newValue: `Points: ${rank.pointsrequirements}, Rank: ${rank.name} (${rank.rankId})`,
            staff: {
                id: interaction.user.id,
                username: interaction.user.tag
            }
        })
        
        return  successMessage(`Successfully set ${user.username}'s rank to ${rank.name} (points: ${player.points})`, interaction.editReply.bind(interaction));









    }


}
