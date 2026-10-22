import { ErrorSeverity, ErrorCategory, BaseError } from './types';
import { ERROR } from './constants';

export class AppError extends Error implements BaseError {
  public readonly code: string;
  public readonly type: keyof typeof ERROR;
  public readonly category: ErrorCategory;
  public readonly severity: ErrorSeverity;
  public readonly details?: Record<string, unknown>;
  public readonly timestamp: Date;
  public readonly requestId?: string;
  public readonly userId?: string;
  public readonly stack?: string;

  constructor(
    type: keyof typeof ERROR,
    message?: string,
    options: {
      details?: Record<string, unknown>;
      requestId?: string;
      userId?: string;
      stack?: string;
    } = {}
  ) {
    super(message || ERROR[type].MESSAGE || 'An unexpected error occurred');
    this.type = type;
    this.name = 'AppError';
    this.code = ERROR[type].CODE;
    this.category = ERROR[type].CATEGORY;
    this.severity = ERROR[type].SEVERITY;
    this.details = options.details;
    this.timestamp = new Date();
    this.requestId = options.requestId;
    this.userId = options.userId;
    this.stack = options.stack || this.stack;
  }

  public toJSON(): BaseError {
    // Never leak internals (stack, raw errors, unknown-error messages) to clients in production
    if (process.env.NODE_ENV === 'production') {
      return {
        code: this.code,
        message: this.type === 'UNKNOWN_ERROR' ? ERROR.UNKNOWN_ERROR.MESSAGE : this.message,
        category: this.category,
        severity: this.severity,
        timestamp: this.timestamp,
        requestId: this.requestId,
      };
    }

    return {
      code: this.code,
      message: this.message,
      category: this.category,
      severity: this.severity,
      field: this.field,
      details: this.details,
      timestamp: this.timestamp,
      requestId: this.requestId,
      userId: this.userId,
      stack: this.stack,
    };
  }

  public getHttpStatus(): number {
    return ERROR[this.type].HTTP_STATUS || 500;
  }
}
