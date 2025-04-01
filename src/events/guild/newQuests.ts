import config from "../../config.js";
import { client } from "../../index.js";
import { makeAxiosInstance } from "../../questFunc/axiosInstance.js";
import schedule from "node-schedule";
import { Quest } from "../../interface/quest.js";
import { sendNewQuests } from "../../questFunc/newQuests.js";
import { QuestUser } from "../../class/UserClass.js";
import { tokenlist } from "../../tokens.js";

export const selfBotAxios = makeAxiosInstance(config.selfAccountToken);


  



export default {
    name: "ready",
    description: "client ready event",
    once: false,
    function: async function () {

        const guild = client.guilds.cache.get(config.notification.serverid);
        const channel: any = guild && await guild.channels.fetch(config?.notification?.channelid);
        if (!channel) return console.log("Notification channel not found");
        let startObj = {
            tokens: tokenlist.map(e => new QuestUser({ token: e,disableCache:true })),
            currentIndex: 0,
        };
        

   







       


        schedule.scheduleJob("*/30 * * * * *", async function () {
            console.log("fetching quests")
            let currentUser = startObj.tokens[startObj.currentIndex];
         
            if(!currentUser) {
                startObj.currentIndex = 0;
                currentUser = startObj.tokens[startObj.currentIndex];
            }
            await currentUser.fetchQuests();
            startObj.currentIndex += 1;
            if(startObj.currentIndex >= startObj.tokens.length) startObj.currentIndex = 0;

        });


    }

} as any;
client.on("newQuests", async (quests: Quest[]) => {
    const guild = client.guilds.cache.get(config.notification.serverid);
    const channel: any = guild && await guild.channels.fetch(config?.notification?.channelid);
    if (!channel) return console.log("Notification channel not found");
    await sendNewQuests(quests, channel)
})