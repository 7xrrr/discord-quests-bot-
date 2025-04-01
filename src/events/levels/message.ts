import {
  ClientEvents,
  Events, Message
} from "discord.js";
import { baseDiscordEvent } from "../../core/Event";
import { PlayerManager } from "../../class/PlayerManager";
import { LevelingSystem } from "../../class/levelManager";
import { SettingsManager } from "../../class/settingsManager";
export default class commandsEvents extends baseDiscordEvent {
  name: keyof ClientEvents = Events.MessageCreate;
  once = false;

  async executeEvent(message:Message<true>) {
      if (message.author.bot || !message.guildId || SettingsManager.disabled) return;
    const member = await PlayerManager.getUser(message.author.id, true);
    if (!member || member.suspended) return;
    const xp = LevelingSystem.calcMessageXp(message);
    if(xp.xp === 0) return;
    member.incressDailyXP({
        characterCount: xp.messageLength,
        wordsCount: xp.wordCount,
        xp: xp.xp,
        messageCount: 1
    }); 
  





   
   
    }
  }

