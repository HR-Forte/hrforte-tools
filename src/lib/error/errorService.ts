import { BaseError, ErrorCategory, ErrorOptions, ErrorSeverity } from './types';
import { AppError } from './appError';
import { generateRequestId, getRequestId } from '../utils';

class ErrorService {
  private static instance: ErrorService;
  private errorLog: BaseError[] = [];
  private readonly maxLogSize = 1000;

  private constructor() {}

  public static getInstance(): ErrorService {
    if (!ErrorService.instance) {
      ErrorService.instance = new ErrorService();
    }
    return ErrorService.instance;
  }

  // Create a new error with proper tracking
  public createError(errorOptions: ErrorOptions): AppError {
    const { type, message, options = {} } = errorOptions;

    const requestId = options?.requestId || getRequestId(options?.request);

    const error = new AppError(type, message, {
      ...options,
      requestId,
    });

    this.logError(error);
    return error;
  }

  // Log error internally
  private logError(error: AppError): void {
    this.errorLog.push(error);

    // Maintain log size
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(-this.maxLogSize);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      const logPayload = {
        type: error.type,
        code: error.code,
        httpStatus: error.getHttpStatus(),
        message: error.message,
        category: error.category,
        severity: error.severity,
        timestamp: error.timestamp,
        requestId: error.requestId,
        userId: error.userId,
        ...(error.details || {}),
      };
      // Use JSON.stringify for details so nested objects (e.g. body.errors) are fully visible
      console.error('🔴 [ERROR]:', JSON.stringify(logPayload, null, 2));
    }

    // TODO: Send to external logging service (e.g., Sentry, LogRocket)
    this.sendToExternalLogger(error);
  }

  // Send error to external logging service
  private sendToExternalLogger(error: AppError): void {
    // Implementation for external logging services
    // Example: Sentry, LogRocket, DataDog, etc.
    if (process.env.NODE_ENV === 'production') {
      // Send to external service
      // this.sentryClient.captureException(error);
    }
  }

  // Get error statistics
  public getErrorStats(): {
    total: number;
    byCategory: Record<ErrorCategory, number>;
    bySeverity: Record<ErrorSeverity, number>;
    recentErrors: BaseError[];
  } {
    const byCategory = Object.values(ErrorCategory).reduce(
      (acc, category) => {
        acc[category] = this.errorLog.filter(error => error.category === category).length;
        return acc;
      },
      {} as Record<ErrorCategory, number>
    );

    const bySeverity = Object.values(ErrorSeverity).reduce(
      (acc, severity) => {
        acc[severity] = this.errorLog.filter(error => error.severity === severity).length;
        return acc;
      },
      {} as Record<ErrorSeverity, number>
    );

    return {
      total: this.errorLog.length,
      byCategory,
      bySeverity,
      recentErrors: this.errorLog.slice(-10), // Last 10 errors
    };
  }

  // Clear error log
  public clearErrorLog(): void {
    this.errorLog = [];
  }

  // Get errors by user
  public getErrorsByUser(userId: string): BaseError[] {
    return this.errorLog.filter(error => error.userId === userId);
  }

  // Get errors by request
  public getErrorsByRequest(requestId: string): BaseError[] {
    return this.errorLog.filter(error => error.requestId === requestId);
  }

  // Handle unknown errors
  public handleUnknownError(error: unknown, requestId?: string): AppError {
    if (error instanceof AppError) {
      return error;
    }

    const isError = error instanceof Error;
    const message = isError ? error.message : 'An unknown error occurred';
    const stack = isError ? error.stack : undefined;

    return this.createError({
      type: 'UNKNOWN_ERROR',
      message,
      options: {
        details: { originalError: error, stack },
        requestId,
      },
    });
  }
}

// Export singleton instance
const errorService = ErrorService.getInstance();

export default errorService;
