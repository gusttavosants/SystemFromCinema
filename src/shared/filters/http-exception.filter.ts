import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

interface ErrorResponse {
  success: boolean;
  statusCode: number;
  message: string;
  error?: string;
  timestamp: string;
}

interface ErrorObject {
  message?: string;
  error?: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorDetails: string | undefined;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const error = exceptionResponse as ErrorObject;
        message = error.message || exception.message;
        errorDetails = error.error;
      } else {
        message = exception.message;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      errorDetails = exception.stack;
      this.logger.error(errorDetails);
    }

    const errorResponse: ErrorResponse = {
      success: false,
      statusCode,
      message,
      ...(errorDetails && { error: errorDetails }),
      timestamp: new Date().toISOString(),
    };

    this.logger.error(
      `Error on ${request.method} ${request.url}: ${message}`,
      errorDetails,
    );

    response.status(statusCode).json(errorResponse);
  }
}
