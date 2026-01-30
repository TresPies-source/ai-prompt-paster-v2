# Technical Specification: AI Prompt Paster v0.0.2

**Task ID**: v0-0-2-72c6  
**Date**: 2026-01-30  
**Complexity**: **HARD**

## Complexity Assessment

This task is rated **HARD** due to:

- **Multiple complex features**: Version history, templates, preview mode, export/import, and analytics
- **Google Drive API integration**: Requires new Revisions API endpoints with careful error handling
- **Data model evolution**: Backward-compatible schema changes affecting existing prompts
- **Complex UI components**: Diff viewer, template variable substitution, preview workflows
- **State management**: Multiple new states across components with interdependencies
- **File handling**: Import/export with multiple formats (JSON, Markdown) and validation
- **Analytics tracking**: Event-driven updates requiring careful integration points
- **High-risk changes**: Modifying core services (promptService, driveClient) used throughout the app

---

## 1. Technical Context

### Current Architecture (v0.0.1)

**Tech Stack:**
- Framework: Next.js 14 (App Router)
- Language: TypeScript 5.9
- Styling: Tailwind CSS 4.1
- UI: Framer Motion, Heroicons
- AI: WebLLM (@mlc-ai/web-llm 0.2.80) with Phi-3-mini
- Storage: Google Drive (googleapis 171.0.0)
- Auth: NextAuth 4.24
- Local Storage: IndexedDB (for embeddings)

**Current Services:**
- `driveClient.ts`: Google Drive API wrapper (CRUD operations)
- `promptService.ts`: Business logic for prompts
- `folderService.ts`: Folder management
- `aiService.ts`: WebLLM integration
- `indexedDB.ts`: Vector storage
- `embeddingSync.ts`: Batch embedding generation

**Current Data Model:**
```typescript
interface Prompt {
  id: string;
  title: string;
  content: string;
  tags: string[];
  folderPath: string;
  createdAt: string;
  modifiedAt: string;
  sourceUrl?: string;
}
```

**Missing Dependencies:**
- Diff viewer library (e.g., `react-diff-viewer-continued`)
- UUID library already in package.json (`@types/uuid`)

---

## 2. Implementation Approach

### 2.1. Backend-First Strategy

Following the task requirements, implementation will proceed in phases:

1. **Phase 1: Data Models & Core Services** (Backend)
   - Update Prompt interface with new fields
   - Enhance driveClient with Revisions API methods
   - Update promptService with version, template, analytics, and export/import logic

2. **Phase 2: API Routes** (Backend)
   - Create new API endpoints for history, templates, analytics, export/import
   - Ensure authentication and error handling

3. **Phase 3-5: Frontend Components** (Frontend)
   - Build UI components for each feature
   - Integrate with backend APIs
   - Test user workflows

### 2.2. Backward Compatibility Strategy

All new fields in the Prompt interface will be **optional** to ensure existing prompts continue to work:

```typescript
interface Prompt {
  // Existing fields (required)
  id: string;
  title: string;
  content: string;
  tags: string[];
  folderPath: string;
  createdAt: string;
  modifiedAt: string;
  sourceUrl?: string;
  
  // v0.0.2 additions (all optional)
  isTemplate?: boolean;
  variables?: string[];
  viewCount?: number;
  lastUsedAt?: string;
  version?: number;
}
```

**Migration Strategy:**
- No database migration needed (prompts are JSON files)
- Old prompts: Missing fields default to undefined
- New prompts: Fields populated on creation
- Updated prompts: Fields added incrementally on update

### 2.3. Google Drive Revisions API

Google Drive automatically versions files. We'll leverage:
- `drive.revisions.list(fileId)`: Get all revisions
- `drive.revisions.get(fileId, revisionId, {alt: 'media'})`: Get specific revision content

**Key Considerations:**
- Revisions are auto-created on every `updateFile` call
- We won't implement direct "restore" - instead, fetch old content and create new version
- This preserves history (no data loss)

---

## 3. Source Code Structure Changes

### 3.1. Files to Modify

