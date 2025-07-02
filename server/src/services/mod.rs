use async_trait::async_trait;
use std::collections::HashMap;

use crate::error::AppError;
use crate::models::{Tab, Window};
use crate::sync::{CrdtOperation, SyncRequest, SyncResponse};

pub mod auth;
pub mod container;
pub mod sync;

#[cfg(test)]
mod tests;

/// Service for handling authentication and authorization
#[async_trait]
pub trait AuthService: Send + Sync {
    /// Validate a bearer token and return the associated device/user info
    async fn validate_token(&self, token: &str) -> Result<AuthContext, AppError>;

    /// Check if a device is within rate limits
    async fn check_rate_limit(&self, device_id: &str) -> Result<bool, AppError>;

    /// Record an API request for rate limiting
    async fn record_request(&self, device_id: &str) -> Result<(), AppError>;
}

/// Service for handling synchronization business logic
#[async_trait]
pub trait SyncService: Send + Sync {
    /// Process a sync request and return the response
    async fn sync(
        &self,
        request: SyncRequest,
        auth: &AuthContext,
    ) -> Result<SyncResponse, AppError>;

    /// Get the current server state for a device
    async fn get_state(&self, device_id: &str) -> Result<SyncState, AppError>;

    /// Validate operations before processing
    async fn validate_operations(&self, operations: &[CrdtOperation]) -> Result<(), AppError>;
}

/// Service for managing tab state and operations
#[async_trait]
pub trait TabService: Send + Sync {
    /// Apply a tab operation and update state
    async fn apply_operation(&self, operation: &CrdtOperation) -> Result<(), AppError>;

    /// Get all tabs for a window
    async fn get_tabs_for_window(&self, window_id: &str) -> Result<Vec<Tab>, AppError>;

    /// Get a specific tab by ID
    async fn get_tab(&self, tab_id: &str) -> Result<Option<Tab>, AppError>;
}

/// Service for managing window state and tracking
#[async_trait]
pub trait WindowService: Send + Sync {
    /// Apply a window operation and update state
    async fn apply_operation(&self, operation: &CrdtOperation) -> Result<(), AppError>;

    /// Get all tracked windows
    async fn get_tracked_windows(&self) -> Result<Vec<Window>, AppError>;

    /// Get a specific window by ID
    async fn get_window(&self, window_id: &str) -> Result<Option<Window>, AppError>;
}

/// Service for health checks and monitoring
#[async_trait]
pub trait HealthService: Send + Sync {
    /// Check if all dependencies are healthy
    async fn check_health(&self) -> Result<HealthStatus, AppError>;

    /// Get detailed service status
    async fn get_status(&self) -> Result<ServiceStatus, AppError>;
}

/// Authentication context containing validated user/device information
#[derive(Debug, Clone)]
pub struct AuthContext {
    pub device_id: String,
    pub token: String,
    pub permissions: Vec<String>,
    pub metadata: HashMap<String, String>,
}

/// Current synchronization state for a device
#[derive(Debug, Clone)]
pub struct SyncState {
    pub device_id: String,
    pub last_clock: u64,
    pub operation_count: usize,
    pub last_sync_at: i64,
}

/// Health status of the service
#[derive(Debug, Clone)]
pub struct HealthStatus {
    pub healthy: bool,
    pub checks: HashMap<String, bool>,
    pub message: Option<String>,
}

/// Detailed service status information
#[derive(Debug, Clone)]
pub struct ServiceStatus {
    pub uptime_seconds: u64,
    pub active_devices: usize,
    pub total_operations: u64,
    pub database_status: String,
    pub memory_usage_mb: f64,
}

/// Service container that holds all business logic services
pub struct Services {
    pub auth: Box<dyn AuthService>,
    pub sync: Box<dyn SyncService>,
    pub tabs: Box<dyn TabService>,
    pub windows: Box<dyn WindowService>,
    pub health: Box<dyn HealthService>,
}

impl Services {
    /// Create a new services container with the given implementations
    #[must_use]
    pub fn new(
        auth: Box<dyn AuthService>,
        sync: Box<dyn SyncService>,
        tabs: Box<dyn TabService>,
        windows: Box<dyn WindowService>,
        health: Box<dyn HealthService>,
    ) -> Self {
        Self {
            auth,
            sync,
            tabs,
            windows,
            health,
        }
    }
}
