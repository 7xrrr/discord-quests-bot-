import {
  CommandInteraction,
  CommandInteractionOptionResolver, SlashCommandBuilder
} from "discord.js";

import { AlertCreator, AlartType, TextAlignment } from "../utils/AlertCreator";

import { Command } from "../core/Command";

export default class Ping extends Command {

  public cooldown = this.client.config.ping.cooldown;
  public category = this.client.config.ping.category;
  public enabled = this.client.config.ping.enabled;



  public data = new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Replies with Pong v2!")
    .addStringOption((option) =>
      option.setName("type")
    .setDescription("The type of alert")
    .setRequired(true)
    .setChoices([{
      name: "Error",
      value: AlartType.ERROR.toString(),
    },
    {
      name: "Warning",
      value: AlartType.WARNING.toString()
    },
    {
      name: "Info",
      value: AlartType.INFO.toString()
    },
    {
      
      name: "Success",
      value: AlartType.SUCCESS.toString()
    }])
    );

  public async execute(interaction: CommandInteraction) {
    let errorImage = await AlertCreator.alert(
      (interaction.options as CommandInteractionOptionResolver).getString("type") as unknown as AlartType,
      TextAlignment.LEFT,
      "✅ user pinged\nuser : racoon818"
    );

    await interaction.reply({
      files: [errorImage],
    });
  }
}
