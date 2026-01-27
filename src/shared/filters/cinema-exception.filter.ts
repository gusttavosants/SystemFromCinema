import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

export interface CinemaError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export class CinemaException extends HttpException {
  constructor(
    public readonly code: string,
    message: string,
    status: HttpStatus,
    public readonly details?: Record<string, any>,
  ) {
    super({ code, message, details }, status);
  }
}

@Catch(CinemaException)
export class CinemaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(CinemaExceptionFilter.name);

  catch(exception: CinemaException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    const status = exception.getStatus();
    const errorResponse = exception.getResponse() as CinemaError;

    this.logger.error(
      `Cinema Exception: ${errorResponse.code} - ${errorResponse.message}`,
      {
        code: errorResponse.code,
        message: errorResponse.message,
        status,
        details: errorResponse.details,
        path: request.url,
        method: request.method,
        userAgent: request.get('User-Agent'),
        ip: request.ip,
        timestamp: new Date().toISOString(),
      },
    );

    response.status(status).json({
      success: false,
      error: {
        code: errorResponse.code,
        message: errorResponse.message,
        details: errorResponse.details,
        timestamp: new Date().toISOString(),
        path: request.url,
      },
    });
  }
}
