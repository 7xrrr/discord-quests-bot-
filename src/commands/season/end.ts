

import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import configSeason from "./config";
import { SeasonManager } from "../../class/seasonManager";
import { errorMessage, successMessage } from "../../utils/tools";

export default class startSeason extends configSeason {

    public cooldown = this.client.config.seasonStart.cooldown;
    public category = this.client.config.seasonStart.category;



    public ownerOnly: boolean = true
    public isSubcommand: boolean = true;
    public subCommandName?: string = "end";
    public data = new SlashCommandBuilder()
        .setName("season")
        .setDescription("Start or end a season")







    public async execute(interaction: CommandInteraction) {
        await interaction.deferReply({ ephemeral: true });
        const currentSeason = await SeasonManager.getCurrentSeason();
        if (!currentSeason) return await errorMessage("There is no season running", interaction.editReply.bind(interaction));
        currentSeason.end({ reason: `Season ended by ${interaction.user.tag}`, staff: { id: interaction.user.id, username: interaction.user.username } }).then(() => {
            successMessage(`Season ${currentSeason.id} ended`, interaction.editReply.bind(interaction));


        }).catch(() => {
            errorMessage("Failed to end season", interaction.editReply.bind(interaction));
        });
   
      




    }


}
