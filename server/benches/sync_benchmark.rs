use criterion::{black_box, criterion_group, criterion_main, Criterion};
use tanaka_server::sync::{CrdtOperation, TabData};

fn create_test_operations(count: usize) -> Vec<CrdtOperation> {
    (0..count)
        .map(|i| CrdtOperation::UpsertTab {
            id: format!("tab-{i}"),
            data: TabData {
                window_id: format!("window-{}", i % 10),
                url: format!("https://example.com/page/{i}"),
                title: format!("Page {i}"),
                active: i % 10 == 0,
                index: i32::try_from(i).unwrap_or(i32::MAX),
                updated_at: 1_234_567_890 + i as u64,
            },
        })
        .collect()
}

fn benchmark_operation_serialization(c: &mut Criterion) {
    let operations = create_test_operations(100);

    c.bench_function("serialize 100 CRDT operations", |b| {
        b.iter(|| {
            for op in &operations {
                let _ = black_box(serde_json::to_string(op).unwrap());
            }
        });
    });
}

fn benchmark_operation_deserialization(c: &mut Criterion) {
    let operations = create_test_operations(100);
    let serialized: Vec<String> = operations
        .iter()
        .map(|op| serde_json::to_string(op).unwrap())
        .collect();

    c.bench_function("deserialize 100 CRDT operations", |b| {
        b.iter(|| {
            for json in &serialized {
                let _: CrdtOperation = black_box(serde_json::from_str(json).unwrap());
            }
        });
    });
}

fn benchmark_operation_validation(c: &mut Criterion) {
    let operations = create_test_operations(100);

    c.bench_function("validate 100 CRDT operations", |b| {
        b.iter(|| {
            for op in &operations {
                // Simulate validation logic
                if let CrdtOperation::UpsertTab { id, data } = op {
                    black_box(!id.is_empty());
                    black_box(!data.window_id.is_empty());
                    black_box(!data.url.is_empty());
                }
            }
        });
    });
}

criterion_group!(
    benches,
    benchmark_operation_serialization,
    benchmark_operation_deserialization,
    benchmark_operation_validation
);
criterion_main!(benches);
