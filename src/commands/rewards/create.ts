

import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import configSeason from "./config";
import { errorMessage, fetchDiscohookUrl, successMessage } from "../../utils/tools";
import { RewardManager } from "../../class/rewardManager";



export default class startSeason extends configSeason {

    public cooldown = this.client.config.rewardCreate.cooldown;
    public category = this.client.config.rewardCreate.category;



    public ownerOnly: boolean = true
    public isSubcommand: boolean = true;
    public subCommandName?: string = "create";

    public data = new SlashCommandBuilder()
        .setName("reward")
        .setDescription("Manage rewards")

        .addSubcommand((subcommand) =>
            subcommand
                .setName("create")
                .setDescription("Create a new reward")
                .addStringOption((option) =>
                    option.setName("name")
                        .setDescription("Name of the reward")
                        .setRequired(true)
                        .setMinLength(2)
                )
                .addStringOption((option) =>
                    option.setName("discordhook")
                        .setDescription("Discord Webhook URL")
                        .setRequired(true)
                )
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("edit")
                .setDescription("Edit an existing reward")
                .addStringOption((option) =>
                    option.setName("name")
                        .setDescription("Name of the reward to edit")
                        .setRequired(true)
                        .setAutocomplete(true)
                )
        );









    public async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply({ flags: "Ephemeral" });
        const name = interaction.options.getString("name", true);
        const discordhook = interaction.options.getString("discordhook");
        const data = discordhook ? await fetchDiscohookUrl(discordhook) : null
        if (!discordhook || data?.code === 1 || !data?.link || !data?.content) return errorMessage("Please provide a Discord Webhook URL", interaction.editReply.bind(interaction));
        const rewards = await RewardManager.getRewards()
        const sameName = rewards.find(r => r.name === name)
        if (sameName) return errorMessage("A reward with that name already exists", interaction.editReply.bind(interaction));
        const reward = await RewardManager.createReward({ name, messageURL: data.shortLink, payload: data.content, });
        if(!reward.id) return errorMessage("An error occurred while creating the reward", interaction.editReply.bind(interaction));
        console.log(data);
        return successMessage(`Reward ${reward.name} has been created`, interaction.editReply.bind(interaction));















    }


}
