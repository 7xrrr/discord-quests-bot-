

import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import configSeason from "../config";
import { errorMessage, successMessage } from "../../../utils/tools";
import { PlayerManager } from "../../../class/PlayerManager";



export default class startSeason extends configSeason {

    public cooldown = this.client.config.lockUser.cooldown;
    public category = this.client.config.lockUser.category;



    public ownerOnly: boolean = true
    public isSubcommand: boolean = true;
    public subCommandName?: string = "reset";

    public data = new SlashCommandBuilder()
        .setName("admin")
        .setDescription("Admin commands for managing the ranking system")

   
        .addSubcommand((subcommand) =>
            subcommand.setName("reset").setDescription("Resets the ranking system")
                .addUserOption((option) =>
                    option.setName("user")
                        .setDescription("User to reset")
                        .setRequired(true))
                        .addStringOption((option) =>
                            option.setName("reason")
                                .setDescription("Reason for resetting")
                                .setRequired(false)
                        )


        )










    public async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply({ flags:["Ephemeral"] });
        const user = interaction.options.getUser("user", true);
        const reason = interaction.options.getString("reason") || "No reason provided";
        if (!user || user.bot) return errorMessage("Invalid user", interaction.editReply.bind(interaction));
        const player = await PlayerManager.getUser(user.id, true);
        if (!player) return errorMessage("Player not found", interaction.editReply.bind(interaction));
        const oldPoints = player.points;
        const oldRank = player?.rank;
        player.setRank({
            id: "reseted",
            name: "Reseted",
        })
        player.points = 0;
        
        await player.addToHistory({
            action: `Rank Reseted`,
            description: `reason: ${reason}`,
            oldValue: `Points: ${oldPoints}, ${oldRank?.name ? `Rank: ${oldRank.name} (${oldRank.id})` : ""}`,
            newValue: `Points: 0, Rank: Reseted`,
            staff: {
                id: interaction.user.id,
                username: interaction.user.tag
            }
        })

        await successMessage(`User ${user.tag} has been reseted`, interaction.editReply.bind(interaction));
 

      
    }


}
