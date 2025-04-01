import path from "path";
import { baseDiscordEvent } from "../core/Event";
import { HandlerBase } from "../core/HandlerBase";
import fs from "fs";
export class EventHandler extends HandlerBase {
  protected mainPath = path.join(__dirname, "..", "events");

  async loadEvents(Folderpath: string = this.mainPath): Promise<void> {
    // * check if the path folder exists
    if (!fs.existsSync(Folderpath)) {
      this.logger.error("Events Folder not found ", {
        service: "EventHandler",
      });
      return;
    }

    const folderStack: string[] = [Folderpath];
    let folder: string | undefined;
    while ((folder = folderStack.pop())) {
      try {
        for (const file of await fs.promises.readdir(folder)) {
          const filePath = path.join(folder, file);

          if (file.endsWith(".js") || file.endsWith(".ts")) {
            const module = (await import(filePath)).default;

            if (!module) {
              this.logger.error(
                `Error loading file: \x1b[30m${file}\x1b[0m error : module not found`,
                {
                  service: "EventHandler",
                }
              );
              continue;
            }

            if (!(module.prototype instanceof baseDiscordEvent)) {
              this.logger.error(
                `Event ${
                  module?.name ?? "unknown"
                } does not extend baseDiscordEvent`,
                { service: "EventHandler" }
              );
              return;
            }

            const eventInstance = new module();

            if (eventInstance.once) {
              this.client.once(eventInstance.name, (...args) =>
                eventInstance.executeEvent(...args)
              );
            } else {
              this.client.on(eventInstance.name, (...args) =>
                eventInstance.executeEvent(...args)
              );
            }
            this.totalLoaded++;
          } else if (fs.lstatSync(filePath).isDirectory()) {
            folderStack.push(filePath);
          }
        }
      } catch (error) {
        this.logger.error(
          `Error loading file: \x1b[30m${folder}\x1b[0m error : ${error}`,
          {
            service: "EventHandler",
          }
        );
      }
    }

    this.client.setisEventsLoaded(true);
    this.logger.info(
      `Total \x1b[32mevents\x1b[0m loaded: \x1b[32m${this.totalLoaded}\x1b[0m`,
      {
        service: "EventHandler",
      }
    );
  }
}
