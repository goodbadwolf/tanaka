use async_trait::async_trait;
use dashmap::DashMap;
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

use crate::config::AuthConfig;
use crate::error::AppError;
use crate::services::{AuthContext, AuthService};

/// Implementation of `AuthService` using shared token authentication
pub struct SharedTokenAuthService {
    config: AuthConfig,
    rate_limiter: Arc<DashMap<String, RateLimitInfo>>,
    last_cleanup: Arc<Mutex<Instant>>,
}

#[derive(Debug, Clone)]
struct RateLimitInfo {
    request_count: u32,
    window_start: Instant,
}

impl SharedTokenAuthService {
    /// Create a new `AuthService` with the given configuration
    #[must_use]
    pub fn new(config: AuthConfig) -> Self {
        Self {
            config,
            rate_limiter: Arc::new(DashMap::new()),
            last_cleanup: Arc::new(Mutex::new(Instant::now())),
        }
    }
}

#[async_trait]
impl AuthService for SharedTokenAuthService {
    async fn validate_token(&self, token: &str) -> Result<AuthContext, AppError> {
        // Extract bearer token from Authorization header if needed
        let token = token.strip_prefix("Bearer ").unwrap_or(token);

        // Validate against shared token
        if token != self.config.shared_token {
            return Err(AppError::auth_token_invalid("Invalid token"));
        }

        // For shared token auth with multi-device support, we don't generate device IDs
        // The device ID will be provided by the client in the sync request
        // This allows multiple devices to use the same shared token with different device IDs
        let device_id = "auth-validated".to_string(); // Placeholder - actual device_id comes from request

        Ok(AuthContext {
            device_id,
            token: token.to_string(),
            permissions: vec!["sync".to_string(), "read".to_string(), "write".to_string()],
            metadata: HashMap::new(),
        })
    }

    async fn check_rate_limit(&self, device_id: &str) -> Result<bool, AppError> {
        if !self.config.rate_limiting {
            return Ok(true);
        }

        let now = Instant::now();
        let max_requests = self.config.max_requests_per_minute;

        // Clean up old entries periodically - check if 5 minutes have passed since last cleanup
        if let Ok(mut last_cleanup) = self.last_cleanup.try_lock() {
            if now.duration_since(*last_cleanup) >= Duration::from_secs(300) {
                self.cleanup_old_rate_limit_entries();
                *last_cleanup = now;
            }
        }

        let mut within_limit = true;

        self.rate_limiter
            .entry(device_id.to_string())
            .and_modify(|info| {
                // Reset window if more than a minute has passed
                if now.duration_since(info.window_start) >= Duration::from_secs(60) {
                    info.request_count = 0;
                    info.window_start = now;
                }

                within_limit = info.request_count < max_requests;
            })
            .or_insert_with(|| {
                within_limit = true;
                RateLimitInfo {
                    request_count: 0,
                    window_start: now,
                }
            });

        Ok(within_limit)
    }

    async fn record_request(&self, device_id: &str) -> Result<(), AppError> {
        if !self.config.rate_limiting {
            return Ok(());
        }

        let now = Instant::now();

        self.rate_limiter
            .entry(device_id.to_string())
            .and_modify(|info| {
                // Reset window if more than a minute has passed
                if now.duration_since(info.window_start) >= Duration::from_secs(60) {
                    info.request_count = 1;
                    info.window_start = now;
                } else {
                    info.request_count += 1;
                }
            })
            .or_insert_with(|| RateLimitInfo {
                request_count: 1,
                window_start: now,
            });

        Ok(())
    }
}

impl SharedTokenAuthService {
    // Note: hash_token method removed as device IDs are now client-provided
    // This allows multiple devices to use the same shared token with different device IDs

    /// Clean up old rate limit entries to prevent memory leaks
    fn cleanup_old_rate_limit_entries(&self) {
        let now = Instant::now();
        let cutoff = Duration::from_secs(300); // 5 minutes

        self.rate_limiter
            .retain(|_, info| now.duration_since(info.window_start) < cutoff);
    }
}

