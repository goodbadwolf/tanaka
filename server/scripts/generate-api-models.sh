#!/bin/bash

source "$(dirname "$0")/utils.sh"

PROJECT_ROOT=$(get_project_root)

cd "$PROJECT_ROOT/server" || exit

# Check if src/models.rs is newer than the generated model files
SENTINEL_FILE="$PROJECT_ROOT/extension/src/api/models/generated/Tab.ts"
ARE_GENREATED_MODELS_STALE=false
if [ ! -f "$SENTINEL_FILE" ] || [ "$PROJECT_ROOT/server/src/models.rs" -nt "$PROJECT_ROOT/extension/src/api/models/generated/Tab.ts" ]; then
    ARE_GENREATED_MODELS_STALE=true
fi

if [ "$ARE_GENREATED_MODELS_STALE" = false ]; then
    echo "✅ Generated model files are up-to-date"
    exit 0
fi

SENTINEL_FILE_TIMESTAMP=$(get_file_timestamp "$SENTINEL_FILE")
MODEL_FILE_TIMESTAMP=$(get_file_timestamp "$PROJECT_ROOT/server/src/models.rs")
SENTINEL_FILE_DATE=$(timestamp_to_date "$SENTINEL_FILE_TIMESTAMP")
MODEL_FILE_DATE=$(timestamp_to_date "$MODEL_FILE_TIMESTAMP")

echo "⚠️  Generated model files are stale. Regenerating..."
echo "🔄 Generated model file date: $SENTINEL_FILE_DATE"
echo "🔄 Model file date: $MODEL_FILE_DATE"

echo "⚠️  Removing previous model files, if any..."
rm -f "$PROJECT_ROOT/extension/src/api/models/generated/*.ts"

echo "📝 Generating model files..."
if ! TS_RS_EXPORT_DIR="$PROJECT_ROOT/extension/src/api/models/generated" cargo test; then
    echo "❌ Failed to generate model files"
    exit 1
fi

echo "✅ Generated model files"
