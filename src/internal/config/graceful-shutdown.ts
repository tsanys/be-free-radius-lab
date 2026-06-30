interface CleanUpFunction {
  name: string;
  fn: () => Promise<void>;
}

export class GracefulShutdown {
  private cleanUpFunctions: CleanUpFunction[] = [];

  constructor() {}

  public add(cleanUpFn: CleanUpFunction): void {
    this.cleanUpFunctions.push(cleanUpFn);
  }

  public register(cleanUpFns: CleanUpFunction[]): void {
    this.cleanUpFunctions = this.cleanUpFunctions.concat(cleanUpFns);
  }

  public async shutdown(): Promise<void> {
    console.log("\nGraceful shutdown initiated...");

    try {
      await Promise.allSettled(
        this.cleanUpFunctions.map((cleanUp) => {
          console.log(`Shutting down ${cleanUp.name}...`);
          return cleanUp.fn();
        }),
      );
    } catch (error) {
      console.error("Error during shutdown:", error);
    }

    console.log("Shutdown complete. Exiting process...");
    process.exit(0);
  }

  public listen(): void {
    process.on("SIGINT", () => this.shutdown());
    process.on("SIGTERM", () => this.shutdown());
  }
}
