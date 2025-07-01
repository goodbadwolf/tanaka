# Tanaka Server Integration Tests

This directory contains integration tests for the Tanaka server's sync endpoint.

## Test Coverage

The `sync_integration.rs` file contains comprehensive tests for the CRDT sync protocol:

1. **Basic Operations**
   - `test_sync_with_empty_operations` - Verifies empty sync requests work correctly
   - `test_sync_with_upsert_tab_operation` - Tests single tab creation

2. **Authentication**
   - `test_sync_unauthorized` - Ensures invalid tokens are rejected

3. **Multi-Device Sync**
   - `test_sync_between_devices` - Verifies operations sync between different devices
   - `test_incremental_sync` - Tests the `since_clock` parameter for efficient syncing

4. **Complex Operations**
   - `test_sync_with_multiple_operation_types` - Tests various CRDT operation types in one request

5. **Error Handling**
   - `test_sync_with_invalid_operation` - Validates operation validation works correctly

## Running Tests

```bash
# Run all integration tests
cargo test --test sync_integration

# Run a specific test
cargo test test_sync_between_devices

# Run with output
cargo test --test sync_integration -- --nocapture
```

## Key Implementation Details

- Tests use an in-memory SQLite database for isolation
- Each test creates its own app instance with auth middleware
- The server properly increments Lamport clocks for each operation
- Device-specific filtering prevents operation echo
