use clap::Parser;
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};

use crate::error::{AppError, AppResult};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    pub server: ServerConfig,

    pub database: DatabaseConfig,

    pub auth: AuthConfig,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub tls: Option<TlsConfig>,

    pub sync: SyncConfig,

    pub logging: LoggingConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServerConfig {
    #[serde(default = "default_bind_addr")]
    pub bind_addr: String,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub worker_threads: Option<usize>,

    #[serde(default = "default_request_timeout")]
    pub request_timeout_secs: u64,

    #[serde(default = "default_max_concurrent_connections")]
    pub max_concurrent_connections: usize,

    pub cors: CorsConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CorsConfig {
    #[serde(default = "default_allowed_origins")]
    pub allowed_origins: Vec<String>,

    #[serde(default = "default_max_age")]
    pub max_age_secs: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DatabaseConfig {
    #[serde(default = "default_database_url")]
    pub url: String,

    #[serde(default = "default_pool_size")]
    pub max_connections: u32,

    #[serde(default = "default_connection_timeout")]
    pub connection_timeout_secs: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuthConfig {
    pub shared_token: String,

    #[serde(default = "default_token_header")]
    pub token_header: String,

    #[serde(default = "default_rate_limiting")]
    pub rate_limiting: bool,

    #[serde(default = "default_max_requests_per_minute")]
    pub max_requests_per_minute: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TlsConfig {
    pub cert_path: PathBuf,

    pub key_path: PathBuf,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncConfig {
    #[serde(default = "default_poll_secs")]
    pub poll_secs: u64,

    #[serde(default = "default_flush_secs")]
    pub flush_secs: u64,

    #[serde(default = "default_max_payload_size")]
    pub max_payload_size: usize,

    #[serde(default = "default_compression")]
    pub compression: bool,

    #[serde(default = "default_max_url_length")]
    pub max_url_length: usize,

    #[serde(default = "default_max_title_length")]
    pub max_title_length: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoggingConfig {
    #[serde(default = "default_log_level")]
    pub level: String,

    #[serde(default = "default_log_format")]
    pub format: String,

    #[serde(default = "default_request_logging")]
    pub request_logging: bool,
}

#[derive(Parser, Debug)]
#[command(name = "tanaka-server")]
#[command(about = "CRDT-based tab synchronization server for Firefox")]
#[command(version, long_about = None)]
pub struct Args {
    #[arg(short, long, env = "TANAKA_CONFIG", default_value = "tanaka.toml")]
    pub config: PathBuf,

    #[arg(long, env = "TANAKA_BIND_ADDR")]
    pub bind_addr: Option<String>,

    #[arg(long, env = "TANAKA_DATABASE_URL")]
    pub database_url: Option<String>,

    #[arg(long, env = "TANAKA_AUTH_TOKEN")]
    pub auth_token: Option<String>,

    #[arg(long, env = "TANAKA_LOG_LEVEL")]
    pub log_level: Option<String>,
}

fn default_bind_addr() -> String {
    "127.0.0.1:8443".to_string()
}

fn default_request_timeout() -> u64 {
    30
}

fn default_max_concurrent_connections() -> usize {
    1000
}

fn default_database_url() -> String {
    "sqlite://tanaka.db".to_string()
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

fn default_max_url_length() -> usize {
    2048
}

fn default_max_title_length() -> usize {
    512
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

fn default_allowed_origins() -> Vec<String> {
    vec![
        "moz-extension://*".to_string(), // Firefox WebExtension origins
    ]
}

fn default_max_age() -> u64 {
    3600 // 1 hour
}

impl Config {
    /// Load configuration from file and environment
    ///
    /// # Errors
    ///
    /// Returns `AppError::Config` if:
    /// - Configuration file cannot be read
    /// - Configuration file contains invalid TOML
    /// - Configuration validation fails
    pub fn load(args: &Args) -> AppResult<Self> {
        if let Err(e) = dotenvy::dotenv() {
            if !matches!(e, dotenvy::Error::Io(_)) {
                tracing::warn!("Failed to load .env file: {}", e);
            }
        }

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
            Self::default()
        };

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

        config.validate()?;

        Ok(config)
    }

    /// Validate configuration
    ///
    /// # Errors
    ///
    /// Returns `AppError::Config` if:
    /// - Bind address is empty
    /// - Auth token is empty
    /// - TLS files don't exist when TLS is configured
    /// - Log level is invalid
    pub fn validate(&self) -> AppResult<()> {
        if self.server.bind_addr.is_empty() {
            return Err(AppError::Config {
                message: "Bind address cannot be empty".to_string(),
                key: Some("server.bind_addr".to_string()),
            });
        }

        if self.auth.shared_token.is_empty() {
            return Err(AppError::Config {
                message: "Auth token cannot be empty".to_string(),
                key: Some("auth.shared_token".to_string()),
            });
        }

        if let Some(tls) = &self.tls {
            if !tls.cert_path.exists() {
                return Err(AppError::Config {
                    message: format!("Certificate file not found: {}", tls.cert_path.display()),
                    key: Some("tls.cert_path".to_string()),
                });
            }

            if !tls.key_path.exists() {
                return Err(AppError::Config {
                    message: format!("Key file not found: {}", tls.key_path.display()),
                    key: Some("tls.key_path".to_string()),
                });
            }
        }

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
    /// Returns `AppError::Config` if:
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
                max_concurrent_connections: default_max_concurrent_connections(),
                cors: CorsConfig {
                    allowed_origins: default_allowed_origins(),
                    max_age_secs: default_max_age(),
                },
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
                max_url_length: default_max_url_length(),
                max_title_length: default_max_title_length(),
            },
            logging: LoggingConfig {
                level: default_log_level(),
                format: default_log_format(),
                request_logging: default_request_logging(),
            },
        }
    }
}

impl Default for SyncConfig {
    fn default() -> Self {
        Self {
            poll_secs: default_poll_secs(),
            flush_secs: default_flush_secs(),
            max_payload_size: default_max_payload_size(),
            compression: default_compression(),
            max_url_length: default_max_url_length(),
            max_title_length: default_max_title_length(),
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
        assert_eq!(config.database.url, "sqlite://tanaka.db");
        assert_eq!(config.sync.poll_secs, 5);
    }

    #[test]
    fn test_config_validation() {
        let mut config = Config::default();

        assert!(config.validate().is_err());

        config.auth.shared_token = "test-token".to_string();
        assert!(config.validate().is_ok());

        config.logging.level = "invalid".to_string();
        assert!(config.validate().is_err());
    }

    #[test]
    fn test_config_save_load() {
        let temp_dir = TempDir::new().unwrap();
        let config_path = temp_dir.path().join("test.toml");

        let mut config = Config::default();
        config.auth.shared_token = "test-token".to_string();

        config.save(&config_path).unwrap();
        assert!(config_path.exists());

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

    #[test]
    fn test_cors_config_defaults() {
        let config = Config::default();
        assert_eq!(
            config.server.cors.allowed_origins,
            vec!["moz-extension://*".to_string()]
        );
        assert_eq!(config.server.cors.max_age_secs, 3600);
    }

    #[test]
    fn test_cors_config_serialization() {
        let config = Config::default();
        let toml_str = toml::to_string(&config).unwrap();

        // Verify CORS section exists in serialized config
        assert!(toml_str.contains("[server.cors]"));
        assert!(toml_str.contains("allowed_origins"));
        assert!(toml_str.contains("moz-extension://*"));
    }
}
