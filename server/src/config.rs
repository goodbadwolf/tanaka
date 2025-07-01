use clap::Parser;
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};

use crate::error::{AppError, AppResult};

/// Tanaka server configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    /// Server configuration
    pub server: ServerConfig,

    /// Database configuration
    pub database: DatabaseConfig,

    /// Authentication configuration
    pub auth: AuthConfig,

    /// TLS configuration (optional)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tls: Option<TlsConfig>,

    /// Sync configuration
    pub sync: SyncConfig,

    /// Logging configuration
    pub logging: LoggingConfig,
}

/// Server configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServerConfig {
    /// Bind address (e.g., "127.0.0.1:8443")
    #[serde(default = "default_bind_addr")]
    pub bind_addr: String,

    /// Worker threads (defaults to CPU count)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub worker_threads: Option<usize>,

    /// Request timeout in seconds
    #[serde(default = "default_request_timeout")]
    pub request_timeout_secs: u64,
}

/// Database configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DatabaseConfig {
    /// Database URL (e.g., `sqlite://tabs.db`)
    #[serde(default = "default_database_url")]
    pub url: String,

    /// Connection pool max size
    #[serde(default = "default_pool_size")]
    pub max_connections: u32,

    /// Connection timeout in seconds
    #[serde(default = "default_connection_timeout")]
    pub connection_timeout_secs: u64,
}

/// Authentication configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuthConfig {
    /// Shared authentication token
    pub shared_token: String,

    /// Token header name
    #[serde(default = "default_token_header")]
    pub token_header: String,

    /// Enable rate limiting
    #[serde(default = "default_rate_limiting")]
    pub rate_limiting: bool,

    /// Max requests per minute (if rate limiting enabled)
    #[serde(default = "default_max_requests_per_minute")]
    pub max_requests_per_minute: u32,
}

/// TLS configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TlsConfig {
    /// Path to certificate file
    pub cert_path: PathBuf,

    /// Path to private key file
    pub key_path: PathBuf,
}

/// Sync configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncConfig {
    /// Polling interval in seconds
    #[serde(default = "default_poll_secs")]
    pub poll_secs: u64,

    /// Database flush interval in seconds
    #[serde(default = "default_flush_secs")]
    pub flush_secs: u64,

    /// Maximum sync payload size in bytes
    #[serde(default = "default_max_payload_size")]
    pub max_payload_size: usize,

    /// Enable compression
    #[serde(default = "default_compression")]
    pub compression: bool,
}

/// Logging configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoggingConfig {
    /// Log level (trace, debug, info, warn, error)
    #[serde(default = "default_log_level")]
    pub level: String,

    /// Log format (json, pretty, compact)
    #[serde(default = "default_log_format")]
    pub format: String,

    /// Enable request logging
    #[serde(default = "default_request_logging")]
    pub request_logging: bool,
}

/// Command line arguments
#[derive(Parser, Debug)]
#[command(name = "tanaka-server")]
#[command(about = "CRDT-based tab synchronization server for Firefox")]
#[command(version, long_about = None)]
pub struct Args {
    /// Path to configuration file
    #[arg(short, long, env = "TANAKA_CONFIG", default_value = "tanaka.toml")]
    pub config: PathBuf,

    /// Override bind address
    #[arg(long, env = "TANAKA_BIND_ADDR")]
    pub bind_addr: Option<String>,

    /// Override database URL
    #[arg(long, env = "TANAKA_DATABASE_URL")]
    pub database_url: Option<String>,

    /// Override auth token
    #[arg(long, env = "TANAKA_AUTH_TOKEN")]
    pub auth_token: Option<String>,

    /// Override log level
    #[arg(long, env = "TANAKA_LOG_LEVEL")]
    pub log_level: Option<String>,
}

// Default value functions
fn default_bind_addr() -> String {
    "127.0.0.1:8443".to_string()
}

fn default_request_timeout() -> u64 {
    30
}

fn default_database_url() -> String {
    "sqlite://tabs.db".to_string()
}

fn default_pool_size() -> u32 {
    5
}

fn default_connection_timeout() -> u64 {
    10
}

fn default_token_header() -> String {
    "Authorization".to_string()
}

fn default_rate_limiting() -> bool {
    true
}

fn default_max_requests_per_minute() -> u32 {
    60
}

fn default_poll_secs() -> u64 {
    5
}

fn default_flush_secs() -> u64 {
    5
}

fn default_max_payload_size() -> usize {
    1024 * 1024 // 1MB
}

fn default_compression() -> bool {
    false
}

fn default_log_level() -> String {
    "info".to_string()
}

fn default_log_format() -> String {
    "pretty".to_string()
}

fn default_request_logging() -> bool {
    true
}

