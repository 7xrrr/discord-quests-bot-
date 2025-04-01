import { Client, ClientEvents, Events } from "discord.js";
import { Player, PlayerManagerMain } from "../../class/PlayerManager";
import { Rank } from "../../database/models/users";
import { baseDiscordEvent } from "../../core/Event";
export default class ReadyEvent extends baseDiscordEvent {
  name: keyof ClientEvents = Events.ClientReady;
  once = false;

  async executeEvent(client: Client<true>) {

  }
}
PlayerManagerMain.on("rankChange", async (player:Player, oldRank:Rank, newRank:Rank) => {
    console.log(`${player.userId} has been promoted from ${oldRank.name} to ${newRank.name}`);



})

