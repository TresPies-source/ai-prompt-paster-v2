# Zenflow Implementation Prompt: AI Prompt Paster v0.0.3

**Goal:** Implement all P0, P1, and P2 features for the AI Prompt Paster v0.0.3 release. This release focuses on transforming the application into an active workbench for prompt engineering by adding systematic evaluation, optimization, and workflow automation features.

**Context:** This prompt follows the roadmap and technical analysis outlined in the v0.0.3 planning documents. The implementation will follow a backend-first approach, building on the v0.0.2 codebase.

**Repository:** `TresPies-source/ai-prompt-paster-v2`

**Supporting Documents:**
- `docs/v0.0.3/ROADMAP.md`
- `docs/v0.0.3/GAP_ANALYSIS.md`
- `docs/v0.0.3/RESEARCH.md`

---

## Phase 1: Backend - Data Models & Core Services (P0, P1, P2)

**Objective:** Evolve the data structures and services to support evaluation, optimization, and workflows.

### 1.1. Update Data Model (`src/types/prompt.ts`)

Modify the `Prompt` interface to include fields for quality metrics and comparison data.

```typescript
// src/types/prompt.ts

export interface Prompt {
  // ... existing v0.0.2 fields

  // v0.0.3 additions
  ratings?: number[]; // Array of 1-5 star ratings
  successCount?: number; // Number of times marked as success
  comparisonIds?: string[]; // IDs of prompts this has been compared against
  winCount?: number; // Number of times this prompt won a comparison
}

// New type for Collections
export interface PromptCollection {
  id: string;
  name: string;
  description: string;
  promptIds: string[]; // Ordered list of prompt IDs
  createdAt: string;
}
```

### 1.2. Enhance AI Service (`src/services/ai/aiService.ts`)

- **`refinePrompt(promptContent: string)`**: Implement a new method that uses a meta-prompt to instruct the local LLM to generate 3-5 improved variations of a given prompt, along with explanations for the changes.

### 1.3. Update Prompt Service (`src/services/drive/promptService.ts`)

- **Add Rating & Success Methods:**
  - `addRating(promptId: string, rating: number)`: Adds a new rating to the `ratings` array.
  - `markAsSuccess(promptId: string)`: Increments the `successCount`.
- **Add Comparison Methods:**
  - `recordComparison(winnerId: string, loserIds: string[])`: Updates the `winCount` for the winner and logs the comparison for all involved prompts.

### 1.4. New Collection Service (`src/services/drive/collectionService.ts`)

- Create a new service to handle all CRUD operations for `PromptCollection` objects. Collections will be stored as separate JSON files in a `/collections` subdirectory in Google Drive.

---

## Phase 2: Backend - API Routes (P0, P1, P2)

**Objective:** Expose the new service-layer functionality via secure API endpoints.

- **`POST /api/ai/refine`**: A new route that takes prompt content and returns AI-generated refinements.
- **`POST /api/drive/prompts/[id]/rate`**: A new route to submit a quality rating.
- **`POST /api/drive/prompts/[id]/mark-success`**: A new route to mark a prompt use as successful.
- **`POST /api/drive/prompts/record-comparison`**: A new route to log the results of a prompt comparison.
- **CRUD endpoints for Collections**: `GET`, `POST`, `PUT`, `DELETE` at `/api/drive/collections`.
- **`POST /api/drive/prompts/[id]/share`**: A new route to generate a shareable, read-only link for a prompt.

---

## Phase 3: Frontend - Evaluation Workbench (P0)

**Objective:** Build the core UI for systematic prompt evaluation and optimization.

### 3.1. New View: `PromptComparisonView.tsx`

- A dedicated page for A/B testing prompts.
- Allows the user to select 2-4 prompts (or prompt versions) from their library.
- Provides a single input text area that feeds all selected prompts.
- Displays the outputs side-by-side.
- Includes a "Vote for Best" button under each output, which calls the `record-comparison` API.

### 3.2. New Modal: `RefinementModal.tsx`

- Triggered by an "Improve" button on the `PromptDetailModal`.
- Calls the `/api/ai/refine` endpoint.
- Displays the suggested variations and their explanations in a clear, easy-to-read format.
- Each suggestion has an "Apply as New Version" button.

---

## Phase 4: Frontend - Workflows & Quality Tracking (P1)

**Objective:** Implement the UI for workflow automation and quality-of-life improvements.

### 4.1. New View: `CollectionBuilder.tsx`

- A drag-and-drop interface for creating and ordering Prompt Collections.
- Users can search their library and add prompts to the collection sequence.
- Saved collections are displayed in a new "Collections" tab in the main library view.

### 4.2. Quality Rating UI

- **`PromptDetailModal.tsx`**: After a prompt is copied or used, display a 5-star rating widget and a "Did this work? (Yes/No)" button.
- **`LibraryLayout.tsx`**: Display the average rating and success rate on each `PromptCard`.
- **Search Filters**: Add the ability to sort and filter the library by `rating` and `successRate`.

### 4.3. Advanced Search & Discovery UI

- **`LibraryLayout.tsx`**: Add a "Find Similar" button to the `PromptDetailModal` that uses vector similarity to suggest related prompts.
- Implement a visual tag cloud component for browsing.
- Add a collapsible folder tree for hierarchical navigation.

---

## Phase 5: Frontend - Sharing & Polish (P2)

**Objective:** Implement the lightweight sharing feature and polish the UI.

- **`PromptDetailModal.tsx`**: Add a "Share" button.
- **New Modal: `ShareDialog.tsx`**:
  - On click, calls the `/api/drive/prompts/[id]/share` endpoint.
  - Displays the generated read-only link with a "Copy Link" button.
  - Includes an option for password protection.
- **New Public Route: `pages/share/[token].tsx`**:
  - A public, unauthenticated page that fetches the shared prompt data.
  - Renders a clean, minimalist, read-only view of the prompt.

---

## Phase 6: Finalization

**Objective:** Ensure the release is stable, documented, and ready for deployment.

1.  **Code Review & Refactoring:** Address any tech debt.
2.  **End-to-End Testing:** Manually test all new P0, P1, and P2 features.
3.  **Documentation:** Update all user-facing documentation.
4.  **Final Build:** Run `npm run lint` and `npm run build` to ensure a clean, production-ready build.

This prompt provides a comprehensive, phased plan to evolve AI Prompt Paster into a true prompt engineering workbench. Good luck!
