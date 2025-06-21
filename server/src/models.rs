use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct Tab {
    pub id: String,
    pub window_id: String,
    pub data: String,
    pub updated_at: i64,
}

#[derive(Debug, Deserialize)]
pub struct SyncRequest {
    pub tabs: Vec<Tab>,
}

#[derive(Debug, Serialize)]
pub struct SyncResponse {
    pub tabs: Vec<Tab>,
}
