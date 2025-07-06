-- Initial schema for Tanaka server
-- Creates tables for CRDT operations and CRDT state

-- CRDT operations table
-- Stores all CRDT operations with monotonic clock for ordering
CREATE TABLE IF NOT EXISTS crdt_operations (
    id TEXT PRIMARY KEY,
    clock INTEGER NOT NULL,
    device_id TEXT NOT NULL,
    operation_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    operation_data TEXT NOT NULL,
    created_at INTEGER NOT NULL
);

-- CRDT state table
-- Stores the current materialized state for each entity
CREATE TABLE IF NOT EXISTS crdt_state (
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    current_data TEXT NOT NULL,
    last_clock INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    PRIMARY KEY (entity_type, entity_id)
);

-- Indexes for optimal query performance

-- CRDT Operations indexes (optimized for sync queries)
CREATE INDEX IF NOT EXISTS idx_crdt_operations_clock ON crdt_operations(clock);
CREATE INDEX IF NOT EXISTS idx_crdt_operations_device_clock ON crdt_operations(device_id, clock);
CREATE INDEX IF NOT EXISTS idx_crdt_operations_target ON crdt_operations(target_id);
CREATE INDEX IF NOT EXISTS idx_crdt_operations_type_target ON crdt_operations(operation_type, target_id);

-- CRDT State indexes (optimized for entity lookups)
CREATE INDEX IF NOT EXISTS idx_crdt_state_type ON crdt_state(entity_type);
