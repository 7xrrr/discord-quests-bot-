import path from "path";
import { HandlerBase } from "../core/HandlerBase";
import { Command } from "../core/Command";
import fs from "fs";
import { ICommandSettings } from "../database/models/commandsSettings";
export class CommandHandler extends HandlerBase {
  protected mainPath = path.join(__dirname, "..", "commands");

  async loadCommands(Folderpath: string = this.mainPath): Promise<void> {
    // * check if the path folder exists
    if (!fs.existsSync(Folderpath)) {
      this.logger.error("Commands Folder not found ", {
        service: "CommandHandler",
      });
      return;
    }

    let folderStack: string[] = [Folderpath];
    while (folderStack.length > 0) {
      const folder = folderStack.pop();
      if (!folder) continue;
      for (const file of await fs.promises.readdir(folder)) {
        try {
          const filePath = path.join(folder, file);
          const stat = await fs.promises.stat(filePath);

          if (stat.isDirectory()) {
            folderStack.push(filePath);
          } else if (file.endsWith(".js") || file.endsWith(".ts")) {
            const module = (await import(filePath)).default;
            if (!module) {
              this.logger.error(
                `Error loading file: \x1b[30m${file}\x1b[0m error : module not found`,
                {
                  service: "CommandHandler",
                }
              );
              continue;
            }

            if (!(module.prototype instanceof Command)) {
              this.logger.error(
                `Command ${
                  module?.data?.name ?? "unknown"
                } does not extend Command`,
                { service: "CommandHandler" }
              );
              return;
            }
            let command = new module() as Command;
            let cachedCommand = this.cache
              .get("commands")
              ?.find(
                (c: ICommandSettings) => c.commandName === command.data.name
              );
            if (cachedCommand) {
              command.cooldown = cachedCommand.cooldown;

              command.requiredPermission = cachedCommand.requiredPermission;
              command.requiredRoles = cachedCommand.requiredRoles;
              command.enabled = cachedCommand.enabled;
            }
            const name = command.isSubcommand ? `${command.data.name}-${command.subCommandName}`.toLowerCase() : command.data.name;

            this.client.commands.set(name, command);

            this.totalLoaded++;
          }
        } catch (error) {
          console.log(error);

          this.logger.error(
            `Error loading file: \x1b[30m${file}\x1b[0m error : ${error}`,
            {
              service: "CommandHandler",
            }
          );
        }
      }
    }

    this.client.setisCommandsLoaded(true);
    this.logger.info(
      ` Total \x1b[32mcommands\x1b[0m loaded: \x1b[32m${this.totalLoaded}\x1b[0m`,
      {
        service: "CommandHandler",
      }
    );
    return;
  }
}
