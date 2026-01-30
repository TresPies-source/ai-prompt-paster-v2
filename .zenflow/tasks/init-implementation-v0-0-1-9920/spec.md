# Technical Specification
# AI Prompt Paster v2.0

**Version:** 1.0  
**Date:** 2026-01-30  
**Status:** ✅ APPROVED - Ready for Implementation Planning  
**Based on:** requirements.md, DESIGN.md, IMPLEMENTATION_PLAN.md, IMPLEMENTATION_CLARIFICATIONS.md

---

## 1. Technical Context

### 1.1 Technology Stack

| Layer | Technology | Version | Rationale |
|-------|-----------|---------|-----------|
| **Framework** | Next.js | 14 (App Router) | Modern React framework with excellent performance, built-in routing, server components |
| **Language** | TypeScript | 5.x | Type safety, better developer experience, aligns with modern practices |
| **Styling** | Tailwind CSS | 3.x | Utility-first CSS for rapid development with consistent design |
| **Animations** | Framer Motion | 11.x | Industry-leading animation library for fluid interactions |
| **AI Engine** | WebLLM | Latest | Client-side LLM inference using WebGPU for privacy-first processing |
| **Authentication** | NextAuth.js | 4.x | Standards-based OAuth for Google Drive integration |
| **Storage** | Google Drive API | v3 | Persistent, synced storage with built-in version history |
| **Vector Store** | IndexedDB | Native | Browser-native database for embedding storage and semantic search |

### 1.2 Development Environment

**Node.js:** 18.x or higher  
**Package Manager:** npm  
**Browser Support:** Chrome 113+, Edge 113+, Safari 18+ (WebGPU required)

**Setup Command:**
```bash
npm install && npm install @mlc-ai/web-llm @google-cloud/local-auth @googleapis/drive
```

**Dev Server:**
```bash
npm run dev
```

**Lint/Cleanup:**
```bash
npm run lint
```

### 1.3 External Dependencies

**Google Cloud Services:**
- Google OAuth 2.0 (authentication)
- Google Drive API v3 (storage)

**Required Scopes:**
- `https://www.googleapis.com/auth/drive.appdata` - App-specific folder access
- `https://www.googleapis.com/auth/userinfo.profile` - User identity

**Environment Variables (.env.local):**
```
GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generated with: openssl rand -base64 32>
```

---

## 2. Implementation Approach

### 2.1 Development Strategy

**Backend-First Approach:** Prioritize core functionality and data flows before UI polish.

**Incremental Phases:**
1. **Phase 1:** Project setup + authentication (foundation)
2. **Phase 2:** Google Drive integration (data layer)
3. **Phase 3:** WebLLM integration (AI capabilities)
4. **Phase 4:** Core UI (Paster + Library)
5. **Phase 5:** Advanced features (search + composer)
6. **Phase 6:** Polish + deployment

**Key Principles:**
- Each phase produces working, testable functionality
- Manual testing after each phase completion
- Progressive enhancement (graceful degradation for slow networks/hardware)
- Privacy-first: all AI processing client-side

### 2.2 Architecture Patterns

**Component Architecture:**
- Server Components by default (Next.js 14 App Router)
- Client Components only when needed (interactivity, browser APIs)
- Web Worker for WebLLM to prevent UI blocking

**State Management:**
- React Context for global state (auth, AI engine status)
- Local state for component-specific data
- IndexedDB for persistent client-side data (embeddings, offline cache)

**API Design:**
- Next.js API Routes for server-side operations
- RESTful conventions for Google Drive CRUD
- Error handling with exponential backoff and retries

**Data Flow:**
```
User Input → WebLLM Analysis (Web Worker) → AI Suggestions → 
User Review → Save to Google Drive → Generate Embedding → 
Store in IndexedDB → Update UI
```

---

## 3. Source Code Structure

### 3.1 Project Directory Layout

