

import { AutocompleteInteraction, ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import configSeason from "./config";
import { rankManager } from "../../class/RankManager";
import { errorMessage, isHexColor, successMessage } from "../../utils/tools";



export default class startSeason extends configSeason {

    public cooldown = this.client.config.rankCreate.cooldown;
    public category = this.client.config.rankCreate.category;



    public ownerOnly: boolean = true
    public isSubcommand: boolean = true;
    public subCommandName?: string = "create";

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









    public async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply({ flags: "Ephemeral" });
        const rankName = interaction.options.getString("name");
        const requirementPoints = interaction.options.getInteger("requirement_points");
        let color = interaction.options.getString("color");
        if(!rankName || !requirementPoints || !color) return errorMessage("Please provide all the required information",interaction.editReply.bind(interaction));
        const ranks = await rankManager.getRanks();
        const sameName = ranks.find(rank => rank.name.toLowerCase().trim() === rankName.toLowerCase().trim());
        const samePointsRank = ranks.find(rank => rank.pointsrequirements === requirementPoints);
        if(sameName) return errorMessage("A rank with that name already exists",interaction.editReply.bind(interaction));
        if(samePointsRank) return errorMessage("A rank with that points already exists",interaction.editReply.bind(interaction));
        if(!color.startsWith("#")) color = `#${color}`;
        if(!isHexColor(color)) return errorMessage("Invalid color",interaction.editReply.bind(interaction));
        const rank = await rankManager.createRank(rankName,requirementPoints,color);
        if(!rank) return errorMessage("Failed to create rank",interaction.editReply.bind(interaction));
        return successMessage(`Rank ${rank.name} created`,interaction.editReply.bind(interaction));

      
    
        


    }


}
