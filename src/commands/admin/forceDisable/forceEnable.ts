

import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import configSeason from "../config";
import { settingsMain, SettingsManager } from "../../../class/settingsManager";
import { errorMessage } from "../../../utils/tools";



export default class startSeason extends configSeason {

    public cooldown = this.client.config.endSeason.cooldown;
    public category = this.client.config.endSeason.category;



    public ownerOnly: boolean = true
    public isSubcommand: boolean = true;
    public subCommandName?: string = "force-enable";

    public data = new SlashCommandBuilder()
        .setName("admin")
        .setDescription("Admin commands for managing the ranking system")

        .addSubcommand((subcommand) =>
            subcommand.setName("force-enable").setDescription("Globally enable system")
        );








    public async execute(interaction: ChatInputCommandInteraction) {
        const disable = SettingsManager.disabled;
        if (!disable) return errorMessage("System is already enabled", interaction.reply.bind(interaction));
        SettingsManager.disabled = false;
        settingsMain.emit("update", true);
        return errorMessage("System has been enabled", interaction.reply.bind(interaction));









    }


}
