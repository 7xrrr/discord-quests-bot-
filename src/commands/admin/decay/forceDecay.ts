

import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import configSeason from "../config";
import { errorMessage, successMessage } from "../../../utils/tools";
import { PlayerManager } from "../../../class/PlayerManager";



export default class startSeason extends configSeason {

    public cooldown = this.client.config.forceDecay.cooldown;
    public category = this.client.config.forceDecay.category;



    public ownerOnly: boolean = true
    public isSubcommand: boolean = true;
    public subCommandName?: string = "force-decay";

    public data = new SlashCommandBuilder()
        .setName("admin")
        .setDescription("Admin commands for managing the ranking system")

   
        .addSubcommand((subcommand) =>
            subcommand.setName("force-decay").setDescription("Put player in decay mode instantly")
            .addUserOption((option) => option.setName("user").setDescription("User to put in decay mode").setRequired(true))
        )










    public async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply({ flags:["Ephemeral"] });
        const user = interaction.options.getUser("user", true);
        const reason = interaction.options.getString("reason") || "No reason provided";
        if (!user || user.bot) return errorMessage("Invalid user", interaction.editReply.bind(interaction));
        const player = await PlayerManager.getUser(user.id, true);
        if (!player) return errorMessage("Player not found", interaction.editReply.bind(interaction));
        player.setDecay(true)
        await player.addToHistory({
            action: "Force Decay",
            description: `reason: ${reason}`,
            newValue: "Decay Mode:On",
            oldValue: "Decay Mode:Off",
            staff: {
                id: interaction.user.id,
                username: interaction.user.tag
            }
        })
        if(player.decay) return successMessage("Player is now in decay mode", interaction.editReply.bind(interaction));


 

      
    }


}
