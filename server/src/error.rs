use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use thiserror::Error;
use ts_rs::TS;
use uuid::Uuid;

#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize, TS)]
#[cfg_attr(
    feature = "generate-api-models",
    ts(export, export_to = "../../extension/src/api/errors/")
)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ErrorCode {
    // Network & Connectivity Errors
    NetworkFailure,
    ConnectionTimeout,
    DnsResolutionFailed,
    TlsCertificateError,

    // Authentication & Authorization Errors
    AuthTokenMissing,
    AuthTokenInvalid,
    AuthTokenExpired,
    PermissionDenied,

    // Server Errors
    ServerUnavailable,
    ServerError,
    ServerOverloaded,
    MaintenanceMode,

    // Data & Sync Errors
    InvalidData,
    SyncConflict,
    DataCorruption,
    StorageQuotaExceeded,
    DatabaseError,

    // Configuration Errors
    InvalidServerUrl,
    MissingConfiguration,
    InvalidConfiguration,

    // Browser API Errors
    ExtensionPermissionDenied,
    BrowserApiUnavailable,
    TabAccessDenied,
    WindowAccessDenied,
}

impl ErrorCode {
    #[must_use]
    pub fn http_status(&self) -> StatusCode {
        match self {
            // Service unavailable errors
            ErrorCode::NetworkFailure
            | ErrorCode::DnsResolutionFailed
            | ErrorCode::TlsCertificateError
            | ErrorCode::ServerUnavailable
            | ErrorCode::ServerOverloaded
            | ErrorCode::MaintenanceMode => StatusCode::SERVICE_UNAVAILABLE,

            // Gateway timeout
            ErrorCode::ConnectionTimeout => StatusCode::GATEWAY_TIMEOUT,

            // Authentication errors
            ErrorCode::AuthTokenMissing
            | ErrorCode::AuthTokenInvalid
            | ErrorCode::AuthTokenExpired => StatusCode::UNAUTHORIZED,

            // Forbidden errors
            ErrorCode::PermissionDenied
            | ErrorCode::ExtensionPermissionDenied
            | ErrorCode::TabAccessDenied
            | ErrorCode::WindowAccessDenied => StatusCode::FORBIDDEN,

            // Internal server errors
            ErrorCode::ServerError | ErrorCode::DatabaseError => StatusCode::INTERNAL_SERVER_ERROR,

            // Bad request errors
            ErrorCode::InvalidData
            | ErrorCode::InvalidServerUrl
            | ErrorCode::MissingConfiguration
            | ErrorCode::InvalidConfiguration => StatusCode::BAD_REQUEST,

            // Other 4xx errors
            ErrorCode::SyncConflict => StatusCode::CONFLICT,
            ErrorCode::DataCorruption => StatusCode::UNPROCESSABLE_ENTITY,
            ErrorCode::StorageQuotaExceeded => StatusCode::INSUFFICIENT_STORAGE,

            // Not implemented
            ErrorCode::BrowserApiUnavailable => StatusCode::NOT_IMPLEMENTED,
        }
    }

    #[allow(dead_code)]
    #[must_use]
    pub fn default_message(&self) -> &'static str {
        match self {
            // Network & Connectivity
            ErrorCode::NetworkFailure => {
                "Unable to connect to the server. Please check your network connection."
            }
            ErrorCode::ConnectionTimeout => {
                "The connection to the server timed out. Please try again."
            }
            ErrorCode::DnsResolutionFailed => {
                "Cannot resolve server address. Please check the server URL."
            }
            ErrorCode::TlsCertificateError => {
                "SSL certificate error. The server certificate may be invalid."
            }

            // Authentication & Authorization
            ErrorCode::AuthTokenMissing => {
                "Authentication token is missing. Please configure your token."
            }
            ErrorCode::AuthTokenInvalid => {
                "Authentication token is invalid. Please check your token."
            }
            ErrorCode::AuthTokenExpired => {
                "Authentication token has expired. Please refresh your token."
            }
            ErrorCode::PermissionDenied => {
                "Permission denied. You do not have access to this resource."
            }

            // Server Errors
            ErrorCode::ServerUnavailable => {
                "Server is currently unavailable. Please try again later."
            }
            ErrorCode::ServerError => "An internal server error occurred. Please try again later.",
            ErrorCode::ServerOverloaded => {
                "Server is overloaded. Please try again in a few moments."
            }
            ErrorCode::MaintenanceMode => "Server is under maintenance. Please try again later.",

            // Data & Sync Errors
            ErrorCode::InvalidData => "The data format is invalid. Please check your input.",
            ErrorCode::SyncConflict => {
                "A sync conflict occurred. Your changes may have been overridden."
            }
            ErrorCode::DataCorruption => "Data corruption detected. Some data may be lost.",
            ErrorCode::StorageQuotaExceeded => "Storage quota exceeded. Please free up some space.",
            ErrorCode::DatabaseError => "Database error occurred. Please try again later.",

            // Configuration Errors
            ErrorCode::InvalidServerUrl => "Server URL is invalid. Please check the URL format.",
            ErrorCode::MissingConfiguration => {
                "Required configuration is missing. Please complete setup."
            }
            ErrorCode::InvalidConfiguration => {
                "Configuration is invalid. Please check your settings."
            }

            // Browser API Errors
            ErrorCode::ExtensionPermissionDenied => {
                "Extension permissions required. Please grant access in browser settings."
            }
            ErrorCode::BrowserApiUnavailable => {
                "Required browser API is not available in this environment."
            }
            ErrorCode::TabAccessDenied => {
                "Cannot access tab data. Please check extension permissions."
            }
            ErrorCode::WindowAccessDenied => {
                "Cannot access window data. Please check extension permissions."
            }
        }
    }

    #[must_use]
    pub fn is_retryable(&self) -> bool {
        matches!(
            self,
            ErrorCode::NetworkFailure
                | ErrorCode::ConnectionTimeout
                | ErrorCode::DnsResolutionFailed
                | ErrorCode::ServerUnavailable
                | ErrorCode::ServerOverloaded
                | ErrorCode::DatabaseError
        )
    }
}

