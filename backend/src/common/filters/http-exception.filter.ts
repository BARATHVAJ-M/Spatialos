import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';
import { Prisma } from '@prisma/client';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error occurred';
    let errorCode = 'SYS_001';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null && 'message' in exceptionResponse) {
        const msg = (exceptionResponse as any).message;
        message = Array.isArray(msg) ? msg.join(', ') : String(msg);
      } else {
        message = exception.message;
      }
      errorCode = `HTTP_${status}`;
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError || exception instanceof Prisma.PrismaClientValidationError) {
      this.logger.error(`[DATABASE ERROR] ${exception.message}`);
      status = HttpStatus.BAD_REQUEST;
      message = 'Database operation failed due to invalid constraints or relations.';
      errorCode = 'DB_ERROR';
    } else if (exception instanceof Error) {
      this.logger.error(`[AUDIT EXCEPTION LOG] Unhandled internal error: ${exception.message}`, exception.stack);
      // Strict rule: Never leak raw internal SQL, Prisma, or filesystem diagnostics to client responses
      message = process.env.NODE_ENV === 'production' 
        ? 'Unable to process request due to internal server error' 
        : exception.message;
        
      if (message.includes('Prisma') || message.includes('SELECT') || message.includes('C:\\') || message.includes(process.cwd())) {
        message = 'Unable to process request due to database or storage operation error';
      }
      errorCode = 'INTERNAL_ERROR';
    }

    // Double check: Ensure no accidental path or DB leaking occurs even on standard messages
    if (message.includes('C:\\') || (process.cwd().length > 3 && message.includes(process.cwd()))) {
      message = 'Invalid operation or storage resource reference';
    }

    response.status(status).json({
      success: false,
      message,
      errorCode,
      timestamp: new Date().toISOString(),
    });
  }
}
