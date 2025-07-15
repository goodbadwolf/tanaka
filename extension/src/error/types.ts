/**
 * Extension error types using generated types from server
 */

import {
  AUTH_TOKEN_INVALID,
  AUTH_TOKEN_MISSING,
  type ApiErrorResponse,
  type ApiSuccessResponse,
  type AsyncResult,
  BROWSER_API_UNAVAILABLE,
  CONNECTION_TIMEOUT,
  DATABASE_ERROR,
  DATA_CORRUPTION,
  DNS_RESOLUTION_FAILED,
  type DetailedError,
  ERROR_CODE_MESSAGES,
  EXTENSION_PERMISSION_DENIED,
  type EnhancedError,
  type ErrorCode,
  type ErrorSeverity,
  INVALID_CONFIGURATION,
  INVALID_DATA,
  INVALID_SERVER_URL,
  MISSING_CONFIGURATION,
  NETWORK_FAILURE,
  PERMISSION_DENIED,
  type RetryConfig,
  SERVER_ERROR,
  SERVER_OVERLOADED,
  SERVER_UNAVAILABLE,
  STORAGE_QUOTA_EXCEEDED,
  SYNC_CONFLICT,
  TAB_ACCESS_DENIED,
  WINDOW_ACCESS_DENIED,
} from '../api/errors';

/**
 * Extension-specific error context interfaces
 */
export interface NetworkErrorContext {
  url?: string;
  method?: string;
  statusCode?: number;
  responseTime?: number;
  userAgent?: string;
}

export interface AuthErrorContext {
  tokenLength?: number;
  serverUrl?: string;
  responseStatus?: number;
  responseText?: string;
}

export interface SyncErrorContext {
  tabCount?: number;
  windowId?: string;
  lastSyncTime?: string;
  syncDuration?: number;
  retryCount?: number;
}

export interface BrowserApiErrorContext {
  apiName?: string;
  permissions?: string[];
  manifestVersion?: string;
  browserInfo?: {
    name?: string;
    version?: string;
  };
}

export interface ConfigErrorContext {
  configKey?: string;
  configValue?: unknown;
  validationErrors?: string[];
  settingsPage?: string;
}

/**
 * Extension error class with enhanced functionality
 */
export class ExtensionError extends Error implements EnhancedError {
  public readonly id: string;
  public readonly code: ErrorCode;
  public readonly timestamp: string;
  public readonly severity: ErrorSeverity;
  public readonly recoverable: boolean;
  public readonly reportable: boolean;
  public readonly context?: Record<string, unknown>;
  public readonly source?: string;
  public readonly userId?: string;
  public readonly requestId?: string;
  public readonly metadata?: Record<string, unknown>;
  public readonly recoveryActions?: string[];

  constructor(
    code: ErrorCode,
    message?: string,
    options: {
      severity?: ErrorSeverity;
      recoverable?: boolean;
      reportable?: boolean;
      context?: Record<string, unknown>;
      source?: string;
      userId?: string;
      requestId?: string;
      metadata?: Record<string, unknown>;
      recoveryActions?: string[];
      cause?: Error;
    } = {},
  ) {
    const finalMessage = message ?? ERROR_CODE_MESSAGES[code] ?? `Error: ${code}`;
    super(finalMessage);
    // Set cause if provided
    if (options.cause && 'cause' in this) {
      (this as { cause?: Error }).cause = options.cause;
    }

    this.name = 'ExtensionError';
    this.id = crypto.randomUUID();
    this.code = code;
    this.message = finalMessage;
    this.timestamp = new Date().toISOString();
    this.severity = options.severity ?? this.getDefaultSeverity(code);
    this.recoverable = options.recoverable ?? this.getDefaultRecoverable(code);
    this.reportable = options.reportable ?? this.getDefaultReportable(code);
    this.context = options.context;
    this.source = options.source;
    this.userId = options.userId;
    this.requestId = options.requestId;
    this.metadata = options.metadata;
    this.recoveryActions = options.recoveryActions ?? this.getDefaultRecoveryActions(code);

    // Ensure the stack trace points to the caller (Node.js only)
    const errorConstructor = Error as typeof Error & {
      captureStackTrace?: (targetObject: object, constructorOpt?: unknown) => void;
    };
    if (typeof errorConstructor.captureStackTrace === 'function') {
      errorConstructor.captureStackTrace(this, ExtensionError);
    }
  }

