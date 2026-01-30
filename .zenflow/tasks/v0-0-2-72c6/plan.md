# v0.0.2 Implementation Plan

## Configuration
- **Artifacts Path**: `.zenflow/tasks/v0-0-2-72c6`
- **Spec Document**: `spec.md`
- **Complexity**: HARD

---

## Workflow Steps

### [x] Step: Technical Specification

Technical specification complete. See `spec.md` for full details.

---

### [x] Step: Phase 1 - Data Models & Core Services (Backend)
<!-- chat-id: f02fcd64-0b40-4444-aa2d-c3089dc9e63d -->

Update data models and core services to support all v0.0.2 features.

**Subtasks:**
- [x] Update `src/types/prompt.ts` with new optional fields (`isTemplate`, `variables`, `viewCount`, `lastUsedAt`, `version`)
- [x] Add new API types to `src/types/api.ts` (PromptRevision, GetHistoryResponse, ExportRequest, ImportRequest, etc.)
- [x] Enhance `src/services/drive/driveClient.ts`:
  - [x] Add `getRevisions(fileId: string)` method
  - [x] Add `getRevisionContent(fileId: string, revisionId: string)` method
- [x] Update `src/services/drive/promptService.ts`:
  - [x] Modify `updatePrompt()` to increment version number
  - [x] Add `getPromptHistory(promptId: string)` method
  - [x] Add `getPromptVersion(promptId: string, revisionId: string)` method
  - [x] Add `saveAsTemplate(promptId: string)` method with variable extraction
  - [x] Add `createFromTemplate(templateId: string, variables)` method
  - [x] Add `trackPromptView(promptId: string)` method
  - [x] Add `exportPrompts(promptIds, format)` method (JSON + Markdown)
  - [x] Add `importPrompts(content, format)` method (JSON + Markdown)

**Verification:**
- [x] TypeScript compiles without errors
- [x] All methods have proper type signatures
- [x] Variable extraction regex tested with sample templates

---

### [x] Step: Phase 2 - API Routes (Backend)
<!-- chat-id: c35e90e8-a6f2-4829-964d-462ce1a74174 -->

Create API endpoints for all new features with proper authentication and error handling.

**Subtasks:**
- [x] Create `src/app/api/drive/prompts/[id]/history/route.ts` (GET - version history)
- [x] Create `src/app/api/drive/prompts/[id]/version/[revisionId]/route.ts` (GET - specific version)
- [x] Create `src/app/api/drive/prompts/[id]/track-view/route.ts` (POST - analytics tracking)
- [x] Create `src/app/api/drive/prompts/[id]/save-as-template/route.ts` (POST - save as template)
- [x] Create `src/app/api/drive/prompts/export/route.ts` (POST - export prompts)
- [x] Create `src/app/api/drive/prompts/import/route.ts` (POST - import prompts)

**Verification:**
- [x] All routes use `getServerSession` for authentication
- [x] Error handling includes 401, 404, 500 responses
- [x] Routes tested with curl or Postman
- [x] TypeScript types match request/response schemas

---

### [x] Step: Phase 3 - Version History UI (P0)
<!-- chat-id: b940ccd0-30d5-46df-9e33-9cada3ec02e8 -->

Implement version history viewing, comparison, and restore functionality.

**Subtasks:**
- [x] Install `react-diff-viewer-continued` dependency
- [x] Create `src/components/library/VersionHistoryModal.tsx`:
  - [x] Fetch and display revision list from `/api/drive/prompts/[id]/history`
  - [x] Show version numbers and timestamps
  - [x] Allow selecting versions for comparison
- [x] Create `src/components/library/DiffViewer.tsx`:
  - [x] Integrate `react-diff-viewer-continued`
  - [x] Side-by-side diff view
  - [x] "Restore this version" button (copies old content to current editor)
- [x] Update `src/components/library/PromptDetailModal.tsx`:
  - [x] Add "History" button in header/footer
  - [x] Open VersionHistoryModal on click

**Verification:**
- [x] Can view version history for edited prompts
- [x] Can compare two versions and see diff
- [x] Can restore old version (creates new version with old content)
- [x] UI is responsive and accessible

---

### [x] Step: Phase 4 - Prompt Templates UI (P0)
<!-- chat-id: 6a913054-ff04-41aa-b194-0f5df42ab9b2 -->

Implement template creation, browsing, and instantiation.

**Subtasks:**
- [x] Create `src/components/library/TemplateLibraryModal.tsx`:
  - [x] Fetch prompts where `isTemplate === true`
  - [x] Display template list with variable indicators
  - [x] Selection UI
- [x] Create `src/components/library/VariableInputForm.tsx`:
  - [x] Parse template variables from `{{variable}}` syntax
  - [x] Render input field for each variable
  - [x] Submit to create prompt from template
- [x] Update `src/components/library/PromptDetailModal.tsx`:
  - [x] Add "Save as Template" button
  - [x] Call `/api/drive/prompts/[id]/save-as-template`
- [x] Update `src/components/paster/Paster.tsx`:
  - [x] Add "Start from Template" button
  - [x] Open TemplateLibraryModal
  - [x] Load template content with variable form
- [x] Update `src/components/composer/Composer.tsx`:
  - [x] Add "Start from Template" option
  - [x] Same template loading flow

