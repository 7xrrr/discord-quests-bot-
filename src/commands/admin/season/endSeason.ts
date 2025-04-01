

import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import configSeason from "../config";



export default class startSeason extends configSeason {

    public cooldown = this.client.config.endSeason.cooldown;
    public category = this.client.config.endSeason.category;



    public ownerOnly: boolean = true
    public isSubcommand: boolean = true;
    public subCommandName?: string = "end-season";

    public data = new SlashCommandBuilder()
        .setName("admin")
        .setDescription("Admin commands for managing the ranking system")

        .addSubcommand((subcommand) =>
            subcommand
                .setName("end-season")
                .setDescription("Ends the current season")
        )









    public async execute(interaction: ChatInputCommandInteraction) {

        return this.client.commands.get(`season-end`)?.execute(interaction);






    }


}
