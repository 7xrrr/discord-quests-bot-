import {
  ApplicationCommandOptionType,
  CacheType,
  ClientEvents,
  Events,
  GuildMemberRoleManager,
  Interaction,
  PermissionsBitField
} from "discord.js";
import { baseDiscordEvent } from "../core/Event";
import { AlartType, AlertCreator, TextAlignment } from "../utils/AlertCreator";
export default class commandsEvents extends baseDiscordEvent {
  name: keyof ClientEvents = Events.InteractionCreate;
  once = false;

  async executeEvent(interaction: Interaction<CacheType>) {
    if (!interaction.isCommand()) return;

    const subcommand = interaction.options.data.find(e => [ApplicationCommandOptionType.Subcommand,ApplicationCommandOptionType.SubcommandGroup].includes(e.type));
    const commandName = subcommand ? `${interaction.commandName}-${subcommand.name}`.toLowerCase() : interaction.commandName;
    const command = this.customClient.commands.get(commandName);
    if (!command) return;
   

    if (command.ownerOnly) {
      if (interaction.user.id !== process.env?.OWNER_ID) {
        await interaction.reply({
          files: [
            await AlertCreator.alert(
              AlartType.ERROR,
              TextAlignment.CENTER,
              "You are not allowed to use this command!"
            ),
          ],
          flags: "Ephemeral",
        });
        return;
      }

      try {
        await command.execute(interaction);
      } catch (error) {
        this.logger.error(
          `Error executing command ${command.data.name} Error : ${error}`,
          {
            service: "commandsEvents",
            error: error,
          }
        );

       const reply = await interaction.fetchReply();
       if(!reply) {
        await interaction.reply({
          files: [
            await AlertCreator.alert(
              AlartType.ERROR,
              TextAlignment.CENTER,
              "There was an error while executing this command!"
            ),
          ],
          flags: "Ephemeral",
        });
       } 
       else {
        await interaction.editReply({
          files: [
            await AlertCreator.alert(
              AlartType.ERROR,
              TextAlignment.CENTER,
              "There was an error while executing this command!"
            ),
          ],
        });
       }
      }
    } else {
      try {
        const coolDownKey = `${commandName}-${interaction.user.id}`;

        // * Check cooldown
        if (this.customClient.cooldowns.has(coolDownKey)) {
          const cooldown = this.customClient.cooldowns.get(coolDownKey);
          if (cooldown) {
            if (cooldown.expiresAt > Date.now() && !cooldown.replyed) {
              await interaction.reply({
                files: [
                  await AlertCreator.alert(
                    AlartType.ERROR,
                    TextAlignment.CENTER,
                    `You are on cooldown!\nPlease wait ${Math.round(
                      (cooldown.expiresAt - Date.now()) / 1000
                    )} seconds.`
                  ),
                ],
                flags: "Ephemeral",
              });
              cooldown.replyed = true;
              return;
            } else if (cooldown.expiresAt < Date.now()) {
              this.customClient.cooldowns.delete(coolDownKey);
              this.logger.info(
                `User ${interaction.user.id} cooldown deleted | ${command.data.name}`
              );
            } else {
              return this.logger.info(
                `User ${interaction.user.id} is on cooldown for ${Math.round(
                  (cooldown.expiresAt - Date.now()) / 1000
                )} seconds | ${command.data.name}`
              );
            }
          }
        } else {
          this.customClient.cooldowns.set(coolDownKey, {
            expiresAt: Date.now() + command.cooldown,
            userID: interaction.user.id,
            command: commandName,
            replyed: false,
          });
        }

        if (this.customClient.blacklisted.has(interaction.user.id)) {
          let commandBlacklisted = this.customClient.blacklisted.get(
            interaction.user.id
          )?.commands;
          if (commandBlacklisted) {
            await interaction.reply({
              files: [
                await AlertCreator.alert(
                  AlartType.ERROR,
                  TextAlignment.CENTER,
                  "You are blacklisted from using bot commands!"
                ),
              ],
              flags: "Ephemeral",
            });
            return;
          }
        }

        if (process.env?.OWNER_ID) {
          if (interaction.user.id === process.env?.OWNER_ID) {
            await command.execute(interaction);
            return;
          }
        }

        //  * check if ther is a required permissions
        if (command.requiredPermission) {
          if (!interaction.member) {
            await interaction.reply({
              files: [
                await AlertCreator.alert(
                  AlartType.ERROR,
                  TextAlignment.CENTER,
                  "An error occured while checking your permissions! [ member not found ]"
                ),
              ],
              flags: ["Ephemeral"],
            });
            return;
          }
          if (interaction.member?.permissions instanceof PermissionsBitField) {
            if (
              !interaction.member?.permissions.has(command.requiredPermission)
            ) {
              await interaction.reply({
                files: [
                  await AlertCreator.alert(
                    AlartType.ERROR,
                    TextAlignment.CENTER,
                    "You are not allowed to use this command!"
                  ),
                ],
                flags: ["Ephemeral"],
              });
              return;
            }
          } else {
            await interaction.reply({
              files: [
                await AlertCreator.alert(
                  AlartType.ERROR,
                  TextAlignment.CENTER,
                  "An error occured while checking your permissions! [ not a bitfield ]"
                ),
              ],
              flags: ["Ephemeral"],
            });
            return;
          }
        }

        // * check if ther is a required roles
        if (command.requiredRoles && command.requiredRoles.size > 0) {
          if (!interaction.member) {
            await interaction.reply({
              files: [
                await AlertCreator.alert(
                  AlartType.ERROR,
                  TextAlignment.CENTER,
                  "An error occured while checking your roles! [ member not found ]"
                ),
              ],
              flags: ["Ephemeral"],
            });
            return;
          }

          if (interaction.member.roles instanceof GuildMemberRoleManager) {
            let hasRole = false;
            for (const roleId of command.requiredRoles.values()) {
              if (interaction.member.roles.cache.has(roleId)) {
                hasRole = true;
                break;
              }
            }

            if (!hasRole) {
              interaction.reply({
                files: [
                  await AlertCreator.alert(
                    AlartType.ERROR,
                    TextAlignment.CENTER,
                    "You need one of the required roles to use this command!"
                  ),
                ],
                flags: ["Ephemeral"],
              });
              return;
            }
          }
        }

        await command.execute(interaction);
      } catch (error) {
        this.logger.error(
          `Error executing command ${command.data.name} Error : ${error}`,
          {
            service: "commandsEvents",
            error: error,
          }
        );

        await interaction.reply({
          content: "There was an error while executing this command!",
          flags: "Ephemeral",
        });
        interaction;
      }
    }
  }
}
