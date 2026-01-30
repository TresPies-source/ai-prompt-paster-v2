
# Zenflow Implementation Prompt: AI Prompt Paster v0.0.2

**Goal:** Implement all P0, P1, and P2 features for the AI Prompt Paster v0.0.2 release. This involves adding version history, prompt templates, a preview/test mode, export/import functionality, and basic analytics.

**Context:** This prompt follows the roadmap and technical analysis outlined in the v0.0.2 planning documents. The implementation should follow a backend-first approach, ensuring data models and services are updated before frontend components are built.

**Repository:** `TresPies-source/ai-prompt-paster-v2`

**Supporting Documents:**
- `docs/v0.0.2/ROADMAP.md`
- `docs/v0.0.2/GAP_ANALYSIS.md`
- `docs/v0.0.2/RESEARCH.md`

---

## Phase 1: Backend - Data Models & Core Services (P0, P1, P2)

**Objective:** Update the core data structures and services to support all new v0.0.2 features. This is the foundational phase.

### 1.1. Update Data Model (`src/types/prompt.ts`)

Modify the `Prompt` interface to include fields for versioning, templates, and analytics.

```typescript
// src/types/prompt.ts

export interface Prompt {
  id: string;
  title: string;
  content: string;
  tags: string[];
  folderPath: string;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601

  // v0.0.2 additions
  isTemplate?: boolean; // For Prompt Templates
  variables?: string[]; // For Prompt Templates
  viewCount?: number; // For Basic Analytics
  lastUsedAt?: string; // For Basic Analytics, ISO 8601
  version?: number; // Simple integer version
}
```

### 1.2. Enhance Drive Client (`src/services/drive/driveClient.ts`)

Add methods to interact with the Google Drive Revisions API for version history.

- **`getRevisions(fileId: string)`**: Implement a method to list all revisions for a given file ID using `drive.revisions.list`.
- **`getRevisionContent(fileId: string, revisionId: string)`**: Implement a method to get the content of a specific revision using `drive.revisions.get` with `alt: 'media'`.
- **Note:** We will not implement `restore` functionality directly. Instead, we will fetch the old content and create a *new* version with it, preserving history.

### 1.3. Update Prompt Service (`src/services/drive/promptService.ts`)

This is the most significant part of Phase 1. Update the `promptService` to handle all new business logic.

- **Modify `updatePrompt`:**
  - When updating a prompt, increment a `version` number in the prompt's JSON content before saving.
  - Ensure `updatedAt` is always set to the current timestamp.
- **Add Template Methods:**
  - `saveAsTemplate(promptId: string)`: A method that sets `isTemplate: true` and extracts `{{variables}}` into the `variables` array.
  - `createFromTemplate(templateId: string, variableValues: Record<string, string>)`: A method that fetches a template, substitutes the variables, and creates a new prompt instance.
- **Add Analytics Methods:**
  - `trackPromptView(promptId: string)`: A method that increments `viewCount` and updates `lastUsedAt`.
- **Add Version History Methods:**
  - `getPromptHistory(promptId: string)`: A method that uses `driveClient.getRevisions` to get the revision history.
  - `getPromptVersion(promptId:string, revisionId: string)`: A method that fetches a specific version's content.
- **Add Export/Import Methods:**
  - `exportPrompts(promptIds: string[], format: 'json' | 'markdown')`: A method to generate a downloadable file for selected prompts.
  - `importPrompts(file: File)`: A method to parse an uploaded JSON or Markdown file and create new prompts.

---

## Phase 2: Backend - API Routes (P0, P1, P2)

**Objective:** Expose the new service-layer functionality via secure API endpoints.

