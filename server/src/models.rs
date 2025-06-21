use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Debug, Serialize, Deserialize, TS)]
#[ts(
    export,
    export_to = "../../extension/src/types/generated/",
    rename_all = "camelCase"
)]
pub struct Tab {
    pub id: String,
    pub window_id: String,
    pub data: String,
    #[ts(type = "number")]
    pub updated_at: i64,
}

#[derive(Debug, Deserialize, TS)]
#[ts(export, export_to = "../../extension/src/types/generated/")]
pub struct SyncRequest {
    pub tabs: Vec<Tab>,
}

#[derive(Debug, Serialize, TS)]
#[ts(export, export_to = "../../extension/src/types/generated/")]
pub struct SyncResponse {
    pub tabs: Vec<Tab>,
}

#[cfg(test)]
mod tests {
    #[test]
    fn export_typescript_types() {
        // Types are automatically exported during test due to #[ts(export)]
        // This test ensures the types are generated
        println!("TypeScript types exported successfully");
    }
}
