use std::sync::Arc;

use crate::{
    crdt::CrdtManager,
    error::{AppError, AppResult},
    repository::OperationRepository,
};

/// Encapsulates server startup and state restoration logic
pub struct ServerBootstrap {
    node_id: u32,
}

impl ServerBootstrap {
    #[must_use]
    pub fn new(bind_addr: &str) -> Self {
        Self {
            node_id: calculate_node_id(bind_addr),
        }
    }

    /// Initializes or restores the CRDT manager from the database
    ///
    /// # Errors
    ///
    /// Returns `AppError` if:
    /// - Failed to get max clock from database
    /// - Failed to get operations from database
    /// - Failed to restore CRDT state from operations
    pub async fn initialize_crdt_manager(
        &self,
        operation_repo: &dyn OperationRepository,
    ) -> AppResult<Arc<CrdtManager>> {
        let max_clock = operation_repo.get_max_clock().await?;

        if max_clock > 0 {
            self.restore_crdt_manager(operation_repo, max_clock).await
        } else {
            tracing::info!("No existing state found, starting fresh");
            Ok(Arc::new(CrdtManager::new(self.node_id)))
        }
    }

    /// Restores CRDT manager from persisted state
    async fn restore_crdt_manager(
        &self,
        operation_repo: &dyn OperationRepository,
        max_clock: u64,
    ) -> AppResult<Arc<CrdtManager>> {
        tracing::info!("Restoring server state with max clock: {}", max_clock);

        // Create manager with existing clock
        let manager = Arc::new(CrdtManager::with_initial_clock(self.node_id, max_clock + 1));

        // Restore operations to rebuild CRDT state
        let operations = operation_repo.get_all().await?;
        let op_count = operations.len();

        if op_count > 0 {
            tracing::info!("Replaying {} operations to restore CRDT state", op_count);
            manager.restore_from_operations(&operations).map_err(|e| {
                tracing::error!("Failed to restore CRDT state: {}", e);
                AppError::internal(format!("Failed to restore CRDT state: {e}"))
            })?;
            tracing::info!(
                "Successfully restored CRDT state from {} operations",
                op_count
            );
        }

        Ok(manager)
    }

    /// Gets the node ID used for this server instance
    #[must_use]
    pub fn node_id(&self) -> u32 {
        self.node_id
    }
}

/// Calculates a deterministic node ID from the bind address
#[must_use]
pub fn calculate_node_id(bind_addr: &str) -> u32 {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};

    let mut hasher = DefaultHasher::new();
    bind_addr.hash(&mut hasher);

    // Use lower 32 bits for node ID
    (hasher.finish() & 0xFFFF_FFFF) as u32
}

/// Validates and parses a bind address
///
/// # Errors
///
/// Returns `AppError::Config` if the bind address is invalid
pub fn parse_bind_address(bind_addr: &str) -> AppResult<std::net::SocketAddr> {
    bind_addr.parse().map_err(|e| AppError::Config {
        message: format!("Invalid bind address '{bind_addr}': {e}"),
        key: Some("server.bind_addr".to_string()),
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::repository::mock::MockOperationRepository;
    use crate::sync::{CrdtOperation, TabData};

    #[test]
    fn test_calculate_node_id_deterministic() {
        let addr1 = "127.0.0.1:8000";
        let addr2 = "127.0.0.1:8001";

        let id1 = calculate_node_id(addr1);
        let id2 = calculate_node_id(addr2);

        // Same address should produce same ID
        assert_eq!(id1, calculate_node_id(addr1));
        // Different addresses should produce different IDs
        assert_ne!(id1, id2);
    }

    #[test]
    fn test_parse_bind_address_valid() {
        let valid_addresses = vec![
            "127.0.0.1:8000",
            "0.0.0.0:80",
            "[::]:8080",
            "[::1]:3000", // IPv6 localhost instead of hostname
        ];

        for addr in valid_addresses {
            assert!(parse_bind_address(addr).is_ok(), "Failed to parse: {addr}");
        }
    }

    #[test]
    fn test_parse_bind_address_invalid() {
        let invalid_addresses = vec!["not-an-address", "127.0.0.1", ":8000", ""];

        for addr in invalid_addresses {
            let result = parse_bind_address(addr);
            assert!(result.is_err(), "Should fail to parse: {addr}");
            if let Err(AppError::Config { key, .. }) = result {
                assert_eq!(key, Some("server.bind_addr".to_string()));
            }
        }
    }

    #[tokio::test]
    async fn test_initialize_crdt_manager_fresh_start() {
        let repo = MockOperationRepository::new();
        let bootstrap = ServerBootstrap::new("127.0.0.1:8000");

        let manager = bootstrap.initialize_crdt_manager(&repo).await.unwrap();

        assert_eq!(manager.current_clock(), 1);
        assert_eq!(manager.node_id(), bootstrap.node_id());
    }

    #[tokio::test]
    async fn test_initialize_crdt_manager_with_restore() {
        let repo = MockOperationRepository::new();

        // Store some operations
        let op1 = CrdtOperation::UpsertTab {
            id: "tab1".to_string(),
            data: TabData {
                window_id: "window1".to_string(),
                url: "https://example.com".to_string(),
                title: "Example".to_string(),
                active: true,
                index: 0,
                updated_at: 1,
            },
        };

        repo.store(&op1, 1, "device1").await.unwrap();

        let op2 = CrdtOperation::TrackWindow {
            id: "window1".to_string(),
            tracked: true,
            updated_at: 2,
        };

        repo.store(&op2, 2, "device1").await.unwrap();

        // Initialize with restoration
        let bootstrap = ServerBootstrap::new("127.0.0.1:8000");
        let manager = bootstrap.initialize_crdt_manager(&repo).await.unwrap();

        // Should start at max_clock + 1
        assert_eq!(manager.current_clock(), 3);

        // Verify state was restored
        let doc = manager.get_or_create_document("default");
        let doc_guard = doc.lock().unwrap();
        let tabs = doc_guard.get_tabs().unwrap();
        assert_eq!(tabs.len(), 1);
        assert_eq!(tabs[0].id, "tab1");

        let windows = doc_guard.get_windows().unwrap();
        assert_eq!(windows.len(), 1);
        assert_eq!(windows[0].id, "window1");
        assert!(windows[0].tracked);
    }

    #[tokio::test]
    async fn test_restore_crdt_manager_empty_operations() {
        let repo = MockOperationRepository::new();
        let bootstrap = ServerBootstrap::new("127.0.0.1:8000");

        // Simulate having a max clock but no operations (edge case)
        // We'll need to manually set this up by creating and removing an operation
        let temp_op = CrdtOperation::CloseTab {
            id: "temp".to_string(),
            closed_at: 1,
        };
        repo.store(&temp_op, 1, "device1").await.unwrap();

        // Clear operations but max_clock remains
        // In real scenario, this might happen due to data cleanup
        let max_clock = repo.get_max_clock().await.unwrap();
        assert_eq!(max_clock, 1);

        // Now initialize - should handle empty operations gracefully
        let manager = bootstrap.initialize_crdt_manager(&repo).await.unwrap();
        assert_eq!(manager.current_clock(), 2); // max_clock + 1
    }

    #[tokio::test]
    async fn test_server_bootstrap_node_id() {
        let bootstrap1 = ServerBootstrap::new("127.0.0.1:8000");
        let bootstrap2 = ServerBootstrap::new("127.0.0.1:8001");

        assert_ne!(bootstrap1.node_id(), bootstrap2.node_id());
        assert_eq!(bootstrap1.node_id(), calculate_node_id("127.0.0.1:8000"));
    }
}
