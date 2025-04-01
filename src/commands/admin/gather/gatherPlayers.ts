

import { AttachmentBuilder, AutocompleteInteraction, ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import configSeason from "../config";
import { rankManager } from "../../../class/RankManager";
import { PlayerManager } from "../../../class/PlayerManager";
import { convertJsonToExcel, errorMessage } from "../../../utils/tools";



export default class startSeason extends configSeason {

    public cooldown = this.client.config.rankSet.cooldown;
    public category = this.client.config.rankSet.category;



    public ownerOnly: boolean = true
    public isSubcommand: boolean = true;
    public subCommandName?: string = "gather-players";

    public data = new SlashCommandBuilder()
        .setName("admin")
        .setDescription("Admin commands for managing the ranking system")

        .addSubcommand((subcommand) =>
            subcommand
                .setName("gather-players")
                .setDescription("Export players of a specific rank")
                .addStringOption((option) =>
                    option.setName("rank")
                        .setDescription("Rank to gather players from")
                        .setRequired(true)
                        .setAutocomplete(true)
                )
        )


    public async autocomplete(interaction: AutocompleteInteraction): Promise<void> {
        const focusedValue = interaction.options.getFocused();
        const choices = await (await rankManager.getRanks()).map(rank => ({ name: rank.name, value: rank.rankId }));
        const filtered = focusedValue.trim().length > 0 ? choices.filter(choice => choice.name.toLowerCase().includes(focusedValue)).slice(0, 25) : [{name:"All",value:"all"},...choices].slice(0,25);

  
 
        await interaction.respond(
            filtered
        );
    }








    public async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply({ flags: "Ephemeral" });
        const rankId = interaction.options.getString("rank", true);
        const ranks = rankId === "all" ? await rankManager.getRanks() : [await rankManager.getRank(rankId)];
        let players = await PlayerManager.getAllPlayers();
        if(rankId !== "all") {
            players =  players.filter(player => ranks.some(rank => rank?.rankId && rank?.rankId === player.rank?.id));
        }
        console.log(players.length)
        if(players.length === 0) return errorMessage("No players found", interaction.editReply.bind(interaction));  
        const json = players.map(e => ({
            id: e.userId,
            points: e.points,
            rank: e.rank?.name,
            decay: e.decay,
            suspended: e.suspended,
            level: e.level,
            ["Last Active"]: e.lastActive,
            ["Active Days"]: e.ActiveDaysCount,
        }))
        const exelBuffer = await convertJsonToExcel(json);
        if(!exelBuffer) return errorMessage("An error occured while converting the data to xlsx ", interaction.editReply.bind(interaction));

 
        const attachment = new AttachmentBuilder(exelBuffer, { name: "data.xlsx " });
        interaction.editReply({ files: [attachment] });
       
        







    }


}
