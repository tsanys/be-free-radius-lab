import { WinstonLogger } from "@/internal/config/winston";
import { CustomError } from "@/internal/pkg/custom-error.pkg";
import { formatErrorMessage, unkownErrorToString } from "@/internal/pkg/error.pkg";
import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

interface ErrorResponse {
  type: string;
  message: string;
}

interface WebErrorResponse {
  statusCode: number;
  errors: ErrorResponse[];
}

export class ErrorHandlerMiddleware {
  private logger: WinstonLogger;

  constructor(logger: WinstonLogger) {
    this.logger = logger;

    this.register = this.register.bind(this);
  }

  private populateZodErrors(errorResponse: WebErrorResponse, error: ZodError) {
    errorResponse.statusCode = 401;

    for (const err of error.errors) {
      errorResponse.errors.push({
        type: "ValidationError",
        message: formatErrorMessage(`Field ${err.path[0]} is ${err.message}`),
      });
    }
  }

  private populateUnhandledError(errorResponse: WebErrorResponse, error: unknown) {
    errorResponse.errors.push({
      type: "Error",
      message: formatErrorMessage(unkownErrorToString(error)),
    });
  }

  private populateCustomError(errorResponse: WebErrorResponse, error: CustomError) {
    errorResponse.errors.push({
      type: error.name,
      message: formatErrorMessage(error.message),
    });
  }

  private getNestedProperty(obj: any, path: string[]) {
    return path.reduce((acc, key) => acc && acc[key], obj);
  }

  public register(error: unknown, req: Request, res: Response, next: NextFunction) {
    const errorResponse: WebErrorResponse = {
      statusCode: 400,
      errors: [],
    };

    if (error instanceof ZodError) {
      this.populateZodErrors(errorResponse, error);
    } else if (error instanceof CustomError) {
      this.populateCustomError(errorResponse, error);
    } else {
      this.populateUnhandledError(errorResponse, error);
    }

    this.logger.error(JSON.stringify(errorResponse));
    res.statusCode = errorResponse.statusCode;
    res.json({ errors: errorResponse.errors });
    next();
  }
}