/// Application-specific errors that can occur in the Tanaka server
#[derive(Error, Debug)]
#[allow(dead_code)]
pub enum AppError {
    #[error("Database error: {message}")]
    Database {
        message: String,
        #[source]
        source: sqlx::Error,
    },

    #[error("Authentication error: {message}")]
    Auth { message: String, code: ErrorCode },

    #[error("Validation error: {message}")]
    Validation {
        message: String,
        field: Option<String>,
    },

    #[error("Sync error: {message}")]
    Sync {
        message: String,
        context: HashMap<String, serde_json::Value>,
    },

    #[error("Configuration error: {message}")]
    Config {
        message: String,
        key: Option<String>,
    },

    #[error("JSON parsing error: {message}")]
    Json {
        message: String,
        #[source]
        source: serde_json::Error,
    },

    #[error("HTTP error: {message}")]
    Http { message: String, status: StatusCode },

    #[error("Internal error: {message}")]
    Internal {
        message: String,
        context: HashMap<String, serde_json::Value>,
    },

    #[error("IO error: {message}")]
    Io {
        message: String,
        #[source]
        source: std::io::Error,
    },
}

impl AppError {
    #[must_use]
    pub fn error_code(&self) -> ErrorCode {
        match self {
            AppError::Database { .. } => ErrorCode::DatabaseError,
            AppError::Auth { code, .. } => code.clone(),
            AppError::Validation { .. } | AppError::Json { .. } => ErrorCode::InvalidData,
            AppError::Sync { .. } => ErrorCode::SyncConflict,
            AppError::Config { .. } => ErrorCode::InvalidConfiguration,
            AppError::Http { status, .. } => match *status {
                StatusCode::UNAUTHORIZED => ErrorCode::AuthTokenInvalid,
                StatusCode::FORBIDDEN => ErrorCode::PermissionDenied,
                StatusCode::BAD_REQUEST => ErrorCode::InvalidData,
                _ => ErrorCode::ServerError,
            },
            AppError::Internal { .. } | AppError::Io { .. } => ErrorCode::ServerError,
        }
    }

    #[must_use]
    pub fn status_code(&self) -> StatusCode {
        match self {
            AppError::Database { .. } | AppError::Internal { .. } | AppError::Io { .. } => {
                StatusCode::INTERNAL_SERVER_ERROR
            }
            AppError::Auth { code, .. } => code.http_status(),
            AppError::Validation { .. } | AppError::Config { .. } | AppError::Json { .. } => {
                StatusCode::BAD_REQUEST
            }
            AppError::Sync { .. } => StatusCode::CONFLICT,
            AppError::Http { status, .. } => *status,
        }
    }

    #[must_use]
    pub fn is_retryable(&self) -> bool {
        match self {
            AppError::Database { .. } | AppError::Internal { .. } | AppError::Io { .. } => true, // Database, internal and IO errors are often transient
            AppError::Auth { code, .. } => code.is_retryable(),
            AppError::Validation { .. }
            | AppError::Sync { .. }
            | AppError::Config { .. }
            | AppError::Json { .. } => false, // These errors need user correction
            AppError::Http { status, .. } => matches!(
                status,
                &StatusCode::INTERNAL_SERVER_ERROR
                    | &StatusCode::BAD_GATEWAY
                    | &StatusCode::SERVICE_UNAVAILABLE
                    | &StatusCode::GATEWAY_TIMEOUT
            ),
        }
    }

    #[allow(dead_code)]
    #[must_use]
    pub fn auth_token_missing() -> Self {
        AppError::Auth {
            message: "Authentication token is missing".to_string(),
            code: ErrorCode::AuthTokenMissing,
        }
    }

    #[must_use]
    pub fn auth_token_invalid(message: impl Into<String>) -> Self {
        AppError::Auth {
            message: message.into(),
            code: ErrorCode::AuthTokenInvalid,
        }
    }

    #[allow(dead_code)]
    #[must_use]
    pub fn validation(message: impl Into<String>, field: Option<impl Into<String>>) -> Self {
        AppError::Validation {
            message: message.into(),
            field: field.map(Into::into),
        }
    }

