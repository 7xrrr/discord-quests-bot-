import { GuildMember, VoiceState } from "discord.js";
import config from "../../config.js";


export default {
	name: "voiceStateUpdate",
	description: "Client on receive message event",
	once: false,
	function: async function (oldState:VoiceState,newState:VoiceState) {
        if(!newState.guild?.id || !newState.channelId) return;
        if(newState.guild.id === config.server.serverid && newState.channelId === config.server.channelid){
            let member:GuildMember = await newState.guild.members.fetch(newState.member.id).catch((err) => null);
            if(member?.roles.cache.get(config.server.roleId)) {
                await member.roles.remove(config.server.roleId).catch((err) => null);
            }
        }
            

	},
};