```
ai-prompt-paster/
├── .env.local                    # Environment variables (gitignored)
├── .gitignore                    # Git ignore patterns
├── package.json                  # Dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── next.config.js                # Next.js configuration
├── public/                       # Static assets
│   └── icons/                    # App icons
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── layout.tsx            # Root layout
│   │   ├── page.tsx              # Landing/auth page
│   │   ├── library/
│   │   │   └── page.tsx          # Library view
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   └── [...nextauth]/route.ts  # NextAuth configuration
│   │   │   └── drive/
│   │   │       ├── prompts/route.ts        # CRUD for prompts
│   │   │       └── folders/route.ts        # Folder operations
│   │   └── globals.css           # Global styles
│   ├── components/               # React components
│   │   ├── auth/
│   │   │   ├── LoginButton.tsx
│   │   │   └── LogoutButton.tsx
│   │   ├── paster/
│   │   │   ├── Paster.tsx        # Main pasting interface
│   │   │   ├── ContentInput.tsx  # Textarea component
│   │   │   └── AISuggestions.tsx # AI-generated suggestions display
│   │   ├── library/
│   │   │   ├── LibraryLayout.tsx # Two-column layout
│   │   │   ├── FolderTree.tsx    # Hierarchical folder sidebar
│   │   │   ├── PromptGrid.tsx    # Card-based prompt display
│   │   │   ├── PromptCard.tsx    # Individual prompt card
│   │   │   └── TagFilter.tsx     # Tag filtering UI
│   │   ├── search/
│   │   │   ├── SearchBar.tsx     # Search interface
│   │   │   └── SearchResults.tsx # Results display
│   │   ├── composer/
│   │   │   ├── Composer.tsx      # Prompt composition UI
│   │   │   ├── EditorPanel.tsx   # Text editor
│   │   │   └── SuggestionsPanel.tsx  # Related prompts sidebar
│   │   └── common/
│   │       ├── LoadingSpinner.tsx
│   │       ├── ErrorMessage.tsx
│   │       └── ProgressBar.tsx
│   ├── services/                 # Business logic services
│   │   ├── drive/
│   │   │   ├── driveClient.ts    # Google Drive API wrapper
│   │   │   ├── promptService.ts  # Prompt CRUD operations
│   │   │   └── folderService.ts  # Folder management
│   │   ├── ai/
│   │   │   ├── webllm.worker.ts  # Web Worker for WebLLM
│   │   │   ├── aiService.ts      # AI service interface
│   │   │   └── embeddings.ts     # Embedding generation/storage
│   │   └── storage/
│   │       └── indexedDB.ts      # IndexedDB operations
│   ├── types/                    # TypeScript type definitions
│   │   ├── prompt.ts             # Prompt data model
│   │   ├── folder.ts             # Folder structure types
│   │   └── api.ts                # API request/response types
│   ├── lib/
│   │   ├── auth.ts               # NextAuth configuration
│   │   └── utils.ts              # Utility functions
│   └── config/
│       ├── constants.ts          # App constants
│       └── prompts.ts            # AI system prompts
└── docs/
    └── v0.0.1/                   # Design documents (existing)
```

### 3.2 Key Files to Create

**Phase 1 (Auth):**
- `src/app/api/auth/[...nextauth]/route.ts` - NextAuth configuration
- `src/lib/auth.ts` - Auth utilities
- `src/app/layout.tsx` - Root layout with auth provider
- `src/app/page.tsx` - Landing page with login
- `src/components/auth/LoginButton.tsx` - Login UI
- `src/components/auth/LogoutButton.tsx` - Logout UI

**Phase 2 (Drive):**
- `src/services/drive/driveClient.ts` - Google Drive API client
- `src/services/drive/promptService.ts` - Prompt CRUD
- `src/services/drive/folderService.ts` - Folder management
- `src/app/api/drive/prompts/route.ts` - Prompts API endpoint
- `src/app/api/drive/folders/route.ts` - Folders API endpoint
- `src/types/prompt.ts` - Prompt type definitions
- `src/types/folder.ts` - Folder type definitions

**Phase 3 (AI):**
- `src/services/ai/webllm.worker.ts` - WebLLM Web Worker
- `src/services/ai/aiService.ts` - AI service interface
- `src/services/ai/embeddings.ts` - Embedding operations
- `src/services/storage/indexedDB.ts` - IndexedDB wrapper
- `src/config/prompts.ts` - System prompts for AI

