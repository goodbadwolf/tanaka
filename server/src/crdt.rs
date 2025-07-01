use dashmap::DashMap;
use serde::{Deserialize, Serialize};
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;
use thiserror::Error;
use yrs::{Doc, Map, MapRef, Transact, Update};

use crate::error::{AppError, AppResult};

#[derive(Error, Debug)]
pub enum CrdtError {
    #[error("Failed to decode CRDT update: {0}")]
    DecodeError(String),

    #[error("Failed to apply CRDT update: {0}")]
    ApplyError(String),

    #[error("Document not found: {0}")]
    DocumentNotFound(String),

    #[error("Invalid document state")]
    InvalidState,
}

impl From<CrdtError> for AppError {
    fn from(err: CrdtError) -> Self {
        AppError::Sync {
            message: err.to_string(),
            context: std::collections::HashMap::new(),
        }
    }
}

pub struct LamportClock {
    value: AtomicU64,
    node_id: u32,
}

impl LamportClock {
    pub fn new(node_id: u32) -> Self {
        Self {
            value: AtomicU64::new(1),
            node_id,
        }
    }

    pub fn tick(&self) -> u64 {
        self.value.fetch_add(1, Ordering::SeqCst)
    }

    pub fn update(&self, received_clock: u64) -> u64 {
        let current = self.value.load(Ordering::SeqCst);
        let new_value = received_clock.max(current) + 1;
        self.value.store(new_value, Ordering::SeqCst);
        new_value
    }

    pub fn current(&self) -> u64 {
        self.value.load(Ordering::SeqCst)
    }

