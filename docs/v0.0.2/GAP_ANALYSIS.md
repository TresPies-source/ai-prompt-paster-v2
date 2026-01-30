# AI Prompt Paster v0.0.2: Gap Analysis & Evolution Opportunities

**Date:** 2026-01-30  
**Purpose:** Identify natural feature evolution paths from v0.0.1 architecture

---

## Current v0.0.1 Architecture Review

### What's Built (Phase 6 Complete)

**Core Services:**
- `aiService.ts` - WebLLM integration with Phi-3-mini
- `driveClient.ts` - Google Drive API wrapper
- `promptService.ts` - CRUD operations for prompts
- `folderService.ts` - Folder management
- `indexedDB.ts` - Local vector storage for embeddings
- `embeddingSync.ts` - Batch embedding generation

**Key Features:**
- AI-powered content analysis (title, tags, folder suggestions)
- Semantic search with vector embeddings
- Notion-inspired Library UI with folders and tags
- Prompt Composer with context-aware suggestions
- Google Drive sync for persistent storage
- Client-side AI processing (privacy-first)

**Quality & Performance:**
- Error boundaries for graceful failure handling
- Accessibility (ARIA labels, keyboard nav, screen reader support)
- Code splitting and lazy loading
- Framer Motion animations
- TypeScript throughout

---

## Natural Evolution Paths (Low-Hanging Fruit)

### 1. Version History (High Impact, Medium Effort)

**Current State:**
- Prompts are stored as single JSON files in Google Drive
- No history of changes
- No way to rollback or compare versions

**Natural Evolution:**
- Google Drive has built-in version history API
- We can leverage `drive.revisions.list()` to retrieve past versions
- UI can show a timeline of changes with diffs
- Rollback is just restoring an older revision

**Implementation Path:**
```typescript
// Already have driveClient.ts, just need to add:
async getRevisions(fileId: string): Promise<Revision[]>
async restoreRevision(fileId: string, revisionId: string): Promise<void>
async compareRevisions(fileId: string, rev1: string, rev2: string): Promise<Diff>
```

**UI Components Needed:**
- `VersionHistory.tsx` - Timeline view of changes
- `DiffViewer.tsx` - Side-by-side comparison
- `RestoreConfirmDialog.tsx` - Rollback confirmation

**Estimated Effort:** 3-5 days

---

### 2. Prompt Templates (High Impact, Low Effort)

**Current State:**
- Users start from blank slate every time
- Composer suggests related prompts, but no templates
- No way to save a prompt as a template

**Natural Evolution:**
- Add a `isTemplate` boolean to prompt metadata
- Create a "Templates" folder in Drive
- Add template variables like `{{variable_name}}`
- Composer can instantiate templates with variable substitution

**Implementation Path:**
```typescript
// Extend existing Prompt type:
interface Prompt {
  // ... existing fields
  isTemplate: boolean;
  variables?: string[]; // ["variable_name", "another_var"]
}

// Add to promptService.ts:
async createFromTemplate(templateId: string, variables: Record<string, string>): Promise<Prompt>
async saveAsTemplate(promptId: string): Promise<Prompt>
```

**UI Components Needed:**
- `TemplateLibrary.tsx` - Browse and select templates
- `VariableInput.tsx` - Fill in template variables
- "Save as Template" button in PromptDetailModal

**Estimated Effort:** 2-3 days

---

### 3. Export/Import (Medium Impact, Low Effort)

**Current State:**
- Prompts locked in Google Drive
- No way to share with others
- No backup mechanism

**Natural Evolution:**
- Export prompts as JSON, Markdown, or CSV
- Import prompts from other tools
- Bulk operations (export all, import multiple)

**Implementation Path:**
```typescript
// Add to promptService.ts:
async exportPrompt(promptId: string, format: 'json' | 'markdown' | 'csv'): Promise<Blob>
async exportAll(format: 'json' | 'markdown' | 'csv'): Promise<Blob>
async importPrompts(file: File): Promise<Prompt[]>
```

**UI Components Needed:**
- `ExportDialog.tsx` - Select format and download
- `ImportDialog.tsx` - Upload file and preview
- Bulk action buttons in Library toolbar

**Estimated Effort:** 2-3 days

---

### 4. Preview/Test Mode (High Impact, Medium Effort)

**Current State:**
- Users paste content → AI analyzes → Save
- No way to test AI suggestions before saving
- No way to regenerate suggestions

**Natural Evolution:**
- Add "Preview" mode in Paster
- Show AI suggestions without saving
- Allow regeneration with different parameters
- "Looks good, save it" confirmation step

**Implementation Path:**
```typescript
// Add to Paster.tsx:
const [previewMode, setPreviewMode] = useState(false);
const [suggestions, setSuggestions] = useState<AIAnalysisResult | null>(null);

// UI flow:
// 1. Paste content
// 2. Click "Analyze" → Preview mode
// 3. Show suggestions (editable)
// 4. Click "Regenerate" or "Save"
```

**UI Components Needed:**
- Update `Paster.tsx` to support preview mode
- Add "Regenerate" button to `AISuggestions.tsx`
- Add parameter controls (temperature, max_tokens)

**Estimated Effort:** 3-4 days

---

### 5. Basic Analytics (Low Impact, Low Effort)

**Current State:**
- No visibility into usage patterns
- Don't know which prompts are used most
- Don't know which tags are popular