/// Mock `AuthService` for testing that always allows access
pub struct MockAuthService {
    should_fail: bool,
    rate_limit_enabled: bool,
}

impl MockAuthService {
    /// Create a new mock auth service
    #[must_use]
    pub fn new() -> Self {
        Self {
            should_fail: false,
            rate_limit_enabled: false,
        }
    }

    /// Configure the mock to fail authentication
    #[must_use]
    pub fn with_auth_failure(mut self) -> Self {
        self.should_fail = true;
        self
    }

    /// Configure the mock to enforce rate limiting
    #[must_use]
    pub fn with_rate_limiting(mut self) -> Self {
        self.rate_limit_enabled = true;
        self
    }
}

impl Default for MockAuthService {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl AuthService for MockAuthService {
    async fn validate_token(&self, token: &str) -> Result<AuthContext, AppError> {
        if self.should_fail {
            return Err(AppError::auth_token_invalid("Mock auth failure"));
        }

        Ok(AuthContext {
            device_id: format!("mock-device-{}", token.len()),
            token: token.to_string(),
            permissions: vec!["sync".to_string()],
            metadata: HashMap::new(),
        })
    }

    async fn check_rate_limit(&self, _device_id: &str) -> Result<bool, AppError> {
        Ok(!self.rate_limit_enabled)
    }

