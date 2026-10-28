import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';

// every error goes out as { statusCode, error, message } with no stack traces (REQ-COM-4, REQ-SEC-12)
@Catch()
export class ErrorFilter implements ExceptionFilter {
  private logger = new Logger('Error');

  catch(err: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse();
    if (err instanceof HttpException) {
      const body = err.getResponse() as string | { message?: string | string[]; error?: string };
      const message = typeof body === 'string' ? body : body.message;
      const status = err.getStatus();
      return res.status(status).json({
        statusCode: status,
        error: (typeof body !== 'string' && body.error) || HttpStatus[status] || 'Error',
        message: Array.isArray(message) ? message[0] : message,
      });
    }
    this.logger.error(err);
    res.status(500).json({ statusCode: 500, error: 'Server Error', message: 'Something went wrong. Please try again.' });
  }
}