**Backend Services:**
1. `src/types/prompt.ts`
   - Add new optional fields to Prompt interface
   - Update validation rules if needed

2. `src/services/drive/driveClient.ts`
   - Add `getRevisions(fileId: string): Promise<Revision[]>`
   - Add `getRevisionContent(fileId: string, revisionId: string): Promise<string>`

3. `src/services/drive/promptService.ts`
   - Modify `updatePrompt`: Increment version number
   - Add `getPromptHistory(promptId: string): Promise<PromptRevision[]>`
   - Add `getPromptVersion(promptId: string, revisionId: string): Promise<Prompt>`
   - Add `saveAsTemplate(promptId: string): Promise<Prompt>`
   - Add `createFromTemplate(templateId: string, variables: Record<string, string>): Promise<Prompt>`
   - Add `trackPromptView(promptId: string): Promise<void>`
   - Add `exportPrompts(promptIds: string[], format: 'json' | 'markdown'): Promise<string>`
   - Add `importPrompts(content: string, format: 'json' | 'markdown'): Promise<Prompt[]>`

**API Routes (New Files):**
1. `src/app/api/drive/prompts/[id]/history/route.ts` - GET version history
2. `src/app/api/drive/prompts/[id]/version/[revisionId]/route.ts` - GET specific version
3. `src/app/api/drive/prompts/[id]/track-view/route.ts` - POST analytics tracking
4. `src/app/api/drive/prompts/[id]/save-as-template/route.ts` - POST save as template
5. `src/app/api/drive/prompts/export/route.ts` - POST export prompts
6. `src/app/api/drive/prompts/import/route.ts` - POST import prompts

**API Types:**
1. `src/types/api.ts`
   - Add new request/response types for all new endpoints

**Frontend Components (Modifications):**
1. `src/components/library/PromptDetailModal.tsx`
   - Add "History" button
   - Add "Save as Template" button
   - Call track-view API on mount

2. `src/components/paster/Paster.tsx`
   - Refactor to support preview mode
   - Add "Regenerate" functionality
   - Delay save until user confirms

3. `src/components/library/LibraryLayout.tsx`
   - Add "Most Used" section
   - Add "Recently Used" section
   - Add "Export" and "Import" buttons
   - Add "Start from Template" button

**Frontend Components (New Files):**
1. `src/components/library/VersionHistoryModal.tsx` - Version timeline UI
2. `src/components/library/DiffViewer.tsx` - Side-by-side diff comparison
3. `src/components/library/TemplateLibraryModal.tsx` - Browse templates
4. `src/components/library/VariableInputForm.tsx` - Fill template variables
5. `src/components/library/ExportDialog.tsx` - Export prompts UI
6. `src/components/library/ImportDialog.tsx` - Import prompts UI

### 3.2. Dependencies to Add

**package.json additions:**
```json
{
  "dependencies": {
    "react-diff-viewer-continued": "^3.3.1"
  }
}
```

---

## 4. Data Model / API / Interface Changes

### 4.1. Updated Prompt Interface

```typescript
// src/types/prompt.ts

export interface Prompt {
  id: string;
  title: string;
  content: string;
  tags: string[];
  folderPath: string;
  createdAt: string;
  modifiedAt: string;
  sourceUrl?: string;
  
  // v0.0.2 additions
  isTemplate?: boolean;
  variables?: string[];
  viewCount?: number;
  lastUsedAt?: string;
  version?: number;
}
```

### 4.2. New Types

```typescript
// src/types/api.ts additions

export interface PromptRevision {
  id: string;
  modifiedTime: string;
  version?: number;
}

export interface GetHistoryResponse {
  revisions: PromptRevision[];
}

export interface GetVersionResponse {
  prompt: Prompt;
  revisionId: string;
}

export interface TrackViewRequest {
  // No body needed
}

export interface TrackViewResponse {
  success: boolean;
}

export interface SaveAsTemplateResponse {
  template: Prompt;
}

export interface ExportRequest {
  promptIds: string[];
  format: 'json' | 'markdown';
}

export interface ExportResponse {
  content: string;
  filename: string;
}

export interface ImportRequest {
  content: string;
  format: 'json' | 'markdown';
}

export interface ImportResponse {
  prompts: Prompt[];
  imported: number;
  skipped: number;
}
```