- **`GET /api/drive/prompts/[id]/history`**: Create a new route that calls `promptService.getPromptHistory`.
- **`GET /api/drive/prompts/[id]/version/[revisionId]`**: Create a new route that calls `promptService.getPromptVersion`.
- **`POST /api/drive/prompts/[id]/track-view`**: Create a new route that calls `promptService.trackPromptView`.
- **`POST /api/drive/prompts/export`**: Create a new route that calls `promptService.exportPrompts`.
- **`POST /api/drive/prompts/import`**: Create a new route that handles file uploads and calls `promptService.importPrompts`.
- **`POST /api/drive/prompts/[id]/save-as-template`**: Create a new route for saving a prompt as a template.

---

## Phase 3: Frontend - Version History & Templates (P0)

**Objective:** Implement the UI for the highest-priority v0.0.2 features.

### 3.1. Version History UI

- **`PromptDetailModal.tsx`**: Add a "History" button.
- **New Component: `VersionHistoryModal.tsx`**:
  - On open, fetches and displays a list of versions from the `/api/drive/prompts/[id]/history` endpoint.
  - Each item should show the version number and timestamp.
- **New Component: `DiffViewer.tsx`**:
  - When a user selects two versions, fetch their content and display a side-by-side diff (use `react-diff-viewer`).
  - Add a "Restore this version" button that copies the old content into the current editor, creating a new version upon saving.

### 3.2. Prompt Templates UI

- **`PromptDetailModal.tsx`**: Add a "Save as Template" button that calls the new API endpoint.
- **`Paster.tsx` / `Composer.tsx`**: Add a "Start from Template" button.
- **New Component: `TemplateLibraryModal.tsx`**:
  - Fetches and displays all prompts where `isTemplate: true`.
  - On selection, it should either load the template into the Composer or prompt the user to fill in variables.
- **New Component: `VariableInputForm.tsx`**:
  - If a template has variables, this form should appear to let the user fill them in before creating the new prompt.

---

## Phase 4: Frontend - Paster Preview & Export/Import (P1)

**Objective:** Implement the UI for the high-impact P1 features.

### 4.1. Paster Preview & Test Mode

- **Refactor `Paster.tsx`**:
  - Introduce a `previewMode` state.
  - After content is pasted and analyzed by `aiService`, don't save immediately. Instead, populate the title, tags, and folder suggestions into editable input fields.
  - Add a "Regenerate" button that re-runs `aiService.analyzeContent`.
  - The "Save" button will now commit the (potentially user-modified) suggestions.

### 4.2. Export/Import UI

- **`LibraryLayout.tsx`**: Add "Export" and "Import" buttons to the main toolbar/menu.
- **New Component: `ExportDialog.tsx`**:
  - Allows user to select prompts (or "all") and choose a format (JSON, Markdown).
  - Calls the `/api/drive/prompts/export` endpoint and triggers a file download.
- **New Component: `ImportDialog.tsx`**:
  - Provides a file upload input.
  - Calls the `/api/drive/prompts/import` endpoint and shows a success/error message.

---

## Phase 5: Frontend - Analytics & UI Polish (P2)

**Objective:** Implement the remaining P2 features and polish the UI.

- **`LibraryLayout.tsx`**: 
  - Create two new dynamic sections: "Most Used" and "Recently Used."
  - Fetch prompts and sort them based on `viewCount` and `lastUsedAt` respectively.
- **`PromptCard.tsx`**: Display the `viewCount` and `lastUsedAt` metadata subtly on the prompt card.
- **`PromptDetailModal.tsx`**: Ensure the `trackPromptView` API is called every time this modal is opened.

---

## Phase 6: Finalization

**Objective:** Ensure the release is stable, documented, and ready for deployment.

1.  **Code Review & Refactoring:** Clean up any technical debt introduced during development.
2.  **Testing:** Manually test all new features in a local environment. Verify all P0, P1, and P2 features work as expected.
3.  **Documentation:** Update `README.md` and any other relevant user-facing documentation to reflect the new features.
4.  **Final Build:** Run `npm run lint` and `npm run build` to ensure there are no errors or warnings.

This structured, multi-phase prompt ensures that all v0.0.2 features are implemented logically, starting with the backend foundation and progressively building the frontend UI. Good luck!
