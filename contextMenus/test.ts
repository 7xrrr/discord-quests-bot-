export default {
    name: "test",
    type: "message",
    function: async function ({ interaction }: { interaction: any }) {
        const { client } = await import("../index.js");
        interaction.reply("test");
    },
} as any;