import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "../../core/Command";

export default class configSeason extends Command {
    public cooldown = this.client.config.rank.cooldown;
    public category = this.client.config.rank.category;

    public data = new SlashCommandBuilder()
        .setName("ranks")
        .setDescription("Edit/View/Create the ranks of the server")
        .addSubcommand((subcommand) =>
            subcommand
        .setName("create")
        .setDescription("Create a new rank")
        .addStringOption((option) =>
            option.setName("name")
                .setDescription("Name of the rank")
                .setRequired(true)
                .setMinLength(2)
        )
        .addIntegerOption((option) =>
            option.setName("requirement_points")
                .setDescription("Required points for this rank")
                .setRequired(true)
                .setMinValue(0) // Ensures positive numbers
                .setMaxValue(10000) // Ensures a reasonable cap
        )
          .addStringOption((option) =>
            option.setName("color")
                .setDescription("Color of the rank (hex or name)")
                .setRequired(true)
         )
         
    
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("edit")
                .setDescription("Edit an existing rank")
                .addStringOption((option) => 
                    option.setName("name")
                        .setDescription("Name of the rank to edit")
                        .setRequired(true)
                        .setAutocomplete(true)
                )

        )

    public async execute(interaction: CommandInteraction) {
   
    }
}