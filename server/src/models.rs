use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[cfg_attr(
    feature = "generate-api-models",
    ts(
        export,
        export_to = "../../extension/src/api/models/",
        rename_all = "camelCase"
    )
)]
pub struct Tab {
    pub id: String,
    pub window_id: String,
    pub url: String,
    pub title: String,
    pub active: bool,
    pub index: i64,
    #[ts(type = "number")]
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[cfg_attr(
    feature = "generate-api-models",
    ts(
        export,
        export_to = "../../extension/src/api/models/",
        rename_all = "camelCase"
    )
)]
pub struct Window {
    pub id: String,
    pub tracked: bool,
    pub tab_count: i64,
    #[ts(type = "number")]
    pub updated_at: i64,
}

#[derive(Debug, Deserialize, TS)]
#[cfg_attr(
    feature = "generate-api-models",
    ts(
        export,
        export_to = "../../extension/src/api/models/",
        rename_all = "camelCase"
    )
)]
pub struct SyncRequest {
    pub tabs: Vec<Tab>,
}

#[derive(Debug, Serialize, TS)]
#[cfg_attr(
    feature = "generate-api-models",
    ts(
        export,
        export_to = "../../extension/src/api/models/",
        rename_all = "camelCase"
    )
)]
pub struct SyncResponse {
    pub tabs: Vec<Tab>,
}
