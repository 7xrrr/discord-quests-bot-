import {
  ActionRowBuilder, ButtonBuilder,
  ButtonInteraction,
  ButtonStyle, CommandInteraction,
  CommandInteractionOptionResolver,
  ComponentType,
  MessageActionRowComponentBuilder,
  MessageFlags, SlashCommandBuilder
} from "discord.js";

import {
  AlartType,
  AlertCreator,
  TextAlignment,
} from "../../utils/AlertCreator";

import { Command } from "../../core/Command";
import { Blacklisted, IBlacklisted } from "../../database/models/blacklisted";
import { MongooseService } from "../../database/database";

export default class Ping extends Command {
  
  public cooldown = this.client.config.blacklist.cooldown;
  public category = this.client.config.blacklist.category;
  public enabled = this.client.config.blacklist.enabled;
  public requiredPermission = this.client.config.blacklist.requiredPermission;

  public data = new SlashCommandBuilder()
    .setName("blacklist")
    .setDescription("Blacklist a user from xp or commands")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to blacklist")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("type")
        .setDescription("The type of blacklist xp or commands")
        .setRequired(true)
        .addChoices([
          {
            name: "xp",
            value: "xp",
          },
          {
            name: "commands",
            value: "commands",
          },
        ])
    );

  public async execute(interaction: CommandInteraction) {
    const user = (
      interaction.options as CommandInteractionOptionResolver
    ).getUser("user", true);
    const type = (
      interaction.options as CommandInteractionOptionResolver
    ).getString("type", true);

    // * check if the user is bot owner or server owner
    if (
      user.id == process.env?.OWNER_ID ||
      interaction.guild?.ownerId == user.id
    ) {
      await interaction.reply({
        files: [
          await AlertCreator.alert(
            AlartType.ERROR,
            TextAlignment.CENTER,
            "You are not allowed to blacklist a bot owner or server owner!"
          ),
        ],
        flags: "Ephemeral",
      });
      return;
    }

    // * check if the user is higher than the commands user
    let adminRole = interaction.guild?.members.cache.get(interaction.user.id)
      ?.roles.highest;
    let userRole = interaction.guild?.members.cache.get(user.id)?.roles.highest;
    if (!adminRole || !userRole) return;
    if (
      adminRole.comparePositionTo(userRole) < 0 &&
      (interaction.user.id !== process.env?.OWNER_ID ||
        interaction.guild?.ownerId !== interaction.user.id)
    ) {
      await interaction.reply({
        files: [
          await AlertCreator.alert(
            AlartType.ERROR,
            TextAlignment.CENTER,
            "You are not allowed to blacklist a user with a higher role!"
          ),
        ],
        flags: "Ephemeral",
      });
      return;
    }

    // * Check if user is blacklisted already
    const blacklisted = await Blacklisted.findOne({
      userID: user?.id,
      guildID: interaction.guildId,
    });

    let removeBtn = new ButtonBuilder()
      .setCustomId("remove-blacklist")
      .setLabel("Remove")
      .setStyle(ButtonStyle.Danger);
    let row =
      new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
        removeBtn
      );

    if (blacklisted) {
      if (blacklisted[type as keyof IBlacklisted] == true) {
        let warningImage = await AlertCreator.alert(
          AlartType.WARNING,
          TextAlignment.CENTER,
          `⚠️ User is already in ${type} blackliste.\nDo you Want to remove ${user?.username} from ${type} blacklist?`
        );

        let replayedMessage = await interaction.reply({
          files: [warningImage],
          components: [row],
          flags: [MessageFlags.Ephemeral],
        });

        let filter = (i: ButtonInteraction) =>
          i.customId === "remove-blacklist" &&
          i.user.id === interaction.user.id &&
          i.channel?.id === interaction.channel?.id &&
          i.guildId === interaction.guildId;
        let collector = await replayedMessage
          ?.awaitMessageComponent({
            filter,
            componentType: ComponentType.Button,
            time: 60000,
          })
          .catch(() => null);
        if (!collector)
          await interaction.followUp({
            files: [
              await AlertCreator.alert(
                AlartType.ERROR,
                TextAlignment.CENTER,
                "You took too long to respond"
              ),
            ],
            flags: [MessageFlags.Ephemeral],
          });
        else if (collector) {
          collector.deferUpdate();
          if (collector.customId === "remove-blacklist") {
            if (type == "xp") {
              blacklisted.xp = false;
            } else if (type == "commands") {
              blacklisted.commands = false;
            }
            await blacklisted.save();

            await interaction.followUp({
              files: [
                await AlertCreator.alert(
                  AlartType.SUCCESS,
                  TextAlignment.CENTER,
                  `✅ Removed ${user?.username} from ${type} blacklist`
                ),
              ],
            });
          }
        }
      } else {
        if (type == "xp") {
          blacklisted.xp = true;
        } else if (type == "commands") {
          blacklisted.commands = true;
        }
        await blacklisted.save();

        await interaction.reply({
          files: [
            await AlertCreator.alert(
              AlartType.SUCCESS,
              TextAlignment.CENTER,
              `✅ Added ${user?.username} to ${type} blacklist`
            ),
          ],
        });
      }
    } else {
      let newBlacklisted = new Blacklisted({
        userID: user?.id,
        guildID: interaction.guildId,
        global: false,
        xp: type == "xp",
        commands: type == "commands",
      });
      await newBlacklisted.save();

      await interaction.reply({
        files: [
          await AlertCreator.alert(
            AlartType.SUCCESS,
            TextAlignment.CENTER,
            `✅ Added ${user?.username} to ${type} blacklist`
          ),
        ],
      });
    }

    // * Cache data
    MongooseService.getInstance().cacheData();
  }
}
