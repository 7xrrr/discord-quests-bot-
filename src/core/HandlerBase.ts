import { CustomClient } from "./Client";
import { LoggerService } from "../services/logging/Logger";
import fs from "fs";
import { join, sep } from "path";
import { CacheService } from "../services/cache/Cache";

export class HandlerBase {
  protected client = CustomClient.getInstance();
  protected logger = LoggerService.getInstance();
  protected cache = CacheService.getInstance();
  protected totalLoaded = 0;
  protected loaded: { [key: string]: number } = {};

  protected mainPath?: string;

  constructor() {}

  /**
   * Loads all JS/TS files from the specified directory and its subdirectories
   * @param path Directory to load files from
   * @returns Array of loaded module default exports
   */
  async loadFiles<T>(
    Folderpath: string | undefined = this.mainPath,
    LoggerService: string = "HandlerBase"
  ): Promise<T[]> {
    if (!Folderpath) {
      this.logger.error(LoggerService + " Path not provided", {
        service: LoggerService,
      });
      return [];
    }

    // * check if the path folder exists
    if (!fs.existsSync(Folderpath)) {
      this.logger.error(LoggerService + " Folder not found ", {
        service: LoggerService,
      });
      return [];
    }

    let mainFolderName = Folderpath.split(sep).pop();
    if (mainFolderName) {
      if (!this.loaded[mainFolderName]) {
        this.loaded[mainFolderName] = 0;
      }
    } else {
      this.logger.error("Error getting folder name", {
        service: LoggerService,
      });
      mainFolderName = "unknown";
    }

    // * loop through all the files
    let loadedFiles = [];
    for (const file of await fs.promises.readdir(Folderpath)) {
      try {
        // * check if the file is a javascript or typescript file
        if (file.endsWith(".js") || file.endsWith(".ts")) {
          // * get the file path and require the file
          const filePath = join(Folderpath, file);
          const module = (await import(filePath)).default;
          if (!module) {
            this.logger.error(
              `Error loading file: \x1b[30m${file}\x1b[0m error : module not found`,
              {
                service: LoggerService,
              }
            );
            continue;
          }
          loadedFiles.push(module);

          this.totalLoaded++;
          this.loaded[mainFolderName]++;
        } else if (fs.lstatSync(join(Folderpath, file)).isDirectory()) {
          // * if the file is a directory, load the files in the directory  recursively
          this.loadFiles(join(Folderpath, file));
        }
      } catch (error) {
        this.logger.error(
          `Error loading file: \x1b[30m${file}\x1b[0m error : ${error}`,
          {
            service: LoggerService,
          }
        );
      }
    }

    return loadedFiles;
  }
}
