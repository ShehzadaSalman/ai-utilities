/**
 * Custom error classes for better error handling
 */

export class CalComApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: any;

  constructor(
    message: string,
    statusCode: number,
    code: string,
    details?: any
  ) {
    super(message);
    this.name = "CalComApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export class ValidationError extends Error {
  public readonly field: string;
  public readonly code: string;

  constructor(
    message: string,
    field: string,
    code: string = "VALIDATION_ERROR"
  ) {
    super(message);
    this.name = "ValidationError";
    this.field = field;
    this.code = code;
  }
}

export class AuthenticationError extends Error {
  public readonly code: string;

  constructor(message: string, code: string = "AUTHENTICATION_ERROR") {
    super(message);
    this.name = "AuthenticationError";
    this.code = code;
  }
}

export class NotFoundError extends Error {
  public readonly resource: string;
  public readonly code: string;

  constructor(message: string, resource: string, code: string = "NOT_FOUND") {
    super(message);
    this.name = "NotFoundError";
    this.resource = resource;
    this.code = code;
  }
}

export class ConflictError extends Error {
  public readonly resource: string;
  public readonly code: string;

  constructor(message: string, resource: string, code: string = "CONFLICT") {
    super(message);
    this.name = "ConflictError";
    this.resource = resource;
    this.code = code;
  }
}

export class RateLimitError extends Error {
  public readonly retryAfter?: number;
  public readonly code: string;

  constructor(
    message: string,
    retryAfter?: number,
    code: string = "RATE_LIMIT_EXCEEDED"
  ) {
    super(message);
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
    this.code = code;
  }
}
