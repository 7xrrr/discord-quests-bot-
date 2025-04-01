import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "../../core/Command";

export default class configSeason extends Command {

    public cooldown = this.client.config.reward.cooldown;
    public category = this.client.config.reward.category;

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

    public async execute(interaction: CommandInteraction) {

    }
}