    pub fn database(message: impl Into<String>, source: sqlx::Error) -> Self {
        AppError::Database {
            message: message.into(),
            source,
        }
    }

    #[allow(dead_code)]
    #[must_use]
    pub fn internal(message: impl Into<String>) -> Self {
        AppError::Internal {
            message: message.into(),
            context: HashMap::new(),
        }
    }

    #[allow(dead_code)]
    #[must_use]
    pub fn with_context(mut self, key: impl Into<String>, value: serde_json::Value) -> Self {
        match &mut self {
            AppError::Internal { context, .. } | AppError::Sync { context, .. } => {
                context.insert(key.into(), value);
            }
            _ => {} // Other error types don't support context
        }
        self
    }
}

#[derive(Debug, Serialize, TS)]
#[cfg_attr(
    feature = "generate-api-models",
    ts(export, export_to = "../../extension/src/api/errors/")
)]
pub struct ErrorResponse {
    pub status: String,
    pub error: ErrorDetail,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub retry: Option<RetryInfo>,
}

#[derive(Debug, Serialize, TS)]
#[cfg_attr(
    feature = "generate-api-models",
    ts(export, export_to = "../../extension/src/api/errors/")
)]
pub struct ErrorDetail {
    pub id: String,
    pub code: ErrorCode,
    pub message: String,
    pub timestamp: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[ts(skip)] // Skip context in TypeScript as it's dynamic JSON
    pub context: Option<HashMap<String, serde_json::Value>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub source: Option<String>,
}

#[derive(Debug, Serialize, TS)]
#[cfg_attr(
    feature = "generate-api-models",
    ts(export, export_to = "../../extension/src/api/errors/")
)]
pub struct RetryInfo {
    pub retryable: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub retry_after: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max_retries: Option<u32>,
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let error_id = Uuid::new_v4().to_string();
        let timestamp = chrono::Utc::now().to_rfc3339();
        let status_code = self.status_code();
        let error_code = self.error_code();
        let is_retryable = self.is_retryable();

        tracing::error!(
            error_id = %error_id,
            error_code = ?error_code,
            status_code = %status_code,
            error = %self,
            "Request failed"
        );

        let error_detail = ErrorDetail {
            id: error_id,
            code: error_code.clone(),
            message: self.to_string(),
            timestamp,
            context: match &self {
                AppError::Internal { context, .. } | AppError::Sync { context, .. } => {
                    if context.is_empty() {
                        None
                    } else {
                        Some(context.clone())
                    }
                }
                _ => None,
            },
            source: match &self {
                AppError::Database { source, .. } => Some(source.to_string()),
                AppError::Json { source, .. } => Some(source.to_string()),
                AppError::Io { source, .. } => Some(source.to_string()),
                _ => None,
            },
        };

        let retry_info = if is_retryable {
            Some(RetryInfo {
                retryable: true,
                retry_after: Some(match error_code {
                    ErrorCode::ServerOverloaded => 5000, // 5 seconds
                    ErrorCode::DatabaseError => 1000,    // 1 second
                    _ => 2000,                           // 2 seconds default
                }),
                max_retries: Some(3),
            })
        } else {
            Some(RetryInfo {
                retryable: false,
                retry_after: None,
                max_retries: None,
            })
        };

        let error_response = ErrorResponse {
            status: "error".to_string(),
            error: error_detail,
            retry: retry_info,
        };

        (status_code, Json(error_response)).into_response()
    }
}

impl From<sqlx::Error> for AppError {
    fn from(err: sqlx::Error) -> Self {
        AppError::database("Database operation failed", err)
    }
}

impl From<serde_json::Error> for AppError {
    fn from(err: serde_json::Error) -> Self {
        AppError::Json {
            message: "JSON parsing failed".to_string(),
            source: err,
        }
    }
}

impl From<std::io::Error> for AppError {
    fn from(err: std::io::Error) -> Self {
        AppError::Io {
            message: format!("IO operation failed: {}", err.kind()),
            source: err,
        }
    }
}

/// Result type alias for operations that can fail with `AppError`
pub type AppResult<T> = Result<T, AppError>;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_error_codes_have_valid_status() {
        let error_codes = [
            ErrorCode::NetworkFailure,
            ErrorCode::AuthTokenMissing,
            ErrorCode::ServerError,
            ErrorCode::InvalidData,
            ErrorCode::DatabaseError,
        ];

        for code in &error_codes {
            let status = code.http_status();
            assert!(status.as_u16() >= 400 && status.as_u16() < 600);
        }
    }

    #[test]
    fn test_app_error_status_codes() {
        let errors = vec![
            AppError::auth_token_missing(),
            AppError::validation("test error", Some("field")),
            AppError::internal("test internal error"),
        ];

        for error in errors {
            let status = error.status_code();
            assert!(status.as_u16() >= 400 && status.as_u16() < 600);
        }
    }

    #[test]
    fn test_retryable_errors() {
        assert!(AppError::database("test", sqlx::Error::RowNotFound).is_retryable());
        assert!(!AppError::validation("test", Some("field")).is_retryable());
        assert!(!AppError::auth_token_missing().is_retryable());
    }
}
