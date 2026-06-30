import { WinstonLogger } from "@/internal/config/winston";
import { FileManager } from "@/internal/config/files";
import { DeleteLogFilesRequest } from "@/internal/model/log.model";

export class LogUseCase {
  private logger: WinstonLogger;
  private fileManager: FileManager;

  constructor(logger: WinstonLogger, fileManager: FileManager) {
    this.logger = logger;
    this.fileManager = fileManager;
  }

  async deleteLogFiles(request: DeleteLogFilesRequest): Promise<number> {
    const files = await this.fileManager.getFiles(request.logDirectory, ".log");
    const rotatedLogPattern = /__\d{4}-\d{2}-\d{2}/;
    const filesToDelete = files
      .filter((file) => rotatedLogPattern.test(file.path) && file.mtime < request.cutoffDate)
      .map((file) => file.path);

    if (filesToDelete.length === 0) {
      this.logger.info("no log files to delete");
      return 0;
    }

    const deletedCount = await this.fileManager.deleteFiles(filesToDelete);

    this.logger.info(`deleted ${deletedCount} log files`);

    return deletedCount;
  }
}