  private getDefaultSeverity(code: ErrorCode): ErrorSeverity {
    switch (code) {
      case DATA_CORRUPTION:
      case DATABASE_ERROR:
      case EXTENSION_PERMISSION_DENIED:
        return 'critical';

      case NETWORK_FAILURE:
      case CONNECTION_TIMEOUT:
      case SERVER_UNAVAILABLE:
      case AUTH_TOKEN_INVALID:
      case SYNC_CONFLICT:
        return 'high';

      case INVALID_DATA:
      case MISSING_CONFIGURATION:
      case INVALID_CONFIGURATION:
      case TAB_ACCESS_DENIED:
      case WINDOW_ACCESS_DENIED:
        return 'medium';

      default:
        return 'low';
    }
  }

  private getDefaultRecoverable(code: ErrorCode): boolean {
    switch (code) {
      case NETWORK_FAILURE:
      case CONNECTION_TIMEOUT:
      case DNS_RESOLUTION_FAILED:
      case SERVER_UNAVAILABLE:
      case SERVER_OVERLOADED:
      case DATABASE_ERROR:
        return true;

      case AUTH_TOKEN_MISSING:
      case AUTH_TOKEN_INVALID:
      case PERMISSION_DENIED:
      case INVALID_DATA:
      case INVALID_SERVER_URL:
      case MISSING_CONFIGURATION:
      case INVALID_CONFIGURATION:
      case EXTENSION_PERMISSION_DENIED:
        return false;

      default:
        return false;
    }
  }

  private getDefaultReportable(code: ErrorCode): boolean {
    switch (code) {
      case AUTH_TOKEN_MISSING:
      case INVALID_SERVER_URL:
      case MISSING_CONFIGURATION:
      case INVALID_CONFIGURATION:
        return false; // User configuration issues

      default:
        return true; // Most errors should be reported for debugging
    }
  }

  private getDefaultRecoveryActions(code: ErrorCode): string[] {
    switch (code) {
      case NETWORK_FAILURE:
      case CONNECTION_TIMEOUT:
        return ['Check your internet connection', 'Try again in a few moments'];

      case AUTH_TOKEN_MISSING:
      case AUTH_TOKEN_INVALID:
        return ['Check your authentication token in settings', 'Re-enter your token'];

      case INVALID_SERVER_URL:
        return ['Check the server URL in settings', 'Verify the URL format'];

      case MISSING_CONFIGURATION:
        return ['Complete the extension setup', 'Check the settings page'];

      case EXTENSION_PERMISSION_DENIED:
        return ['Grant required permissions in browser settings', 'Reload the extension'];

      case SERVER_UNAVAILABLE:
      case SERVER_OVERLOADED:
        return ['Try again later', 'Check server status'];

      default:
        return ['Try again', 'Check the settings'];
    }
  }

  /**
   * Check if this error is retryable
   */
  public isRetryable(): boolean {
    const retryableCodes: ErrorCode[] = [
      NETWORK_FAILURE,
      CONNECTION_TIMEOUT,
      DNS_RESOLUTION_FAILED,
      SERVER_UNAVAILABLE,
      SERVER_OVERLOADED,
      DATABASE_ERROR,
    ];
    return retryableCodes.includes(this.code);
  }

  /**
   * Get suggested retry delay in milliseconds
   */
  public getRetryDelay(attemptNumber = 1): number {
    const baseDelay = this.getBaseRetryDelay();
    // Exponential backoff with jitter
    const exponentialDelay = baseDelay * Math.pow(2, attemptNumber - 1);
    const jitter = Math.random() * 0.1 * exponentialDelay; // 10% jitter
    return Math.min(exponentialDelay + jitter, 30000); // Max 30 seconds
  }

  private getBaseRetryDelay(): number {
    switch (this.code) {
      case SERVER_OVERLOADED:
        return 5000; // 5 seconds for overloaded server
      case DATABASE_ERROR:
        return 1000; // 1 second for database issues
      case NETWORK_FAILURE:
      case CONNECTION_TIMEOUT:
        return 2000; // 2 seconds for network issues
      default:
        return 1000; // 1 second default
    }
  }