**Phase 4 (UI):**
- `src/components/paster/Paster.tsx` - Main paster component
- `src/components/paster/ContentInput.tsx` - Textarea
- `src/components/paster/AISuggestions.tsx` - Suggestions display
- `src/app/library/page.tsx` - Library page
- `src/components/library/LibraryLayout.tsx` - Layout
- `src/components/library/FolderTree.tsx` - Folder navigation
- `src/components/library/PromptGrid.tsx` - Prompt grid
- `src/components/library/PromptCard.tsx` - Card component
- `src/components/library/TagFilter.tsx` - Tag filtering

**Phase 5 (Advanced):**
- `src/components/search/SearchBar.tsx` - Search interface
- `src/components/search/SearchResults.tsx` - Results
- `src/components/composer/Composer.tsx` - Composer modal
- `src/components/composer/EditorPanel.tsx` - Editor
- `src/components/composer/SuggestionsPanel.tsx` - Suggestions

---

## 4. Data Model & Interfaces

### 4.1 Prompt Data Model

**Storage Location:** Google Drive `/AI Prompt Paster/prompts/{uuid}.json`

```typescript
interface Prompt {
  id: string;                    // UUID v4
  title: string;                 // Max 200 characters
  content: string;               // Max 50KB
  tags: string[];                // 3-5 recommended, max 10
  folderPath: string;            // e.g., "/Code Snippets/Python/"
  createdAt: string;             // ISO 8601 timestamp
  modifiedAt: string;            // ISO 8601 timestamp
  sourceUrl?: string;            // Optional source reference
}
```

**Validation Rules:**
- `id`: Required, unique, UUID v4 format
- `title`: Required, 1-200 characters
- `content`: Required, max 50KB
- `tags`: Array of strings, max 10 items
- `folderPath`: Required, valid path format
- Timestamps: ISO 8601 format

### 4.2 Folder Metadata

**Storage Location:** Google Drive `/AI Prompt Paster/metadata.json`

```typescript
interface FolderMetadata {
  version: string;               // Schema version
  folders: FolderNode[];         // Hierarchical folder structure
  settings: AppSettings;         // User preferences
  lastSync: string;              // Last sync timestamp
}

interface FolderNode {
  id: string;                    // UUID v4
  name: string;                  // Folder name
  path: string;                  // Full path
  children: FolderNode[];        // Nested folders
  promptCount: number;           // Number of prompts
}

interface AppSettings {
  modelPreference: 'phi-3' | 'llama-3-8b';
  preloadModel: boolean;
  tagFilterMode: 'AND' | 'OR';
}
```

### 4.3 Vector Embeddings

**Storage Location:** IndexedDB (client-side only)

```typescript
interface EmbeddingRecord {
  promptId: string;              // References Prompt.id
  embedding: number[];           // Vector representation
  modelVersion: string;          // Model used for generation
  createdAt: string;             // Generation timestamp
}
```

**IndexedDB Schema:**
- Database: `ai-prompt-paster`
- Store: `embeddings`
- Index: `promptId` (unique)

### 4.4 API Interfaces

**Prompt CRUD API:**

```typescript
// GET /api/drive/prompts
interface ListPromptsRequest {
  folderPath?: string;           // Filter by folder
  tags?: string[];               // Filter by tags
  limit?: number;                // Pagination
  offset?: number;
}

interface ListPromptsResponse {
  prompts: Prompt[];
  total: number;
  hasMore: boolean;
}

// POST /api/drive/prompts
interface CreatePromptRequest {
  title: string;
  content: string;
  tags: string[];
  folderPath: string;
  sourceUrl?: string;
}

interface CreatePromptResponse {
  prompt: Prompt;
}

// PUT /api/drive/prompts/:id
interface UpdatePromptRequest {
  title?: string;
  content?: string;
  tags?: string[];
  folderPath?: string;
}

interface UpdatePromptResponse {
  prompt: Prompt;
}

// DELETE /api/drive/prompts/:id
interface DeletePromptResponse {
  success: boolean;
}
```

**Folder API:**

```typescript
// GET /api/drive/folders
interface ListFoldersResponse {
  folders: FolderNode[];
}

// POST /api/drive/folders
interface CreateFolderRequest {
  name: string;
  parentPath: string;
}

interface CreateFolderResponse {
  folder: FolderNode;
}
```

**AI Service Interface:**

