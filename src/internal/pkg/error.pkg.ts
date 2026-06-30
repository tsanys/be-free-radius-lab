export function formatErrorMessage(message: string): string {
  if (message === "") return "Something went wrong";
  return message.charAt(0).toUpperCase() + message.slice(1);
}

export function unkownErrorToString(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return JSON.stringify(error);
}
