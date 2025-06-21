#!/bin/bash

PROJECT_ROOT=$(git rev-parse --show-toplevel)

cd "$PROJECT_ROOT/server" || exit

TS_RS_EXPORT_DIR="$PROJECT_ROOT/extension/src/api/models/generated" cargo test