impl Config {
    /// Load configuration from file and environment
    ///
    /// # Errors
    ///
    /// Returns error if:
    /// - Configuration file exists but cannot be read or parsed
    /// - Required configuration values are missing or invalid
    pub fn load(args: &Args) -> AppResult<Self> {
        // Load .env file if it exists
        if let Err(e) = dotenvy::dotenv() {
            if !matches!(e, dotenvy::Error::Io(_)) {
                tracing::warn!("Failed to load .env file: {}", e);
            }
        }

        // Load base config from file
        let mut config = if args.config.exists() {
            let content = std::fs::read_to_string(&args.config).map_err(|e| AppError::Config {
                message: format!("Failed to read config file: {e}"),
                key: Some("file".to_string()),
            })?;

            toml::from_str(&content).map_err(|e| AppError::Config {
                message: format!("Failed to parse config file: {e}"),
                key: Some("parse".to_string()),
            })?
        } else {
            // Create default config if file doesn't exist
            Self::default()
        };

        // Apply command line overrides
        if let Some(bind_addr) = &args.bind_addr {
            config.server.bind_addr.clone_from(bind_addr);
        }

        if let Some(database_url) = &args.database_url {
            config.database.url.clone_from(database_url);
        }

        if let Some(auth_token) = &args.auth_token {
            config.auth.shared_token.clone_from(auth_token);
        }

        if let Some(log_level) = &args.log_level {
            config.logging.level.clone_from(log_level);
        }

        // Validate configuration
        config.validate()?;

        Ok(config)
    }

    /// Validate configuration
    ///
    /// # Errors
    ///
    /// Returns error if:
    /// - Bind address is empty
    /// - Auth token is empty
    /// - TLS files don't exist when TLS is configured
    /// - Log level is invalid
    pub fn validate(&self) -> AppResult<()> {
        // Validate bind address
        if self.server.bind_addr.is_empty() {
            return Err(AppError::Config {
                message: "Bind address cannot be empty".to_string(),
                key: Some("server.bind_addr".to_string()),
            });
        }

        // Validate auth token
        if self.auth.shared_token.is_empty() {
            return Err(AppError::Config {
                message: "Auth token cannot be empty".to_string(),
                key: Some("auth.shared_token".to_string()),
            });
        }

        // Validate TLS config if provided
        if let Some(tls) = &self.tls {
            if !tls.cert_path.exists() {
                return Err(AppError::Config {
                    message: format!(
                        "Certificate file not found: {cert_path:?}",
                        cert_path = tls.cert_path
                    ),
                    key: Some("tls.cert_path".to_string()),
                });
            }

            if !tls.key_path.exists() {
                return Err(AppError::Config {
                    message: format!("Key file not found: {key_path:?}", key_path = tls.key_path),
                    key: Some("tls.key_path".to_string()),
                });
            }
        }

        // Validate log level
        let valid_levels = ["trace", "debug", "info", "warn", "error"];
        if !valid_levels.contains(&self.logging.level.as_str()) {
            return Err(AppError::Config {
                message: format!("Invalid log level: {}", self.logging.level),
                key: Some("logging.level".to_string()),
            });
        }

        Ok(())
    }

    /// Save configuration to file
    ///
    /// # Errors
    ///
    /// Returns error if:
    /// - Configuration cannot be serialized to TOML
    /// - File cannot be written
    #[allow(dead_code)]
    pub fn save(&self, path: &Path) -> AppResult<()> {
        let content = toml::to_string_pretty(self).map_err(|e| AppError::Config {
            message: format!("Failed to serialize config: {e}"),
            key: Some("serialize".to_string()),
        })?;

        std::fs::write(path, content).map_err(|e| AppError::Config {
            message: format!("Failed to write config file: {e}"),
            key: Some("write".to_string()),
        })?;

        Ok(())
    }
}

impl Default for Config {
    fn default() -> Self {
        Self {
            server: ServerConfig {
                bind_addr: default_bind_addr(),
                worker_threads: None,
                request_timeout_secs: default_request_timeout(),
            },
            database: DatabaseConfig {
                url: default_database_url(),
                max_connections: default_pool_size(),
                connection_timeout_secs: default_connection_timeout(),
            },
            auth: AuthConfig {
                shared_token: String::new(), // Must be set by user
                token_header: default_token_header(),
                rate_limiting: default_rate_limiting(),
                max_requests_per_minute: default_max_requests_per_minute(),
            },
            tls: None,
            sync: SyncConfig {
                poll_secs: default_poll_secs(),
                flush_secs: default_flush_secs(),
                max_payload_size: default_max_payload_size(),
                compression: default_compression(),
            },
            logging: LoggingConfig {
                level: default_log_level(),
                format: default_log_format(),
                request_logging: default_request_logging(),
            },
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[test]
    fn test_default_config() {
        let config = Config::default();
        assert_eq!(config.server.bind_addr, "127.0.0.1:8443");
        assert_eq!(config.database.url, "sqlite://tabs.db");
        assert_eq!(config.sync.poll_secs, 5);
    }

    #[test]
    fn test_config_validation() {
        let mut config = Config::default();

        // Empty auth token should fail
        assert!(config.validate().is_err());

        // Valid config should pass
        config.auth.shared_token = "test-token".to_string();
        assert!(config.validate().is_ok());

        // Invalid log level should fail
        config.logging.level = "invalid".to_string();
        assert!(config.validate().is_err());
    }

    #[test]
    fn test_config_save_load() {
        let temp_dir = TempDir::new().unwrap();
        let config_path = temp_dir.path().join("test.toml");

        let mut config = Config::default();
        config.auth.shared_token = "test-token".to_string();

        // Save config
        config.save(&config_path).unwrap();
        assert!(config_path.exists());

        // Load config
        let args = Args {
            config: config_path,
            bind_addr: None,
            database_url: None,
            auth_token: None,
            log_level: None,
        };

        let loaded = Config::load(&args).unwrap();
        assert_eq!(loaded.auth.shared_token, "test-token");
    }
}
