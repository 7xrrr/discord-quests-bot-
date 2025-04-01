

import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import configSeason from "./config";
import { SeasonManager } from "../../class/seasonManager";
import { ms } from 'humanize-ms';
import { errorMessage, successMessage } from "../../utils/tools";

export default class startSeason extends configSeason {

    public cooldown = this.client.config.seasonStart.cooldown;
    public category = this.client.config.seasonStart.category;



    public ownerOnly: boolean = true
    public isSubcommand: boolean = true;
    public subCommandName?: string = "start";
    
    public data = new SlashCommandBuilder()
        .setName("season")
        .setDescription("Start or end a season")







    public async execute(interaction: CommandInteraction) {
        await interaction.deferReply({ ephemeral: true });
        const currentSeason = await SeasonManager.getCurrentSeason();
        if (currentSeason) return await errorMessage("There is already a season running", interaction.editReply.bind(interaction));
        const optionValue = interaction.options.get("time")?.value as any
      
        const time = optionValue ? ms(optionValue) : NaN;
     
        if((!time || isNaN(time)) && optionValue) return await errorMessage("Invalid time format",interaction.editReply.bind(interaction));
        const newSeason = await SeasonManager.createNewSeason(time);
        if (!newSeason) return await errorMessage("Error creating season", interaction.editReply.bind(interaction));
        return await successMessage(`Season ${newSeason.data.seasonId} started ${time ? `For ${optionValue}` : ""}`, interaction.editReply.bind(interaction));


      




    }


}