  /**
   * Convert to a plain object for serialization
   */
  public toJSON(): DetailedError {
    return {
      id: this.id,
      code: this.code,
      message: this.message,
      timestamp: this.timestamp,
      stack: this.stack,
      source: this.source,
      userId: this.userId,
      requestId: this.requestId,
      context: this.context,
      metadata: this.metadata,
    };
  }

  /**
   * Convert to enhanced error interface
   */
  public toEnhanced(): EnhancedError {
    return {
      ...this.toJSON(),
      severity: this.severity,
      recoverable: this.recoverable,
      recoveryActions: this.recoveryActions,
      reportable: this.reportable,
    };
  }
}

/**
 * Error factory functions for common error scenarios
 */
export { AsyncResult };

export const ErrorFactories = {
  networkFailure: (url?: string, statusCode?: number): ExtensionError =>
    new ExtensionError(NETWORK_FAILURE, undefined, {
      context: { url, statusCode },
      source: 'api',
      recoverable: true,
    }),

  authTokenMissing: (): ExtensionError =>
    new ExtensionError(AUTH_TOKEN_MISSING, undefined, {
      source: 'auth',
      severity: 'high',
      recoverable: false,
    }),

  authTokenInvalid: (serverResponse?: string): ExtensionError =>
    new ExtensionError(AUTH_TOKEN_INVALID, undefined, {
      context: { serverResponse },
      source: 'auth',
      severity: 'high',
      recoverable: false,
    }),

  invalidServerUrl: (url: string): ExtensionError =>
    new ExtensionError(INVALID_SERVER_URL, `Invalid server URL: ${url}`, {
      context: { url },
      source: 'config',
      severity: 'medium',
      recoverable: false,
    }),

  syncConflict: (windowId?: string, tabCount?: number): ExtensionError =>
    new ExtensionError(SYNC_CONFLICT, undefined, {
      context: { windowId, tabCount },
      source: 'sync',
      severity: 'medium',
      recoverable: false,
    }),

  browserApiUnavailable: (apiName: string): ExtensionError =>
    new ExtensionError(BROWSER_API_UNAVAILABLE, `Browser API not available: ${apiName}`, {
      context: { apiName },
      source: 'browser',
      severity: 'critical',
      recoverable: false,
    }),

  extensionPermissionDenied: (permissions: string[]): ExtensionError =>
    new ExtensionError(EXTENSION_PERMISSION_DENIED, undefined, {
      context: { permissions },
      source: 'permissions',
      severity: 'critical',
      recoverable: false,
    }),

  storageQuotaExceeded: (usage?: number, quota?: number): ExtensionError =>
    new ExtensionError(STORAGE_QUOTA_EXCEEDED, undefined, {
      context: { usage, quota },
      source: 'storage',
      severity: 'high',
      recoverable: false,
    }),
};

/**
 * Default retry configuration for the extension
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelay: 1000,
  backoffMultiplier: 2,
  maxDelay: 30000,
  jitter: true,
};

/**
 * Utility function to create a Result from an operation
 */
export function createResult<T>(operation: () => T | Promise<T>): AsyncResult<T, ExtensionError> {
  return Promise.resolve()
    .then(() => operation())
    .then((data) => ({ success: true as const, data }))
    .catch((error) => {
      const extensionError =
        error instanceof ExtensionError
          ? error
          : new ExtensionError(SERVER_ERROR, error.message, {
              cause: error,
              source: 'unknown',
            });
      return { success: false as const, error: extensionError };
    });
}

/**
 * Type guard to check if an error is an ExtensionError
 */
export function isExtensionError(error: unknown): error is ExtensionError {
  return error instanceof ExtensionError;
}

/**
 * Type guard to check if a response is an error response
 */
export function isApiErrorResponse(response: unknown): response is ApiErrorResponse {
  return (
    typeof response === 'object' &&
    response !== null &&
    'status' in response &&
    (response as Record<string, unknown>).status === 'error' &&
    'error' in response
  );
}

/**
 * Type guard to check if a response is a success response
 */
export function isApiSuccessResponse<T = unknown>(
  response: unknown,
): response is ApiSuccessResponse<T> {
  return (
    typeof response === 'object' &&
    response !== null &&
    'status' in response &&
    (response as Record<string, unknown>).status === 'success' &&
    'data' in response
  );
}
