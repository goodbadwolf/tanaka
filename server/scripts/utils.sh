#!/bin/bash

is_macosx() {
    if [ "$(uname)" = "Darwin" ]; then
        return 0
    else
        return 1
    fi
}

is_linux() {
    if [ "$(uname)" = "Linux" ]; then
        return 0
    else
        return 1
    fi
}

get_file_timestamp() {
    if [ -f "$1" ]; then
        if is_macosx; then
            stat -f %m "$1"
        else
            stat -c %Y "$1"
        fi
    else
        echo 0
    fi
}

timestamp_to_date() {
    if is_macosx; then
        date -r "$1"
    else
        date -d "@$1"
    fi
}

get_project_root() {
    git rev-parse --show-toplevel || exit 1
}
