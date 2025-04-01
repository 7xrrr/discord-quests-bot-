

import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import configSeason from "../config";



export default class startSeason extends configSeason {

    public cooldown = this.client.config.startSeason.cooldown;
    public category = this.client.config.startSeason.category;



    public ownerOnly: boolean = true
    public isSubcommand: boolean = true;
    public subCommandName?: string = "start-season";

    public data = new SlashCommandBuilder()
        .setName("admin")
        .setDescription("Admin commands for managing the ranking system")

        .addSubcommand((subcommand) =>
            subcommand
                .setName("start-season")
                .setDescription("Ends the current season")
        )









    public async execute(interaction: ChatInputCommandInteraction) {

        return this.client.commands.get(`season-start`)?.execute(interaction);






    }


}
