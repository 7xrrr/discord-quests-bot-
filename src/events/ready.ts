import { Client, ClientEvents, Events, version } from "discord.js";
import { baseDiscordEvent } from "../core/Event";
export default class ReadyEvent extends baseDiscordEvent {
  name: keyof ClientEvents = Events.ClientReady;
  once = false;

  async executeEvent(client: Client<true>) {
    await this.waitCommandsLoad();

    for (const guild of client.guilds.cache.values()) {
      await guild.commands.set(
        this.customClient.commands.filter(e => !e?.isSubcommand && !e?.isSubcommandGroup).map((command) => command.data.toJSON())
      );
    }

    // await client.application?.commands.set(
    //   this.customClient.commands.map((command) => command.data.toJSON())
    // );

 
    console.log(
      `Logged in as ${client.user.tag} Ratelimit: ${client.options.rest?.offset} Version: ${version}`
    );

    console.log(
      "Bot become online in " +
        (Date.now() - (await import("../bot")).startTimestamp) / 1000 +
        " seconds"
    );
  }

  async waitCommandsLoad() {
    return new Promise<void>((resolve) => {
      while (!this.customClient.getisCommandsLoaded()) {}
      resolve();
    });
  }
}
