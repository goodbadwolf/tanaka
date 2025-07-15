/**
 * Error handling types and utilities for the Tanaka extension.
 *
 * This module re-exports generated types from the server and provides
 * additional TypeScript-specific utilities and constants.
 */

// Re-export generated types from server
export type { ErrorCode } from './ErrorCode';
export type { ErrorDetail } from './ErrorDetail';
export type { ErrorResponse } from './ErrorResponse';
export type { RetryInfo } from './RetryInfo';

// Error code constants for easy importing
export const NETWORK_FAILURE = 'NETWORK_FAILURE' as const;
export const CONNECTION_TIMEOUT = 'CONNECTION_TIMEOUT' as const;
export const DNS_RESOLUTION_FAILED = 'DNS_RESOLUTION_FAILED' as const;
export const TLS_CERTIFICATE_ERROR = 'TLS_CERTIFICATE_ERROR' as const;
export const AUTH_TOKEN_MISSING = 'AUTH_TOKEN_MISSING' as const;
export const AUTH_TOKEN_INVALID = 'AUTH_TOKEN_INVALID' as const;
export const AUTH_TOKEN_EXPIRED = 'AUTH_TOKEN_EXPIRED' as const;
export const PERMISSION_DENIED = 'PERMISSION_DENIED' as const;
export const SERVER_UNAVAILABLE = 'SERVER_UNAVAILABLE' as const;
export const SERVER_ERROR = 'SERVER_ERROR' as const;
export const SERVER_OVERLOADED = 'SERVER_OVERLOADED' as const;
export const MAINTENANCE_MODE = 'MAINTENANCE_MODE' as const;
export const INVALID_DATA = 'INVALID_DATA' as const;
export const SYNC_CONFLICT = 'SYNC_CONFLICT' as const;
export const DATA_CORRUPTION = 'DATA_CORRUPTION' as const;
export const STORAGE_QUOTA_EXCEEDED = 'STORAGE_QUOTA_EXCEEDED' as const;
export const DATABASE_ERROR = 'DATABASE_ERROR' as const;
export const INVALID_SERVER_URL = 'INVALID_SERVER_URL' as const;
export const MISSING_CONFIGURATION = 'MISSING_CONFIGURATION' as const;
export const INVALID_CONFIGURATION = 'INVALID_CONFIGURATION' as const;
export const EXTENSION_PERMISSION_DENIED = 'EXTENSION_PERMISSION_DENIED' as const;
export const BROWSER_API_UNAVAILABLE = 'BROWSER_API_UNAVAILABLE' as const;
export const TAB_ACCESS_DENIED = 'TAB_ACCESS_DENIED' as const;
export const WINDOW_ACCESS_DENIED = 'WINDOW_ACCESS_DENIED' as const;

// Import the ErrorCode type for utility functions
import type { ErrorCode } from './ErrorCode';

/**
 * All error codes as an array for iteration
 */
export const ALL_ERROR_CODES: ErrorCode[] = [
  NETWORK_FAILURE,
  CONNECTION_TIMEOUT,
  DNS_RESOLUTION_FAILED,
  TLS_CERTIFICATE_ERROR,
  AUTH_TOKEN_MISSING,
  AUTH_TOKEN_INVALID,
  AUTH_TOKEN_EXPIRED,
  PERMISSION_DENIED,
  SERVER_UNAVAILABLE,
  SERVER_ERROR,
  SERVER_OVERLOADED,
  MAINTENANCE_MODE,
  INVALID_DATA,
  SYNC_CONFLICT,
  DATA_CORRUPTION,
  STORAGE_QUOTA_EXCEEDED,
  DATABASE_ERROR,
  INVALID_SERVER_URL,
  MISSING_CONFIGURATION,
  INVALID_CONFIGURATION,
  EXTENSION_PERMISSION_DENIED,
  BROWSER_API_UNAVAILABLE,
  TAB_ACCESS_DENIED,
  WINDOW_ACCESS_DENIED,
];

/**
 * User-friendly error messages for each error code
 */
