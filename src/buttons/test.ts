export default {
    id: "", // button custom id here
    permissions: [],
    roleRequired: "",
    function: async function ({ button }: { button: any }) {
        const { client } = await import("../index.js");
        button.reply("test");
    },
} as any;
