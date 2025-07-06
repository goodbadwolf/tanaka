-- Revert initial schema for Tanaka server

-- Drop indexes first
DROP INDEX IF EXISTS idx_crdt_state_type;
DROP INDEX IF EXISTS idx_crdt_operations_type_target;
DROP INDEX IF EXISTS idx_crdt_operations_target;
DROP INDEX IF EXISTS idx_crdt_operations_device_clock;
DROP INDEX IF EXISTS idx_crdt_operations_clock;

-- Drop tables
DROP TABLE IF EXISTS crdt_state;
DROP TABLE IF EXISTS crdt_operations;