### 4.3. New API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/drive/prompts/[id]/history` | Get revision history |
| GET | `/api/drive/prompts/[id]/version/[revisionId]` | Get specific version |
| POST | `/api/drive/prompts/[id]/track-view` | Track analytics |
| POST | `/api/drive/prompts/[id]/save-as-template` | Save as template |
| POST | `/api/drive/prompts/export` | Export prompts |
| POST | `/api/drive/prompts/import` | Import prompts |

---

## 5. Feature Implementation Details

### 5.1. Version History (P0)

**Backend:**
- `driveClient.getRevisions()`: Wraps `drive.revisions.list()`
- `driveClient.getRevisionContent()`: Wraps `drive.revisions.get()`
- `promptService.getPromptHistory()`: Returns list of revisions with metadata
- `promptService.getPromptVersion()`: Returns full prompt from specific revision

**Frontend:**
- `VersionHistoryModal`: Displays timeline of versions
- `DiffViewer`: Shows side-by-side comparison using `react-diff-viewer-continued`
- "Restore" action: Copies old content into current editor (creates new version on save)

**User Flow:**
1. User opens prompt detail modal
2. Clicks "History" button
3. Sees list of versions with timestamps
4. Selects two versions to compare
5. Views diff in modal
6. Can click "Restore this version" to load old content

### 5.2. Prompt Templates (P0)

**Backend:**
- `promptService.saveAsTemplate()`: Sets `isTemplate: true`, extracts `{{variables}}`
- `promptService.createFromTemplate()`: Substitutes variables, creates new prompt
- Variable extraction: Regex to find `{{variableName}}` patterns

**Frontend:**
- `TemplateLibraryModal`: Shows prompts where `isTemplate === true`
- `VariableInputForm`: Input fields for each variable
- "Save as Template" button in PromptDetailModal
- "Start from Template" button in Paster/Composer

**User Flow:**
1. User creates/opens a prompt
2. Clicks "Save as Template"
3. Variables are auto-detected from `{{variable}}` syntax
4. Template saved with `isTemplate: true`
5. In Paster, click "Start from Template"
6. Select template, fill variables, create new prompt

### 5.3. Preview & Test Mode (P1)

**Backend:**
- No new backend changes needed (uses existing `aiService.analyzeContent`)

**Frontend:**
- Refactor `Paster.tsx` state machine:
  - States: `input` → `preview` → `saved`
  - In `preview`: Show editable suggestions
  - "Regenerate" button re-runs AI analysis
  - "Save" commits to Drive

**User Flow:**
1. User pastes content
2. Clicks "Analyze with AI"
3. Enters preview mode (suggestions shown in editable fields)
4. Can modify title/tags/folder or click "Regenerate"
5. Clicks "Save Prompt" to commit

### 5.4. Export/Import (P1)

**Backend:**
- `promptService.exportPrompts()`: 
  - JSON: `JSON.stringify(prompts, null, 2)`
  - Markdown: Convert each prompt to Markdown format