**Natural Evolution:**
- Track view count, last used date
- Show "Most Used" and "Recently Used" sections
- Simple stats dashboard

**Implementation Path:**
```typescript
// Extend Prompt type:
interface Prompt {
  // ... existing fields
  viewCount: number;
  lastUsedAt: Date;
  createdAt: Date;
}

// Update promptService.ts:
async incrementViewCount(promptId: string): Promise<void>
async updateLastUsed(promptId: string): Promise<void>
```

**UI Components Needed:**
- `StatsCard.tsx` - Show total prompts, tags, folders
- "Most Used" section in Library
- "Recently Used" section in Library

**Estimated Effort:** 1-2 days

---

### 6. Improved Offline Support (Medium Impact, High Effort)

**Current State:**
- Partial offline support (IndexedDB for embeddings)
- New pastes fail when offline
- No sync queue for pending operations

**Natural Evolution:**
- Queue operations when offline
- Sync when connection restored
- Conflict resolution for concurrent edits

**Implementation Path:**
```typescript
// Create new service: offlineQueue.ts
class OfflineQueue {
  async queueOperation(op: Operation): Promise<void>
  async syncPending(): Promise<void>
  async resolveConflicts(): Promise<void>
}
```

**UI Components Needed:**
- Offline indicator banner
- Sync status indicator
- Conflict resolution dialog

**Estimated Effort:** 5-7 days

---

## Feature Prioritization Matrix

| Feature | Impact | Effort | Priority | Rationale |
|---------|--------|--------|----------|-----------|
| **Version History** | High | Medium | **P0** | Critical gap, high user demand, leverages existing Drive API |
| **Prompt Templates** | High | Low | **P0** | Improves reusability, easy to implement, high value |
| **Export/Import** | Medium | Low | **P1** | Reduces lock-in, easy win, builds trust |
| **Preview/Test Mode** | High | Medium | **P1** | Improves UX, prevents mistakes, natural workflow enhancement |
| **Basic Analytics** | Low | Low | **P2** | Nice-to-have, easy to add, low risk |
| **Improved Offline** | Medium | High | **P3** | Complex, defer to v0.0.3 or later |

---

## Recommended v0.0.2 Scope

### Core Features (Must-Have)

**1. Version History**
- View revision timeline
- Compare versions (diff view)
- Rollback to previous version
- Auto-save on every edit

**2. Prompt Templates**
- Create templates with variables
- Template library (separate from regular prompts)
- Instantiate templates with variable substitution
- Save existing prompts as templates

**3. Export/Import**
- Export single prompt (JSON, Markdown)
- Export all prompts (bulk)
- Import prompts from JSON
- Validation and error handling

### Enhanced Features (Should-Have)

**4. Preview/Test Mode**
- Analyze content without saving
- Regenerate AI suggestions
- Edit suggestions before saving
- Parameter controls (temperature, etc.)

**5. Basic Analytics**
- View count per prompt
- Last used date
- Most used prompts section
- Recently used prompts section

### Deferred Features (Nice-to-Have)

**6. Improved Offline Support** → v0.0.3
**7. Team Collaboration** → v0.1.0 (major release)
**8. API Access** → v0.1.0
**9. Multi-Model Support** → v0.2.0
**10. Mobile App** → v0.3.0

---

## Technical Considerations

### Backward Compatibility
All v0.0.2 features must be backward compatible with v0.0.1 data:
- Existing prompts work without migration
- New fields have sensible defaults
- Version history starts from v0.0.2 forward (no retroactive history)

### Performance Impact
- Version history: Minimal (Drive API handles it)
- Templates: Negligible (just metadata)
- Export/Import: One-time operations, no ongoing cost
- Preview mode: Same as current analysis, just not saving
- Analytics: Minimal (just counters)

### Storage Impact
- Version history: Handled by Google Drive (no extra cost)
- Templates: Same as regular prompts
- Analytics: Tiny metadata additions

### Development Time Estimate
- **Core Features (1-3):** 7-11 days
- **Enhanced Features (4-5):** 4-6 days
- **Testing & Polish:** 3-5 days
- **Documentation:** 2-3 days

**Total:** 16-25 days (3-5 weeks)

---

## Integration with Dojo Genesis

AI Prompt Paster is designed to feed into the Dojo Genesis ecosystem. v0.0.2 features support this vision:

**Version History** → Track prompt evolution for learning
**Templates** → Share proven patterns with community
**Export/Import** → Move prompts between AIPP and Dojo Genesis
**Analytics** → Understand which prompts are most valuable

Future integration points:
- Promote prompts to Dojo Commons
- Import Dojo Seeds as templates
- Sync prompt library with Dojo Genesis knowledge base

---

## Next Steps

1. **Validate scope with user** → Confirm P0 and P1 features
2. **Create detailed specs** → Write technical specs for each feature
3. **Design UI mockups** → Wireframes for new components
4. **Break into Zenflow tasks** → Chunk development into prompts
5. **Implement P0 features first** → Version History + Templates
6. **Test and iterate** → User testing with real data
7. **Deploy v0.0.2** → Staged rollout with monitoring

---

## Conclusion

v0.0.2 represents a natural evolution of v0.0.1, addressing the most critical gaps (version history, templates) while adding high-value features (export/import, preview mode) that improve the user experience without adding complexity.

The proposed scope is achievable in 3-5 weeks and maintains the core philosophy of AI Prompt Paster: a privacy-first, AI-powered, beautiful prompt library for personal use.