```typescript
interface AIService {
  initialize(): Promise<void>;
  isReady(): boolean;
  generateTitle(content: string): Promise<string>;
  generateTags(content: string): Promise<string[]>;
  suggestFolder(content: string, existingFolders: string[]): Promise<string>;
  generateEmbedding(text: string): Promise<number[]>;
}
```

---

## 5. Delivery Phases & Milestones

### Phase 1: Project Setup & Authentication
**Duration:** 1-2 days  
**Goal:** Working Next.js app with Google OAuth

**Deliverables:**
1. Next.js 14 project initialized with TypeScript, Tailwind, ESLint
2. `.gitignore` configured (node_modules, .env.local, .next, etc.)
3. NextAuth.js configured with Google Provider
4. Environment variables documented
5. Simple landing page with login/logout buttons
6. Session persistence verified

**Verification:**
- `npm run dev` starts dev server successfully
- User can login with Google account
- Session persists across page refreshes
- `npm run lint` passes with no errors

**Manual Setup Required:**
- User creates Google Cloud Project
- User enables Google Drive API
- User creates OAuth 2.0 credentials
- User provides environment variables

---

### Phase 2: Google Drive Integration
**Duration:** 2-3 days  
**Goal:** Backend CRUD operations for prompts in Google Drive

**Deliverables:**
1. Google Drive API client service
2. Prompt CRUD operations (create, read, update, delete)
3. Folder management operations
4. App data folder initialization
5. API routes for prompts and folders
6. Error handling with retry logic
7. TypeScript types for data models

**Verification:**
- API routes respond correctly (test with Postman/curl)
- Prompts can be created, read, updated, deleted via API
- Folders appear correctly in Google Drive at `/AI Prompt Paster/`
- Error handling works (test with network disconnect)
- `npm run lint` passes

**Test Cases:**
- Create prompt → verify JSON file in Drive
- List prompts → verify correct data returned
- Update prompt → verify file contents updated
- Delete prompt → verify file removed
- Create folder → verify metadata updated

---

### Phase 3: WebLLM Integration
**Duration:** 2-3 days  
**Goal:** Client-side AI analysis of pasted content

**Deliverables:**
1. WebLLM package integrated
2. Web Worker for model loading and inference
3. AI service with analysis functions
4. System prompts for title/tag/folder generation
5. Loading states and progress indicators
6. Error handling for model failures
7. IndexedDB setup for embeddings

**Verification:**
- Model downloads and initializes successfully
- Web Worker doesn't block UI during loading
- `generateTitle()` returns relevant titles
- `generateTags()` returns 3-5 appropriate tags
- `suggestFolder()` returns valid folder paths
- Model cached for subsequent loads
- `npm run lint` passes

**Test Cases:**
- Paste code snippet → verify relevant title/tags
- Paste prose → verify appropriate categorization
- Test with various content types (code, notes, prompts)
- Verify model loads from cache on second visit
- Test fallback behavior if model fails to load

**Model Configuration:**
- Model: `Phi-3-mini-4k-instruct-q4f16_1`
- Size: ~2.3 GB
- Cache: IndexedDB via WebLLM

---

### Phase 4: Core UI (Paster & Library)
**Duration:** 3-4 days  
**Goal:** Functional UI for pasting and browsing prompts

**Deliverables:**
1. Paster component with textarea
2. AI suggestions display with editable fields
3. Save flow connecting to Google Drive API
4. Library page with two-column layout
5. Folder tree navigation
6. Prompt grid with cards
7. Tag filtering functionality
8. Basic animations with Framer Motion
9. Responsive design (mobile + desktop)

**Verification:**
- User can paste content and see AI suggestions
- User can edit title, tags, folder before saving
- Prompt saves to Google Drive successfully
- Saved prompts appear in Library immediately
- Folder navigation works correctly
- Tag filtering updates results instantly
- UI is responsive on mobile/tablet/desktop
- Animations are smooth (60fps)
- `npm run lint` passes

**Test Cases:**
- Paste → Edit → Save workflow
- Browse library by folder
- Filter by single tag
- Filter by multiple tags (AND/OR logic)
- Create new folder from Library
- Delete prompt from Library
- Mobile responsive layout

---

### Phase 5: Advanced Features (Search & Composer)
**Duration:** 3-4 days  
**Goal:** Semantic search and prompt composition