- `promptService.importPrompts()`:
  - JSON: Parse and validate
  - Markdown: Parse frontmatter + content
  - Create new prompts (don't overwrite)

**Frontend:**
- `ExportDialog`: Select prompts, choose format, download file
- `ImportDialog`: Upload file, preview, confirm import

**User Flow:**
- Export: Select prompts → Choose format → Download
- Import: Upload file → Preview prompts → Confirm → Import

### 5.5. Basic Analytics (P2)

**Backend:**
- `promptService.trackPromptView()`: Increment `viewCount`, update `lastUsedAt`
- Called on specific events (view detail, copy content)

**Frontend:**
- `LibraryLayout`: Add "Most Used" and "Recently Used" sections
- `PromptCard`: Display `viewCount` and `lastUsedAt` metadata
- `PromptDetailModal`: Call track-view API on mount

**User Flow:**
- Automatic: Analytics updated when user views/uses prompts
- Visible: Dashboard shows most/recently used prompts

---

## 6. Verification Approach

### 6.1. Testing Strategy

**Unit-Level Verification:**
- Test each new method in `promptService` and `driveClient`
- Verify variable extraction regex for templates
- Test export/import format conversions

**Integration Testing:**
- Test each API endpoint with curl/Postman
- Verify authentication on all new routes
- Test error handling (missing files, invalid data)

**Manual UI Testing:**
1. **Version History:**
   - Create prompt, edit multiple times
   - View history, compare versions
   - Restore old version
   
2. **Templates:**
   - Create prompt with `{{variables}}`
   - Save as template
   - Create from template, verify substitution
   
3. **Preview Mode:**
   - Paste content, analyze
   - Modify suggestions
   - Regenerate
   - Save
   
4. **Export/Import:**
   - Export single/multiple prompts as JSON
   - Export as Markdown
   - Import JSON file
   - Verify duplicates handled correctly
   
5. **Analytics:**
   - View prompts multiple times
   - Check viewCount increments
   - Verify "Most Used" section

### 6.2. Build & Lint Commands

From `package.json`:
```bash
npm run lint     # ESLint validation
npm run build    # Production build
npm run dev      # Local development
```

**Pre-Deployment Checklist:**
- [ ] `npm run lint` passes with no errors
- [ ] `npm run build` completes successfully
- [ ] All new components render without errors
- [ ] TypeScript compilation succeeds (no type errors)
- [ ] Manual testing of all P0, P1, P2 features
- [ ] Backward compatibility verified (old prompts load)

### 6.3. Error Scenarios to Test

- Google Drive API failures (rate limits, auth expiry)
- Invalid revision IDs
- Malformed import files
- Template with no variables
- Network offline during operations
- Concurrent edits (same prompt, different tabs)

---

## 7. Risks & Mitigation

### 7.1. Risks

1. **Google Drive API Rate Limits**
   - Mitigation: Existing retry logic in driveClient, add caching for revisions

2. **Version History Storage**
   - Mitigation: Google Drive handles it automatically, no extra cost

3. **Backward Compatibility**
   - Mitigation: All new fields optional, validation updated to allow undefined

4. **Large Export Files**
   - Mitigation: Implement pagination/chunking for >100 prompts

5. **Import Conflicts**
   - Mitigation: Never overwrite existing prompts, always create new

### 7.2. Performance Considerations

- **Revisions API**: One additional API call per prompt history view (acceptable)
- **Analytics**: Minimal overhead (counter increment on view)
- **Export**: O(n) operation, but infrequent
- **Templates**: No performance impact (just metadata)

---

## 8. Development Estimate

Based on complexity assessment:

| Phase | Estimated Time |
|-------|---------------|
| Phase 1: Backend (Data Models & Services) | 4-5 days |
| Phase 2: API Routes | 2-3 days |
| Phase 3: Version History UI (P0) | 3-4 days |
| Phase 4: Templates UI (P0) | 2-3 days |
| Phase 5: Preview Mode (P1) | 2-3 days |
| Phase 6: Export/Import (P1) | 2-3 days |
| Phase 7: Analytics (P2) | 1-2 days |
| Testing & Polish | 3-4 days |

**Total: 19-27 days (4-5 weeks)**

---

## 9. Success Criteria

This implementation will be considered complete when:

1. ✅ All P0 features work (Version History, Templates)
2. ✅ All P1 features work (Preview Mode, Export/Import)
3. ✅ All P2 features work (Basic Analytics)
4. ✅ Backward compatibility maintained (v0.0.1 prompts load)
5. ✅ `npm run lint` passes
6. ✅ `npm run build` succeeds
7. ✅ Manual testing checklist complete
8. ✅ No regressions in existing features

---

## 10. Next Steps

After spec approval:
1. Create detailed implementation plan in `plan.md`
2. Break work into phases matching the 6 phases from the task description
3. Implement Phase 1 (Backend) first
4. Progressively build frontend features
5. Test incrementally after each phase
6. Final integration testing and polish
