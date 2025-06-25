# Tanaka Development Makefile

.PHONY: help
help:
	@echo "Available commands:"
	@echo "  make setup         - Install development prerequisites"
	@echo "  make setup-dry-run - Show what setup would do without making changes"
	@echo "  make lint          - Run all linters"
	@echo "  make lint-md       - Lint markdown files"
	@echo "  make lint-python   - Lint Python scripts"
	@echo "  make format        - Fix all formatting issues"
	@echo "  make gen-api-models - Generate TypeScript API models from Rust"

.PHONY: setup
setup:
	@uv run scripts/setup.py

.PHONY: setup-dry-run
setup-dry-run:
	@uv run scripts/setup.py --dry-run

.PHONY: lint-md
lint-md:
	@uv run pymarkdown scan *.md docs/*.md -x repomix-output.txt.md -x 'docs/MIGRATION*.md' -x docs/TESTING-UPGRADE.md

.PHONY: lint-md-fix
lint-md-fix:
	@uv run pymarkdown fix *.md docs/*.md -x repomix-output.txt.md -x 'docs/MIGRATION*.md' -x docs/TESTING-UPGRADE.md

.PHONY: lint-python
lint-python:
	@uv run ruff check scripts/
	@uv run black --check scripts/

.PHONY: lint-python-fix
lint-python-fix:
	@uv run ruff check scripts/ --fix
	@uv run black scripts/

.PHONY: lint
lint: lint-md lint-python

.PHONY: format
format: lint-md-fix lint-python-fix

.PHONY: gen-api-models
gen-api-models:
	@cd server && ./scripts/generate-api-models.sh