**Deliverables:**
1. Embedding generation on prompt save
2. IndexedDB storage for embeddings
3. Search bar component
4. Vector similarity search algorithm
5. Search results display
6. Prompt Composer modal
7. Real-time prompt suggestions in Composer
8. Variable highlighting and management

**Verification:**
- Embeddings generated and stored for all prompts
- Search returns semantically relevant results
- Search is fast (<500ms for 1000 prompts)
- Composer shows related prompts as user types
- Variables can be defined and inserted
- `npm run lint` passes

**Test Cases:**
- Search "Python API" → verify relevant results
- Search natural language query → verify semantic matching
- Composer suggestions update as user types
- Insert suggested prompt into Composer
- Define and use variables (e.g., `{{topic}}`)

---

### Phase 6: Finalization & Deployment
**Duration:** 2-3 days  
**Goal:** Production-ready application

**Deliverables:**
1. UI/UX polish (animations, transitions, styling)
2. Error boundary components
3. Loading states for all async operations
4. Accessibility improvements (ARIA labels, keyboard nav)
5. Performance optimization (code splitting, lazy loading)
6. Production build testing
7. Vercel deployment configuration
8. Documentation updates

**Verification:**
- All features work end-to-end
- No console errors in production build
- Lighthouse score: >90 performance, >90 accessibility
- Works on target browsers (Chrome 113+, Edge 113+, Safari 18+)
- Deployed to Vercel successfully
- Environment variables configured in Vercel
- `npm run build` succeeds

**Final Test Scenarios:**
- Complete user journey: Login → Paste → Browse → Search → Compose
- Test on slow network (3G throttling)
- Test on low-end hardware
- Test across browsers
- Test mobile responsiveness

---

## 6. Verification Approach

### 6.1 Automated Testing

**Linting:**
```bash
npm run lint
```
- ESLint configured for Next.js + TypeScript
- Run after every phase completion
- Zero errors required to proceed

**Type Checking:**
```bash
npm run type-check  # or tsc --noEmit
```
- TypeScript strict mode enabled
- No type errors allowed in production

**Build Verification:**
```bash
npm run build
```
- Must succeed before deployment
- Catch build-time errors early

### 6.2 Manual Testing

**Per-Phase Checklist:**
- [ ] Core functionality works as specified
- [ ] Error handling works (test edge cases)
- [ ] UI is responsive (test multiple screen sizes)
- [ ] Performance acceptable (no blocking operations)
- [ ] Console clean (no errors/warnings)

**Integration Testing:**
- Test complete workflows across multiple components
- Verify data flows from UI → API → Google Drive → UI
- Test offline/online transitions
- Verify caching behavior

**Browser Testing:**
- Chrome 113+ (primary)
- Edge 113+ (secondary)
- Safari 18+ (if available)

### 6.3 Performance Benchmarks

**Target Metrics:**
- Initial page load: <3s on 3G
- WebLLM model load: Show progress, allow background load
- Prompt save: <2s from click to confirmation
- Search results: <500ms for 1000 prompts
- UI animations: 60fps, no janky scrolling

**Monitoring:**
- Use Chrome DevTools Performance tab
- Monitor Web Worker activity
- Track API response times
- Measure IndexedDB query performance

### 6.4 Pre-Deployment Checklist

- [ ] All environment variables documented
- [ ] `.gitignore` configured correctly
- [ ] No secrets committed to repository
- [ ] Production build succeeds
- [ ] All lint checks pass
- [ ] Manual testing completed on all target browsers
- [ ] Google OAuth redirect URIs configured for production
- [ ] Vercel environment variables set
- [ ] Error tracking configured (optional)

---

## 7. Error Handling & Edge Cases

### 7.1 Authentication Errors

**Scenario:** User denies Google Drive permissions
- **Handling:** Block app access, show clear message explaining required permissions
- **UI:** Friendly error page with "Retry" button

**Scenario:** OAuth token expires
- **Handling:** NextAuth.js handles refresh automatically
- **Fallback:** If refresh fails, redirect to login

### 7.2 Google Drive API Errors

**Scenario:** Network failure during API call
- **Handling:** Retry with exponential backoff (max 3 attempts)
- **UI:** Show "Syncing..." indicator, then error if all retries fail

**Scenario:** API quota exceeded
- **Handling:** Queue operations, display friendly message
- **UI:** "Syncing paused — retrying in 30 seconds..."