export const ERROR_CODE_MESSAGES: Record<ErrorCode, string> = {
  [NETWORK_FAILURE]: 'Unable to connect to the server. Please check your network connection.',
  [CONNECTION_TIMEOUT]: 'The connection to the server timed out. Please try again.',
  [DNS_RESOLUTION_FAILED]: 'Cannot resolve server address. Please check the server URL.',
  [TLS_CERTIFICATE_ERROR]: 'SSL certificate error. The server certificate may be invalid.',
  [AUTH_TOKEN_MISSING]: 'Authentication token is missing. Please configure your token.',
  [AUTH_TOKEN_INVALID]: 'Authentication token is invalid. Please check your token.',
  [AUTH_TOKEN_EXPIRED]: 'Authentication token has expired. Please refresh your token.',
  [PERMISSION_DENIED]: 'Permission denied. You do not have access to this resource.',
  [SERVER_UNAVAILABLE]: 'Server is currently unavailable. Please try again later.',
  [SERVER_ERROR]: 'An internal server error occurred. Please try again later.',
  [SERVER_OVERLOADED]: 'Server is overloaded. Please try again in a few moments.',
  [MAINTENANCE_MODE]: 'Server is under maintenance. Please try again later.',
  [INVALID_DATA]: 'The data format is invalid. Please check your input.',
  [SYNC_CONFLICT]: 'A sync conflict occurred. Your changes may have been overridden.',
  [DATA_CORRUPTION]: 'Data corruption detected. Some data may be lost.',
  [STORAGE_QUOTA_EXCEEDED]: 'Storage quota exceeded. Please free up some space.',
  [DATABASE_ERROR]: 'Database error occurred. Please try again later.',
  [INVALID_SERVER_URL]: 'Server URL is invalid. Please check the URL format.',
  [MISSING_CONFIGURATION]: 'Required configuration is missing. Please complete setup.',
  [INVALID_CONFIGURATION]: 'Configuration is invalid. Please check your settings.',
  [EXTENSION_PERMISSION_DENIED]:
    'Extension permissions required. Please grant access in browser settings.',
  [BROWSER_API_UNAVAILABLE]: 'Required browser API is not available in this environment.',
  [TAB_ACCESS_DENIED]: 'Cannot access tab data. Please check extension permissions.',
  [WINDOW_ACCESS_DENIED]: 'Cannot access window data. Please check extension permissions.',
};

/**
 * HTTP status codes for each error code
 */
export const ERROR_CODE_TO_HTTP_STATUS: Record<ErrorCode, number> = {
  [NETWORK_FAILURE]: 503,
  [CONNECTION_TIMEOUT]: 504,
  [DNS_RESOLUTION_FAILED]: 503,
  [TLS_CERTIFICATE_ERROR]: 503,
  [AUTH_TOKEN_MISSING]: 401,
  [AUTH_TOKEN_INVALID]: 401,
  [AUTH_TOKEN_EXPIRED]: 401,
  [PERMISSION_DENIED]: 403,
  [SERVER_UNAVAILABLE]: 503,
  [SERVER_ERROR]: 500,
  [SERVER_OVERLOADED]: 503,
  [MAINTENANCE_MODE]: 503,
  [INVALID_DATA]: 400,
  [SYNC_CONFLICT]: 409,
  [DATA_CORRUPTION]: 422,
  [STORAGE_QUOTA_EXCEEDED]: 507,
  [DATABASE_ERROR]: 500,
  [INVALID_SERVER_URL]: 400,
  [MISSING_CONFIGURATION]: 400,
  [INVALID_CONFIGURATION]: 400,
  [EXTENSION_PERMISSION_DENIED]: 403,
  [BROWSER_API_UNAVAILABLE]: 501,
  [TAB_ACCESS_DENIED]: 403,
  [WINDOW_ACCESS_DENIED]: 403,
};

/**
 * Check if a string is a valid error code
 */
export function isValidErrorCode(code: string): code is ErrorCode {
  return ALL_ERROR_CODES.includes(code as ErrorCode);
}

/**
 * Error severity levels
 */
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Base error interface
 */
export interface BaseError {
  message: string;
}

/**
 * Detailed error with additional context
 */
export interface DetailedError extends BaseError {
  id: string;
  code: ErrorCode;
  timestamp: string;
  stack?: string;
  source?: string;
  userId?: string;
  requestId?: string;
  context?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

/**
 * Enhanced error with recovery information
 */
export interface EnhancedError extends DetailedError {
  severity: ErrorSeverity;
  recoverable: boolean;
  recoveryActions?: string[];
  reportable: boolean;
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxAttempts: number;
  initialDelay: number;
  backoffMultiplier: number;
  maxDelay: number;
  jitter: boolean;
}

/**
 * Result type for operations that can succeed or fail
 */
export type Result<T, E = Error> = { success: true; data: T } | { success: false; error: E };

/**
 * Async result type
 */
export type AsyncResult<T, E = Error> = Promise<Result<T, E>>;

/**
 * API response types
 */
export interface ApiSuccessResponse<T = unknown> {
  status: 'success';
  data: T;
}

export interface ApiErrorResponse {
  status: 'error';
  error: DetailedError;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Type guards for Result types
 */
export function isSuccess<T, E>(result: Result<T, E>): result is { success: true; data: T } {
  return result.success;
}

export function isError<T, E>(result: Result<T, E>): result is { success: false; error: E } {
  return !result.success;
}
