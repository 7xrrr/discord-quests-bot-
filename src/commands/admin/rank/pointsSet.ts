

import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import configSeason from "../config";
import { errorMessage, successMessage } from "../../../utils/tools";
import { PlayerManager } from "../../../class/PlayerManager";



export default class startSeason extends configSeason {

    public cooldown = this.client.config.pointsSet.cooldown;
    public category = this.client.config.pointsSet.category;



    public ownerOnly: boolean = true
    public isSubcommand: boolean = true;
    public subCommandName?: string = "points";

    public data = new SlashCommandBuilder()
        .setName("admin")
        .setDescription("Admin commands for managing the ranking system")

        .addSubcommand((subcommand) =>
            subcommand
                .setName("points")
                .setDescription("Manage points for users")
                .addStringOption((option) =>
                    option.setName("action")
                        .setDescription("Give or take points")
                        .setRequired(true)
                        .addChoices(
                            { name: "give", value: "give" },
                            { name: "take", value: "take" }
                        )
                )
                .addIntegerOption((option) =>
                    option.setName("amount")
                        .setDescription("Amount of points to modify")
                        .setRequired(true)
                )
                .addUserOption((option) =>
                    option.setName("user")
                        .setDescription("User to modify points for")
                        .setRequired(true)
                )
        )










    public async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply({ flags: "Ephemeral" });
        const user = interaction.options.getUser("user");
        const amount = interaction.options.getInteger("amount");
        const action = interaction.options.getString("action", true);
        if (!user || user.bot) return errorMessage("Invalid user", interaction.editReply.bind(interaction));
        if (!amount || amount <= 0) return errorMessage("Invalid amount", interaction.editReply.bind(interaction));
        if (!["give", "take"].includes(action)) return errorMessage("Invalid action", interaction.editReply.bind(interaction));
        const player = await PlayerManager.getUser(user.id, true);
        if (!player) return errorMessage("Player not found", interaction.editReply.bind(interaction));
        const oldPoints = player.points;
        if (action === "give") {
            player.points += amount;
        } else {
            player.points -= amount;
        }
        await player.addToHistory({
            action: `${action === "give" ? "Gave" : "Took"} ${amount} points`,
            oldValue: oldPoints,
            newValue: player.points,
            description: `Points ${action === "give" ? "gave" : "took"} by admin`,
            staff: {
                id: interaction.user.id,
                username: interaction.user.tag
            }
        })
        return successMessage(`Successfully ${action === "give" ? "gave" : "took"} ${amount} points from ${user.tag}. new points ${player.points}`, interaction.editReply.bind(interaction));








    }


}
