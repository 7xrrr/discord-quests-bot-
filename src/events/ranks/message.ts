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
    const points = LevelingSystem.calcMessageXpForRank(message);
    if(points.points === 0) return;
    member.increaseSeasonPoints({
        characterCount: points.messageLength,
        wordsCount: points.wordCount,
        points: points.points,
        messageCount: 1
    });



   
   
    }
  }