    async fn record_request(&self, _device_id: &str) -> Result<(), AppError> {
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_shared_token_auth_success() {
        let config = AuthConfig {
            shared_token: "test-token".to_string(),
            token_header: "authorization".to_string(),
            rate_limiting: false,
            max_requests_per_minute: 60,
        };

        let auth_service = SharedTokenAuthService::new(config);
        let result = auth_service.validate_token("test-token").await;

        assert!(result.is_ok());
        let context = result.unwrap();
        assert_eq!(context.device_id, "auth-validated");
        assert_eq!(context.token, "test-token");
        assert!(context.permissions.contains(&"sync".to_string()));
    }

    #[tokio::test]
    async fn test_shared_token_auth_failure() {
        let config = AuthConfig {
            shared_token: "correct-token".to_string(),
            token_header: "authorization".to_string(),
            rate_limiting: false,
            max_requests_per_minute: 60,
        };

        let auth_service = SharedTokenAuthService::new(config);
        let result = auth_service.validate_token("wrong-token").await;

        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_bearer_token_extraction() {
        let config = AuthConfig {
            shared_token: "test-token".to_string(),
            token_header: "authorization".to_string(),
            rate_limiting: false,
            max_requests_per_minute: 60,
        };

        let auth_service = SharedTokenAuthService::new(config);
        let result = auth_service.validate_token("Bearer test-token").await;

        assert!(result.is_ok());
        let context = result.unwrap();
        assert_eq!(context.token, "test-token");
    }

    #[tokio::test]
    async fn test_rate_limiting_disabled() {
        let config = AuthConfig {
            shared_token: "test-token".to_string(),
            token_header: "authorization".to_string(),
            rate_limiting: false,
            max_requests_per_minute: 1,
        };

        let auth_service = SharedTokenAuthService::new(config);

        // Should always pass when disabled
        assert!(auth_service.check_rate_limit("device-1").await.unwrap());
        assert!(auth_service.check_rate_limit("device-1").await.unwrap());
    }

    #[tokio::test]
    async fn test_rate_limiting_enabled() {
        let config = AuthConfig {
            shared_token: "test-token".to_string(),
            token_header: "authorization".to_string(),
            rate_limiting: true,
            max_requests_per_minute: 2,
        };

        let auth_service = SharedTokenAuthService::new(config);

        // First requests should pass
        assert!(auth_service.check_rate_limit("device-1").await.unwrap());
        auth_service.record_request("device-1").await.unwrap();

        assert!(auth_service.check_rate_limit("device-1").await.unwrap());
        auth_service.record_request("device-1").await.unwrap();

        // Third request should fail
        assert!(!auth_service.check_rate_limit("device-1").await.unwrap());
    }

    #[tokio::test]
    async fn test_mock_auth_service() {
        let auth_service = MockAuthService::new();
        let result = auth_service.validate_token("any-token").await;

        assert!(result.is_ok());
        assert!(auth_service.check_rate_limit("any-device").await.unwrap());
    }

    #[tokio::test]
    async fn test_mock_auth_service_failure() {
        let auth_service = MockAuthService::new().with_auth_failure();
        let result = auth_service.validate_token("any-token").await;

        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_rate_limiter_cleanup_prevents_memory_leak() {
        let config = AuthConfig {
            shared_token: "test-token".to_string(),
            token_header: "authorization".to_string(),
            rate_limiting: true,
            max_requests_per_minute: 100,
        };

        let auth_service = SharedTokenAuthService::new(config);

        // Simulate many different devices to fill the rate limiter
        for i in 0..100 {
            let device_id = format!("device-{i}");
            auth_service.record_request(&device_id).await.unwrap();
        }

        // Verify entries were added
        let initial_count = auth_service.rate_limiter.len();
        assert_eq!(initial_count, 100);

        // Manually age all entries to be older than 5 minutes
        for i in 0..100 {
            let device_id = format!("device-{i}");
            if let Some(mut entry) = auth_service.rate_limiter.get_mut(&device_id) {
                entry.window_start = Instant::now()
                    .checked_sub(Duration::from_secs(301))
                    .unwrap();
            }
        }

        // Force cleanup by setting last_cleanup to 5+ minutes ago
        {
            let mut last_cleanup = auth_service.last_cleanup.lock().unwrap();
            *last_cleanup = Instant::now()
                .checked_sub(Duration::from_secs(301))
                .unwrap();
        }

        // Trigger cleanup by calling check_rate_limit
        auth_service
            .check_rate_limit("trigger-cleanup")
            .await
            .unwrap();

        // Verify cleanup occurred - all old entries should be removed
        let final_count = auth_service.rate_limiter.len();

        // Since all entries were aged to be older than 5 minutes, they should be cleaned up
        // Only the "trigger-cleanup" entry should remain
        assert_eq!(
            final_count, 1,
            "Cleanup should have removed all old entries, leaving only the trigger entry"
        );
    }

    #[tokio::test]
    async fn test_rate_limiter_cleanup_removes_old_entries() {
        let config = AuthConfig {
            shared_token: "test-token".to_string(),
            token_header: "authorization".to_string(),
            rate_limiting: true,
            max_requests_per_minute: 100,
        };

        let auth_service = SharedTokenAuthService::new(config);

        // Add an entry and manually age it by modifying its window_start
        auth_service.record_request("old-device").await.unwrap();

        // Manually age the entry to be older than 5 minutes
        if let Some(mut entry) = auth_service.rate_limiter.get_mut("old-device") {
            entry.window_start = Instant::now()
                .checked_sub(Duration::from_secs(301))
                .unwrap();
        }

        // Add a recent entry that should not be cleaned up
        auth_service.record_request("new-device").await.unwrap();

        // Verify both entries exist
        assert_eq!(auth_service.rate_limiter.len(), 2);

        // Force cleanup
        {
            let mut last_cleanup = auth_service.last_cleanup.lock().unwrap();
            *last_cleanup = Instant::now()
                .checked_sub(Duration::from_secs(301))
                .unwrap();
        }

        // Trigger cleanup
        auth_service.check_rate_limit("trigger").await.unwrap();

        // Old entry should be removed, new entry should remain
        assert!(!auth_service.rate_limiter.contains_key("old-device"));
        assert!(auth_service.rate_limiter.contains_key("new-device"));
    }

    #[tokio::test]
    async fn test_cleanup_does_not_block_normal_operation() {
        let config = AuthConfig {
            shared_token: "test-token".to_string(),
            token_header: "authorization".to_string(),
            rate_limiting: true,
            max_requests_per_minute: 100,
        };

        let auth_service = SharedTokenAuthService::new(config);

        // Normal operation should work even if cleanup fails
        // (e.g., if mutex is already locked by another thread)
        assert!(auth_service.check_rate_limit("device-1").await.unwrap());
        auth_service.record_request("device-1").await.unwrap();
        assert!(auth_service.check_rate_limit("device-1").await.unwrap());
    }
}