**Verification:**
- [x] Can save prompt as template
- [x] Variables detected from `{{variable}}` syntax
- [x] Can browse templates in library
- [x] Can create new prompt from template with variable substitution
- [x] Template variables correctly replaced in final prompt

---

### [x] Step: Phase 5 - Preview & Test Mode (P1)
<!-- chat-id: 87def3e3-dfd1-4e86-afa5-81be7d921e7a -->

Refactor Paster to support preview mode before saving.

**Subtasks:**
- [x] Refactor `src/components/paster/Paster.tsx`:
  - [x] Add `previewMode` state
  - [x] After AI analysis, enter preview mode (don't save immediately)
  - [x] Show AI suggestions in editable fields (title, tags, folder)
  - [x] Add "Regenerate" button to re-run AI analysis
  - [x] Move "Save" action to explicit user confirmation
- [x] Update `src/components/paster/AISuggestions.tsx`:
  - [x] Make fields fully editable
  - [x] Add "Regenerate" functionality
  - [x] Visual indication this is preview mode

**Verification:**
- [x] Content analysis doesn't auto-save
- [x] User can edit all AI suggestions before saving
- [x] "Regenerate" button re-runs analysis
- [x] "Save Prompt" button commits to Drive
- [x] Can cancel/clear without saving

---

### [x] Step: Phase 6 - Export/Import UI (P1)
<!-- chat-id: 5608478c-507e-4c54-a2c0-580999bd06b6 -->

Implement export and import dialogs with format selection.

**Subtasks:**
- [x] Create `src/components/library/ExportDialog.tsx`:
  - [x] Prompt selection UI (single, multiple, all)
  - [x] Format selector (JSON, Markdown)
  - [x] Call `/api/drive/prompts/export`
  - [x] Trigger file download
- [x] Create `src/components/library/ImportDialog.tsx`:
  - [x] File upload input
  - [x] Format detection
  - [x] Preview imported prompts before confirming
  - [x] Call `/api/drive/prompts/import`
  - [x] Show success/error messages
- [x] Update `src/components/library/LibraryLayout.tsx`:
  - [x] Add "Export" button in toolbar
  - [x] Add "Import" button in toolbar
  - [x] Open respective dialogs

**Verification:**
- [x] Can export single prompt as JSON
- [x] Can export multiple prompts as JSON
- [x] Can export prompts as Markdown
- [x] Can import JSON file
- [x] Import validation catches malformed files
- [x] Imported prompts appear in library

---

### [x] Step: Phase 7 - Analytics & UI Polish (P2)
<!-- chat-id: cfe86b09-05f9-4370-9c26-5a2e4dc31b5c -->

Implement basic analytics tracking and display.

**Subtasks:**
- [x] Update `src/components/library/PromptDetailModal.tsx`:
  - [x] Call `/api/drive/prompts/[id]/track-view` on mount
  - [x] Display `viewCount` and `lastUsedAt` in metadata section
- [x] Update `src/components/library/PromptCard.tsx`:
  - [x] Display `viewCount` badge or indicator
  - [x] Display `lastUsedAt` as relative time
- [x] Update `src/components/library/LibraryLayout.tsx`:
  - [x] Add "Most Used" section (sort by `viewCount` desc)
  - [x] Add "Recently Used" section (sort by `lastUsedAt` desc)
  - [x] Add section toggles/filters
- [x] Polish all new components:
  - [x] Consistent styling with existing UI
  - [x] Accessibility (ARIA labels, keyboard navigation)
  - [x] Loading states and error handling
  - [x] Animations with Framer Motion

**Verification:**
- [x] View count increments when prompt viewed
- [x] Last used timestamp updates
- [x] "Most Used" section shows correct prompts
- [x] "Recently Used" section shows correct prompts
- [x] All new UI components match design system
- [x] Accessibility audit passes

---

### [x] Step: Phase 8 - Testing & Finalization
<!-- chat-id: 0273ca73-9966-4329-aa87-81ccddfe22d5 -->

Comprehensive testing and documentation.

**Subtasks:**
- [x] Manual testing checklist:
  - [x] Version history (view, compare, restore)
  - [x] Templates (create, browse, instantiate)
  - [x] Preview mode (analyze, regenerate, save)
  - [x] Export (JSON, Markdown, single, multiple)
  - [x] Import (JSON, validation, errors)
  - [x] Analytics (view tracking, most used, recently used)
  - [x] Backward compatibility (old prompts load correctly)
- [x] Error scenario testing:
  - [x] Google Drive API failures
  - [x] Invalid revision IDs
  - [x] Malformed import files
  - [x] Network offline
  - [x] Concurrent edits
- [x] Run linters and build:
  - [x] `npm run lint` passes
  - [x] `npm run build` succeeds
  - [x] No TypeScript errors
- [x] Write implementation report to `report.md`:
  - [x] What was implemented
  - [x] How it was tested
  - [x] Challenges encountered
  - [x] Known limitations or future improvements

**Verification:**
- [x] All features tested and working
- [x] No regressions in existing features
- [x] Build succeeds
- [x] Report written

---

## Notes

- Each step should be completed in order due to dependencies
- Backend steps (1-2) must complete before frontend steps (3-7)
- Phase 8 is the final validation before marking task complete
- Mark each substep complete as you progress through implementation
