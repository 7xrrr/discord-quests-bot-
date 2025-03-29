import { CommandInteraction } from "discord.js"; // Import CommandInteraction type

export default {
    id: "test",
    cooldown: 0,
    function: async function ({ interaction, choices }: { interaction: CommandInteraction, choices: any }) { // Add type annotations
        interaction.reply("test");
    }
};