    pub fn node_id(&self) -> u32 {
        self.node_id
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CrdtTab {
    pub id: String,
    pub window_id: String,
    pub url: String,
    pub title: String,
    pub active: bool,
    pub index: i32,
    pub updated_at: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CrdtWindow {
    pub id: String,
    pub tracked: bool,
    pub tab_count: u32,
    pub updated_at: u64,
}

pub struct CrdtDocument {
    doc: Doc,
    tabs_map: MapRef,
    windows_map: MapRef,
}

impl CrdtDocument {
    pub fn new() -> Self {
        let doc = Doc::new();
        let tabs_map = doc.get_or_insert_map("tabs");
        let windows_map = doc.get_or_insert_map("windows");

        Self {
            doc,
            tabs_map,
            windows_map,
        }
    }

    pub fn from_state(state: &[u8]) -> Result<Self, CrdtError> {
        let doc = Doc::new();

        let update = Update::decode_v1(state)
            .map_err(|e| CrdtError::DecodeError(format!("Invalid update format: {e}")))?;

        {
            let mut txn = doc.transact_mut();
            txn.apply_update(update)
                .map_err(|e| CrdtError::ApplyError(format!("Failed to apply update: {e}")))?;
        }

        let tabs_map = doc.get_or_insert_map("tabs");
        let windows_map = doc.get_or_insert_map("windows");

        Ok(Self {
            doc,
            tabs_map,
            windows_map,
        })
    }

    pub fn apply_update(&mut self, update: &[u8]) -> Result<(), CrdtError> {
        let update = Update::decode_v1(update)
            .map_err(|e| CrdtError::DecodeError(format!("Invalid update format: {e}")))?;

        let mut txn = self.doc.transact_mut();
        txn.apply_update(update)
            .map_err(|e| CrdtError::ApplyError(format!("Failed to apply update: {e}")))?;

        Ok(())
    }

    pub fn encode_state(&self) -> Vec<u8> {
        let txn = self.doc.transact();
        txn.encode_state_as_update_v1(&yrs::StateVector::default())
    }

    pub fn encode_diff_since(&self, state_vector: &yrs::StateVector) -> Vec<u8> {
        let txn = self.doc.transact();
        txn.encode_diff_v1(state_vector)
    }

    pub fn state_vector(&self) -> yrs::StateVector {
        let txn = self.doc.transact();
        txn.state_vector()
    }

    pub fn upsert_tab(&mut self, tab: &CrdtTab) -> Result<(), CrdtError> {
        let mut txn = self.doc.transact_mut();

        let tab_json = serde_json::to_value(tab)
            .map_err(|e| CrdtError::InvalidState)?;

        self.tabs_map.insert(&mut txn, &tab.id, tab_json);
        Ok(())
    }

    pub fn remove_tab(&mut self, tab_id: &str) -> Result<(), CrdtError> {
        let mut txn = self.doc.transact_mut();
        self.tabs_map.remove(&mut txn, tab_id);
        Ok(())
    }

    pub fn upsert_window(&mut self, window: &CrdtWindow) -> Result<(), CrdtError> {
        let mut txn = self.doc.transact_mut();

        let window_json = serde_json::to_value(window)
            .map_err(|e| CrdtError::InvalidState)?;

        self.windows_map.insert(&mut txn, &window.id, window_json);
        Ok(())
    }

    pub fn get_tabs(&self) -> Result<Vec<CrdtTab>, CrdtError> {
        let txn = self.doc.transact();
        let mut tabs = Vec::new();

        for (_, value) in self.tabs_map.iter(&txn) {
            if let Ok(tab) = serde_json::from_value::<CrdtTab>(value.clone()) {
                tabs.push(tab);
            }
        }

        tabs.sort_by(|a, b| a.updated_at.cmp(&b.updated_at));
        Ok(tabs)
    }

    pub fn get_windows(&self) -> Result<Vec<CrdtWindow>, CrdtError> {
        let txn = self.doc.transact();
        let mut windows = Vec::new();

        for (_, value) in self.windows_map.iter(&txn) {
            if let Ok(window) = serde_json::from_value::<CrdtWindow>(value.clone()) {
                windows.push(window);
            }
        }

        windows.sort_by(|a, b| a.updated_at.cmp(&b.updated_at));
        Ok(windows)
    }
}

impl Default for CrdtDocument {
    fn default() -> Self {
        Self::new()
    }
}

pub struct CrdtManager {
    documents: DashMap<String, Arc<std::sync::Mutex<CrdtDocument>>>,
    clock: LamportClock,
}

impl CrdtManager {
    pub fn new(node_id: u32) -> Self {
        Self {
            documents: DashMap::new(),
            clock: LamportClock::new(node_id),
        }
    }

    pub fn get_or_create_document(&self, doc_id: &str) -> Arc<std::sync::Mutex<CrdtDocument>> {
        self.documents
            .entry(doc_id.to_string())
            .or_insert_with(|| Arc::new(std::sync::Mutex::new(CrdtDocument::new())))
            .clone()
    }

    pub fn load_document(&self, doc_id: &str, state: &[u8]) -> Result<(), CrdtError> {
        let doc = CrdtDocument::from_state(state)?;
        self.documents.insert(doc_id.to_string(), Arc::new(std::sync::Mutex::new(doc)));
        Ok(())
    }

    pub fn apply_update(&self, doc_id: &str, update: &[u8]) -> AppResult<Vec<u8>> {
        let doc_ref = self.get_or_create_document(doc_id);
        let mut doc = doc_ref.lock().unwrap();

        doc.apply_update(update)?;

        let new_clock = self.clock.tick();
        tracing::debug!(
            doc_id = doc_id,
            update_size = update.len(),
            clock = new_clock,
            "Applied CRDT update"
        );

        Ok(doc.encode_state())
    }

    pub fn get_updates_since(&self, doc_id: &str, state_vector: &yrs::StateVector) -> AppResult<Vec<u8>> {
        let doc_ref = self.get_or_create_document(doc_id);
        let doc = doc_ref.lock().unwrap();

        let diff = doc.encode_diff_since(state_vector);

        tracing::debug!(
            doc_id = doc_id,
            diff_size = diff.len(),
            "Generated CRDT diff"
        );

        Ok(diff)
    }

    pub fn get_full_state(&self, doc_id: &str) -> AppResult<Vec<u8>> {
        let doc_ref = self.get_or_create_document(doc_id);
        let doc = doc_ref.lock().unwrap();

        Ok(doc.encode_state())
    }

    pub fn current_clock(&self) -> u64 {
        self.clock.current()
    }

    pub fn update_clock(&self, received_clock: u64) -> u64 {
        self.clock.update(received_clock)
    }

    pub fn node_id(&self) -> u32 {
        self.clock.node_id()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_lamport_clock() {
        let clock = LamportClock::new(1);

        assert_eq!(clock.current(), 1);
        assert_eq!(clock.tick(), 1);
        assert_eq!(clock.current(), 2);

        let new_clock = clock.update(5);
        assert_eq!(new_clock, 6);
        assert_eq!(clock.current(), 6);
    }

    #[test]
    fn test_crdt_document() {
        let mut doc = CrdtDocument::new();

        let tab = CrdtTab {
            id: "tab1".to_string(),
            window_id: "window1".to_string(),
            url: "https://example.com".to_string(),
            title: "Example".to_string(),
            active: true,
            index: 0,
            updated_at: 1234567890,
        };

        doc.upsert_tab(&tab).unwrap();

        let tabs = doc.get_tabs().unwrap();
        assert_eq!(tabs.len(), 1);
        assert_eq!(tabs[0].id, "tab1");
        assert_eq!(tabs[0].url, "https://example.com");
    }

    #[test]
    fn test_crdt_manager() {
        let manager = CrdtManager::new(1);

        let doc_id = "test-doc";
        let state = manager.get_full_state(doc_id).unwrap();
        assert!(!state.is_empty());

        let clock = manager.current_clock();
        assert_eq!(clock, 1);
    }
}
