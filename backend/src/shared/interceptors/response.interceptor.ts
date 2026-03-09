import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Response } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T = unknown> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  timestamp: string;
}

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<unknown>> {
    const response = context.switchToHttp().getResponse<Response>();
    const statusCode = response.statusCode;

    return next.handle().pipe(
      map((data: unknown): ApiResponse<unknown> => {
        const successMessage = this.getSuccessMessage(statusCode);

        return {
          success: true,
          statusCode,
          message: successMessage,
          data,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }

  private getSuccessMessage(statusCode: number): string {
    const messages: Record<number, string> = {
      200: 'Operation successful',
      201: 'Resource created successfully',
      204: 'Resource deleted successfully',
      400: 'Bad request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Resource not found',
      500: 'Internal server error',
    };

    return messages[statusCode] || 'Operation completed';
  }
}
