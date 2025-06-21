use tanaka_server::models::{SyncRequest, SyncResponse, Tab};
use ts_rs::TS;

fn main() {
    println!("Generating TypeScript types...");

    Tab::export().expect("Failed to export Tab");
    SyncRequest::export().expect("Failed to export SyncRequest");
    SyncResponse::export().expect("Failed to export SyncResponse");

    println!("TypeScript types generated successfully!");
}
