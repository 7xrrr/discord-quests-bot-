import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import configSeason from "../config";
import { errorMessage, successMessage } from "../../../utils/tools";
import { PlayerManager } from "../../../class/PlayerManager";

export default class unlockUser extends configSeason {
    
    public cooldown = this.client.config.lockUser.cooldown;
    public category = this.client.config.lockUser.category;

    public ownerOnly: boolean = true;
    public isSubcommand: boolean = true;
    public subCommandName?: string = "unlock";

    public data = new SlashCommandBuilder()
        .setName("admin")
        .setDescription("Admin commands for managing the ranking system")
        .addSubcommand((subcommand) =>
            subcommand.setName("unlock").setDescription("Unlocks the ranking system")
                .addUserOption((option) =>
                    option.setName("user")
                        .setDescription("User to unlock")
                        .setRequired(true)
                )
                .addStringOption((option) =>
                    option.setName("reason")
                        .setDescription("Reason for unlocking")
                        .setRequired(false)
                )
                .addStringOption((option) =>
                    option.setName("type")
                        .setDescription("Type of unlock")
                        .setRequired(false)
                        .addChoices(
                            { name: "Global (All Seasons)", value: "global" },
                            { name: "Seasonal (Only This Season)", value: "season" }
                        )
                )
        );

    public async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply({ flags: ["Ephemeral"] });
        const user = interaction.options.getUser("user", true);
        const reason = interaction.options.getString("reason") || "No reason provided";
        const type = interaction.options.getString("type") || "global";
        if (!user || user.bot) return errorMessage("Invalid user", interaction.editReply.bind(interaction));
        if (!["global", "season"].includes(type)) return errorMessage("Invalid type", interaction.editReply.bind(interaction));
        const player = await PlayerManager.getUser(user.id, true);
        if (!player) return errorMessage("Player not found", interaction.editReply.bind(interaction));
        if(!player.suspended) return errorMessage("User is not locked", interaction.editReply.bind(interaction));
        if(type === "global" && !player.suspendedGlobal ) return errorMessage("User is not locked globally", interaction.editReply.bind(interaction));
        if(type === "season" && !player.suspendedSeason ) return errorMessage("User is not locked for this season", interaction.editReply.bind(interaction));
        await player.suspendedUser({
            reason: reason,
            status: false, // Unlock the user
            date: Date.now(),
            staff: {
                id: interaction.user.id,
                username: interaction.user.tag
            }
        }, type === "season" ? "season" : "global");
        await player.addToHistory({
            action: `Unlocked from the ranking system`,
            description: `reason: ${reason}, type: ${type}`,
            newValue: `-`,
            oldValue: `Locked`,
            staff: {
                id: interaction.user.id,
                username: interaction.user.tag
            }
        });

        return successMessage(`Successfully unlocked ${user.tag} from the ranking system.`, interaction.editReply.bind(interaction));
    }
}
