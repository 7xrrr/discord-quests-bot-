

import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import configSeason from "../config";
import { errorMessage, successMessage } from "../../../utils/tools";
import { ms } from "../../../utils/ms";
import { PlayerManager } from "../../../class/PlayerManager";



export default class startSeason extends configSeason {

    public cooldown = this.client.config.lockUser.cooldown;
    public category = this.client.config.lockUser.category;



    public ownerOnly: boolean = true
    public isSubcommand: boolean = true;
    public subCommandName?: string = "lock";

    public data = new SlashCommandBuilder()
        .setName("admin")
        .setDescription("Admin commands for managing the ranking system")

        .addSubcommand((subcommand) =>
            subcommand.setName("lock").setDescription("Locks the ranking system")
                .addUserOption((option) =>
                    option.setName("user")
                        .setDescription("User to lock")
                        .setRequired(true)
                )
                .addStringOption((option) =>
                    option.setName("reason")
                        .setDescription("Reason for locking")
                        .setRequired(true)
                )
                .addStringOption((option) =>
                    option.setName("time")
                        .setDescription("Time of the lock (auto unlock)")
                        .setRequired(false)

                ).addStringOption((option) =>
                    option.setName("type")
                        .setDescription("Type of lock")
                        .setRequired(false)
                        .addChoices(
                            { name: "Global (All Seasons)", value: "global" },
                            { name: "Seasonal (Only This Season)", value: "season" }
                        )
                )


        )










    public async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply({ flags:["Ephemeral"] });
        const user = interaction.options.getUser("user", true);
        const reason = interaction.options.getString("reason", true);
        const time = interaction.options.getString("time") ? ms(interaction.options.getString("time")) : ms("9999y");
        const type = interaction.options.getString("type") || "global";
        if (!user || user.bot) return errorMessage("Invalid user", interaction.editReply.bind(interaction));
        if (!reason) return errorMessage("Invalid reason", interaction.editReply.bind(interaction));
        if (!time  || isNaN(time)) return errorMessage("Invalid time", interaction.editReply.bind(interaction));
        if (!["global", "season"].includes(type)) return errorMessage("Invalid type", interaction.editReply.bind(interaction));
        const player = await PlayerManager.getUser(user.id, true);
        if (!player) return errorMessage("Player not found", interaction.editReply.bind(interaction));
        await player.suspendedUser({
            reason: reason,
            status: true,
            date: Date.now(),
            expire: time ? Date.now() + time : null,
            staff: {
                id: interaction.user.id,
                username: interaction.user.tag
            }
        }, type === "season" ? "season" : "global");
        await player.addToHistory({
            action: `Locked ${time ? `for ${ms(time)}` : ""}`,
            description: `resaon: ${reason},type: ${type}`,
            oldValue: `-`,
            newValue: `Locked`,
            staff: {
                id: interaction.user.id,
                username: interaction.user.tag
            }
        })
        return successMessage(`Successfully locked ${user.tag} from the ranking system ${time ? `For ${ms(time)}` : ""}`, interaction.editReply.bind(interaction));
    }


}
