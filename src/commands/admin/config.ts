import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "../../core/Command";

export default class AdminCommands extends Command {



    public data = new SlashCommandBuilder()
        .setName("admin")
        .setDescription("Admin commands for managing the ranking system")

        .addSubcommand((subcommand) =>
            subcommand
                .setName("end-season")
                .setDescription("Ends the current season")
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("start-season")
                .setDescription("Starts a new season with an end time")
                .addStringOption((option) => option.setName("time").setRequired(false).setMinLength(2).setDescription("Time of the season"))
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("rank-set")
                .setDescription("Manually set a user's rank")
                .addUserOption((option) =>
                    option.setName("user")
                        .setDescription("User to set rank for")
                        .setRequired(true)
                )
                .addStringOption((option) =>
                    option.setName("rank")
                        .setDescription("New rank")
                        .setRequired(true)
                        .setAutocomplete(true)
                )
        )
        .addSubcommand((subcommand) =>
            subcommand.setName("lock").setDescription("Locks the ranking system")
                .addUserOption((option) =>
                    option.setName("user")
                        .setDescription("User to lock")
                        .setRequired(true)
                )
                .addStringOption((option) =>
                    option.setName("reason")
                        .setDescription("Reason for locking")
                        .setRequired(true)
                )
                .addStringOption((option) =>
                    option.setName("time")
                        .setDescription("Time of the lock (auto unlock)")
                        .setRequired(false)
                )
                .addStringOption((option) =>
                    option.setName("type")
                        .setDescription("Type of lock")
                        .setRequired(false)
                        .addChoices(
                            { name: "Global (All Seasons)", value: "global" },
                            { name: "Seasonal (Only This Season)", value: "season" }
                        )
                )





        )
        .addSubcommand((subcommand) =>
            subcommand.setName("unlock").setDescription("Unlocks the ranking system")
                .addUserOption((option) =>
                    option.setName("user")
                        .setDescription("User to unlock")
                        .setRequired(true)
                )
                .addStringOption((option) =>
                    option.setName("reason")
                        .setDescription("Reason for unlocking")
                        .setRequired(false)
                )
                .addStringOption((option) =>
                    option.setName("type")
                        .setDescription("Type of unlock")
                        .setRequired(false)
                        .addChoices(
                            { name: "Global (All Seasons)", value: "global" },
                            { name: "Seasonal (Only This Season)", value: "season" }
                        )
                )
        )

        .addSubcommand((subcommand) =>
            subcommand.setName("reset").setDescription("Resets the ranking system")
                .addUserOption((option) =>
                    option.setName("user")
                        .setDescription("User to reset")
                        .setRequired(true))
                        .addStringOption((option) =>
                            option.setName("reason")
                                .setDescription("Reason for resetting")
                                .setRequired(false)
                        )


        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("points")
                .setDescription("Manage points for users")
                .addStringOption((option) =>
                    option.setName("action")
                        .setDescription("Give or take points")
                        .setRequired(true)
                        .addChoices(
                            { name: "give", value: "give" },
                            { name: "take", value: "take" }
                        )
                )
                .addIntegerOption((option) =>
                    option.setName("amount")
                        .setDescription("Amount of points to modify")
                        .setMinValue(1)
                        .setMaxValue(99999)
                        .setRequired(true)
                )
                .addUserOption((option) =>
                    option.setName("user")
                        .setDescription("User to modify points for")
                        .setRequired(true)
                )
        )
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
        .addSubcommand((subcommand) =>
            subcommand.setName("force-check").setDescription("Force check promotions/demotions")
        )
        /*
        .addSubcommand((subcommand) =>
            subcommand.setName("player").setDescription("Manage player data")
           .addUserOption((option) => option.setName("user").setDescription("User to manage").setRequired(true))
        )*/
        .addSubcommand((subcommand) =>
            subcommand.setName("force-decay").setDescription("Put player in decay mode instantly")
            .addUserOption((option) => option.setName("user").setDescription("User to put in decay mode").setRequired(true))
        )
        .addSubcommand((subcommand) =>
            subcommand.setName("force-disable").setDescription("Globally disable system")
        )
        .addSubcommand((subcommand) =>
            subcommand.setName("force-enable").setDescription("Globally enable system")
        );

    public async execute(interaction: CommandInteraction) {

    }
}
