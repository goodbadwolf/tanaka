use std::sync::Arc;

use crate::config::{AuthConfig, SyncConfig};
use crate::crdt::CrdtManager;
use crate::repository::Repositories;
use crate::services::{
    auth::{MockAuthService, SharedTokenAuthService},
    sync::CrdtSyncService,
    AuthService, SyncService,
};

/// Service container that holds all services
pub struct ServiceContainer {
    pub auth: Arc<dyn AuthService>,
    pub sync: Arc<dyn SyncService>,
}

impl ServiceContainer {
    /// Create a new service container with production implementations
    pub fn new_production(
        auth_config: AuthConfig,
        sync_config: SyncConfig,
        repositories: Arc<Repositories>,
        crdt_manager: Arc<CrdtManager>,
    ) -> Self {
        let auth = Arc::new(SharedTokenAuthService::new(auth_config));
        let sync = Arc::new(CrdtSyncService::new(
            repositories,
            crdt_manager,
            sync_config,
        ));

        Self { auth, sync }
    }

    /// Create a new service container with mock implementations for testing
    #[must_use]
    pub fn new_mock() -> Self {
        let auth = Arc::new(MockAuthService::new());

        // For mock sync service, we need mock repositories
        let repositories = Arc::new(Repositories::new_mock());
        let crdt_manager = Arc::new(CrdtManager::new(1));
        let sync_config = SyncConfig::default();
        let sync = Arc::new(CrdtSyncService::new(
            repositories,
            crdt_manager,
            sync_config,
        ));

        Self { auth, sync }
    }

    /// Create a service container with custom implementations
    pub fn new_custom(auth: Arc<dyn AuthService>, sync: Arc<dyn SyncService>) -> Self {
        Self { auth, sync }
    }
}

/// Builder for service container configuration
pub struct ServiceContainerBuilder {
    auth_config: Option<AuthConfig>,
    sync_config: Option<SyncConfig>,
    repositories: Option<Arc<Repositories>>,
    crdt_manager: Option<Arc<CrdtManager>>,
    use_mocks: bool,
}

impl ServiceContainerBuilder {
    /// Create a new builder
    #[must_use]
    pub fn new() -> Self {
        Self {
            auth_config: None,
            sync_config: None,
            repositories: None,
            crdt_manager: None,
            use_mocks: false,
        }
    }

    /// Configure authentication
    #[must_use]
    pub fn with_auth_config(mut self, config: AuthConfig) -> Self {
        self.auth_config = Some(config);
        self
    }

    /// Configure sync settings
    #[must_use]
    pub fn with_sync_config(mut self, config: SyncConfig) -> Self {
        self.sync_config = Some(config);
        self
    }

    /// Configure repositories
    #[must_use]
    pub fn with_repositories(mut self, repositories: Arc<Repositories>) -> Self {
        self.repositories = Some(repositories);
        self
    }

    /// Configure CRDT manager
    #[must_use]
    pub fn with_crdt_manager(mut self, crdt_manager: Arc<CrdtManager>) -> Self {
        self.crdt_manager = Some(crdt_manager);
        self
    }

    /// Use mock implementations for testing
    #[must_use]
    pub fn with_mocks(mut self) -> Self {
        self.use_mocks = true;
        self
    }

    /// Build the service container
    ///
    /// # Panics
    ///
    /// Panics if required configuration is missing for production container
    #[must_use]
    pub fn build(self) -> ServiceContainer {
        if self.use_mocks {
            return ServiceContainer::new_mock();
        }

        let auth_config = self
            .auth_config
            .expect("Auth config is required for production container");
        let sync_config = self.sync_config.unwrap_or_default();
        let repositories = self
            .repositories
            .expect("Repositories are required for production container");
        let crdt_manager = self
            .crdt_manager
            .expect("CRDT manager is required for production container");

        ServiceContainer::new_production(auth_config, sync_config, repositories, crdt_manager)
    }
}

impl Default for ServiceContainerBuilder {
    fn default() -> Self {
        Self::new()
    }
}

/// Create services from config and dependencies
pub fn create_services(
    repositories: Arc<Repositories>,
    crdt_manager: Arc<CrdtManager>,
    config: crate::config::Config,
) -> Arc<ServiceContainer> {
    Arc::new(ServiceContainer::new_production(
        config.auth,
        config.sync,
        repositories,
        crdt_manager,
    ))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::config::AuthConfig;

    #[tokio::test]
    async fn test_service_container_builder() {
        let container = ServiceContainerBuilder::new().with_mocks().build();

        // Should have mock implementations
        assert!(container.auth.validate_token("any-token").await.is_ok());
    }

    #[tokio::test]
    async fn test_mock_service_container() {
        let container = ServiceContainer::new_mock();

        // Test auth service
        let auth_result = container.auth.validate_token("test-token").await;
        assert!(auth_result.is_ok());

        // Test rate limiting
        let rate_limit_result = container.auth.check_rate_limit("test-device").await;
        assert!(rate_limit_result.is_ok());
        assert!(rate_limit_result.unwrap());
    }

    #[test]
    fn test_production_service_container() {
        let auth_config = AuthConfig {
            shared_token: "test-token".to_string(),
            token_header: "authorization".to_string(),
            rate_limiting: false,
            max_requests_per_minute: 60,
        };

        let sync_config = SyncConfig::default();
        let repositories = Arc::new(Repositories::new_mock());
        let crdt_manager = Arc::new(CrdtManager::new(1));

        let container =
            ServiceContainer::new_production(auth_config, sync_config, repositories, crdt_manager);

        // Should have production implementations (different trait objects)
        let auth_ptr = std::ptr::addr_of!(*container.auth);
        let sync_ptr = std::ptr::addr_of!(*container.sync);

        // Just verify they are different instances
        assert_ne!(auth_ptr.cast::<u8>(), sync_ptr.cast::<u8>());
    }
}
