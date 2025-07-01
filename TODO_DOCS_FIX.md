# Tanaka Documentation Restructuring Plan

## Executive Summary

The Tanaka project documentation suffers from significant overlap and unclear boundaries between documents. This plan outlines a complete restructuring to create focused, purpose-driven documentation that eliminates redundancy and improves discoverability.

## Current Issues Identified

### 1. **Content Duplication**
- Git practices appear in both CLAUDE.md (lines 80-113, 360-374) and GIT.md
- Pre-commit setup duplicated between CLAUDE.md (lines 141-182) and GIT.md (lines 81-175)
- Setup instructions scattered across README.md, INSTALL.md, and DEV.md
- Configuration references in multiple files (though properly centralized in INSTALL.md)

### 2. **Unfocused Documents**
- DEV.md contains 16 sections mixing architecture, setup, debugging, security, and components
- CLAUDE.md combines AI guidance, git practices, troubleshooting, and project specifics
- No clear audience definition for each document

### 3. **Navigation Problems**
- No consistent navigation between documents
- Missing "start here" guidance for different user types
- Unclear which document serves which purpose

## Proposed New Structure

### Document Purposes

| Document | Purpose | Audience |
|----------|---------|----------|
| README.md | Project landing page with navigation | Everyone |
| docs/GETTING-STARTED.md | End-user installation and setup | Users |
| docs/DEVELOPMENT.md | Developer environment and workflow | Contributors |
| docs/ARCHITECTURE.md | Technical deep dive | Developers needing internals |
| docs/TROUBLESHOOTING.md | Problem solving guide | Users and developers |
| docs/GIT.md | Git conventions and practices | Contributors |
| AI-GUIDE.md | AI assistant guidelines | AI tools |

## Implementation Plan

### Phase 1: Create Core Structure ✅

- [x] Create this TODO_DOCS_FIX.md plan
- [x] Create new documents (ARCHITECTURE.md, GETTING-STARTED.md, DEVELOPMENT.md, TROUBLESHOOTING.md)
- [x] Add navigation headers to all documents

### Phase 2: Content Migration

#### From CLAUDE.md:
- [x] Remove lines 80-113 (git commit practices) → Reference GIT.md
- [x] Remove lines 141-182 (pre-commit setup) → Reference GIT.md  
- [x] Remove lines 360-374 (git best practices) → Reference GIT.md
- [x] Keep AI-specific guidance and coding standards
- [x] Keep as CLAUDE.md (AGENTS.md symlinks to it)

#### From DEV.md:
- [x] Move Section 1 (Architecture) → ARCHITECTURE.md
- [x] Move Sections 2-4 (Setup) → DEVELOPMENT.md
- [x] Move Section 5 (Testing) → DEVELOPMENT.md
- [x] Move Section 7 (Commands) → DEVELOPMENT.md
- [x] Move Sections 11-13 (Debugging/Troubleshooting) → TROUBLESHOOTING.md
- [x] Move Section 14 (GitHub Actions) → DEVELOPMENT.md
- [x] Keep Section 16 (Components) in DEVELOPMENT.md

#### From INSTALL.md:
- [x] Transform into GETTING-STARTED.md
- [x] Focus on end-user installation
- [x] Move developer setup details to DEVELOPMENT.md
- [x] Keep configuration reference

#### From README.md:
- [x] Remove detailed architecture (keep brief overview)
- [x] Remove installation steps (add link)
- [x] Transform into clear landing page
- [x] Add navigation section

### Phase 3: Add Navigation ✅

Each document now includes this header:

```markdown
# [Document Title]

**Purpose**: [One sentence description]
**Audience**: [Target readers]  
**Prerequisites**: [What to read/know first]

## Navigation
- [🏠 Home](../README.md)
- [🚀 Getting Started](GETTING-STARTED.md)
- [💻 Development](DEVELOPMENT.md)
- [🏗️ Architecture](ARCHITECTURE.md)
- [🔧 Troubleshooting](TROUBLESHOOTING.md)
- [📝 Git Guidelines](GIT.md)

---
```

### Phase 4: Cleanup ✅

- [x] Remove all duplicate content from CLAUDE.md
- [x] Update cross-references in new documents
- [x] Verify all internal links
- [x] Ensure no content is lost
- [x] Fix broken links (DEV.md line 152, CLAUDE.md references)

### Phase 5: Validation ✅

- [x] Test user journey: New user installation (GETTING-STARTED.md)
- [x] Test user journey: Developer setup (DEVELOPMENT.md)
- [x] Test user journey: Troubleshooting an issue (TROUBLESHOOTING.md)
- [x] Test user journey: Understanding architecture (ARCHITECTURE.md)
- [x] Verify all documentation paths work correctly

## Content Migration Map

| Current Location | Content | New Location | Action |
|-----------------|---------|--------------|---------|
| CLAUDE.md lines 80-113 | Small logical commits | Remove | Reference GIT.md |
| CLAUDE.md lines 141-182 | Pre-commit hooks | Remove | Reference GIT.md |
| CLAUDE.md lines 360-374 | Git best practices | Remove | Reference GIT.md |
| DEV.md Section 1 | Architecture (lines 7-36) | ARCHITECTURE.md | Move |
| DEV.md Sections 2-4 | Prerequisites & Setup | DEVELOPMENT.md | Move |
| DEV.md Section 5 | Testing (lines 180-220) | DEVELOPMENT.md | Move |
| DEV.md Section 7 | Commands (lines 222-285) | DEVELOPMENT.md | Move |
| DEV.md Sections 11-13 | Debugging & Troubleshooting | TROUBLESHOOTING.md | Move |
| DEV.md Section 14 | GitHub Actions Testing | DEVELOPMENT.md | Move |
| DEV.md Section 16 | Component Library | DEVELOPMENT.md | Keep |
| INSTALL.md | All content | GETTING-STARTED.md | Transform |
| README.md | Architecture details | ARCHITECTURE.md | Move brief version |
| README.md | Installation steps | Remove | Link to GETTING-STARTED.md |

## Expected Outcomes

### Quantitative Improvements
- CLAUDE.md: ~100 lines reduction (removal of git content)
- DEV.md: Split from 1000+ lines into 3 focused documents
- Duplication: 0 (all content in one canonical location)
- Navigation time: Reduced by clear purpose statements

### Qualitative Improvements
- Each document serves one clear audience
- No more searching multiple files for information
- Consistent navigation across all documents
- Easier maintenance with single source of truth

## Progress Tracking

✅ **ALL TASKS COMPLETED**

The documentation restructuring has been successfully completed:
- Eliminated all content duplication
- Created focused documents for specific audiences
- Added consistent navigation across all files
- Preserved all original content
- Fixed all broken links

Last updated: 2025-07-01

## Notes

- Preserve all content during migration (no deletions without explicit mapping)
- Maintain existing file paths in examples and commands
- ~~Update AGENTS.md symlink if CLAUDE.md is renamed~~ CLAUDE.md kept, AGENTS.md remains symlink
- Consider impact on existing bookmarks and external links
- **IMPORTANT**: NEVER delete CLAUDE.md or AGENTS.md symlink - required for AI tools