**Scenario:** Concurrent modifications (sync conflict)
- **Handling:** Show diff view, let user choose version
- **UI:** Modal with "Keep Local" / "Use Drive" / "Merge" options

### 7.3 WebLLM Errors

**Scenario:** Model download fails
- **Handling:** Retry with backoff, offer "Manual Mode" without AI
- **UI:** Error message with "Retry" and "Continue Without AI" buttons

**Scenario:** Inference timeout (>10s)
- **Handling:** Cancel operation, allow manual entry
- **UI:** "AI analysis taking too long — enter manually?"

**Scenario:** WebGPU not supported
- **Handling:** Block app initialization, show upgrade message
- **UI:** "This app requires a modern browser with WebGPU support"

### 7.4 Browser Storage Errors

**Scenario:** IndexedDB quota exceeded
- **Handling:** Detect quota, prompt to clear model cache
- **UI:** "Storage full — clear AI model cache to continue?"

**Scenario:** Offline mode
- **Handling:** Cache in IndexedDB, queue sync operations
- **UI:** Persistent banner: "Offline — changes will sync when connected"

---

## 8. Security & Privacy Considerations

### 8.1 Privacy Guarantees

**Client-Side AI Processing:**
- All content analysis happens in-browser via WebLLM
- No content sent to external servers for AI inference
- User's prompts remain completely private

**Data Storage:**
- Prompts stored only in user's personal Google Drive
- No server-side database or logging
- Full user ownership of data

### 8.2 Authentication Security

**OAuth Best Practices:**
- Use NextAuth.js for secure token management
- Tokens stored in httpOnly cookies (not localStorage)
- CSRF protection enabled by default

**Scopes:**
- Request minimal permissions: `drive.appdata` only
- Do not request full Drive access

### 8.3 Code Security

**Environment Variables:**
- Never commit `.env.local` to git
- Use `.gitignore` to exclude secrets
- Document required variables without exposing values

**API Routes:**
- Validate all input on server side
- Sanitize user data before storage
- Use TypeScript for type safety

---

## 9. Technical Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| WebGPU not supported in user's browser | High | Medium | Detect on load, show clear upgrade message |
| Model download fails (slow/metered connection) | Medium | Medium | Show progress, allow retry, offer manual mode |
| Google Drive API quota exceeded | High | Low | Implement request batching, caching, throttling |
| Slow inference on low-end hardware | Medium | Medium | Show loading states, allow manual entry |
| Browser storage quota exceeded | Medium | Low | Detect quota, prompt to clear cache |
| Concurrent Drive modifications | Medium | Low | Implement conflict resolution UI |

---

## 10. Open Questions & Assumptions

### Assumptions
- ✅ Users have Google accounts and accept OAuth
- ✅ Users have modern browsers with WebGPU
- ✅ Users have bandwidth for 2.3 GB model download
- ✅ Initial folder structure starts empty (AI creates as needed)
- ✅ Tags are plain text without hierarchies
- ✅ Variables are simple string templates in v0.0.1

### Future Enhancements (Out of Scope for v0.0.1)
- Mobile native apps
- Browser extension
- Sharing/collaboration features
- Multi-language UI
- Undo/redo functionality
- Public prompt library integration

---

## 11. Success Criteria

### Functional Requirements
- ✅ User can login with Google OAuth
- ✅ User can paste content and receive AI suggestions
- ✅ User can save prompts to Google Drive
- ✅ User can browse library by folders and tags
- ✅ User can search library semantically
- ✅ User can compose prompts with AI assistance

### Non-Functional Requirements
- ✅ All AI processing happens client-side
- ✅ Initial page load <3s on 3G
- ✅ Prompt save <2s
- ✅ Search results <500ms for 1000 prompts
- ✅ UI animations at 60fps
- ✅ Responsive design (mobile + desktop)

### Quality Gates
- ✅ Zero lint errors
- ✅ Zero TypeScript errors
- ✅ Production build succeeds
- ✅ Manual testing passes on target browsers
- ✅ Lighthouse score >90 (performance + accessibility)

---

**Status:** Technical specification complete and ready for implementation planning.

**Next Step:** Create detailed implementation plan with concrete tasks in `plan.md`.
