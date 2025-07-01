use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Debug, Serialize, Deserialize, TS)]
#[ts(
    export,
    export_to = "../../extension/src/api/models/",
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
#[ts(
    export,
    export_to = "../../extension/src/api/models/",
    rename_all = "camelCase"
)]
pub struct SyncRequest {
    pub tabs: Vec<Tab>,
}

#[derive(Debug, Serialize, TS)]
#[ts(
    export,
    export_to = "../../extension/src/api/models/",
    rename_all = "camelCase"
)]
pub struct SyncResponse {
    pub tabs: Vec<Tab>,
}
