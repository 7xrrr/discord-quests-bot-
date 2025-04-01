

import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "../../core/Command";

export default class configSeason extends Command {

    public cooldown = this.client.config.seasonStart.cooldown;
    public category = this.client.config.seasonStart.category;






    public data = new SlashCommandBuilder()
        .setName("season")
        .setDescription("Start or end a season")
        
        .addSubcommand((subcommand) =>
            subcommand
                .setName("start")
                .addStringOption((option) => option.setName("time").setRequired(false).setMinLength(2).setDescription("Time of the season"))

                .setDescription("Start a new season")
        ).addSubcommand((subcommand) =>
            subcommand
                .setName("end")
                .setDescription("End the current season")
        )
            

        
  

    public async execute(interaction: CommandInteraction) {

    }


}
