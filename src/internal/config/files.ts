import { WinstonLogger } from "@/internal/config/winston";
import * as fs from "fs/promises";
import * as path from "path";

export class FileManager {
  private logger: WinstonLogger;

  constructor(logger: WinstonLogger) {
    this.logger = logger;
  }

  async deleteFiles(filePaths: string[]): Promise<number> {
    try {
      let deletedCount = 0;

      for (const filePath of filePaths) {
        await fs.unlink(filePath);
        deletedCount++;
        this.logger.info(`deleted file: ${path.basename(filePath)}`);
      }

      return deletedCount;
    } catch (error) {
      this.logger.error(`error deleting files: ${error}`);
      throw error;
    }
  }

  async getFiles(directory: string, extension: string): Promise<Array<{ path: string; mtime: Date }>> {
    try {
      const files = await fs.readdir(directory);
      const fileStats: Array<{ path: string; mtime: Date }> = [];

      for (const file of files) {
        if (!file.endsWith(extension)) {
          continue;
        }

        const filePath = path.join(directory, file);
        const stats = await fs.stat(filePath);
        fileStats.push({ path: filePath, mtime: stats.mtime });
      }

      return fileStats;
    } catch (error) {
      this.logger.error(`error reading files: ${error}`);
      throw error;
    }
  }
}
