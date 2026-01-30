# Product Requirements Document (PRD)
# AI Prompt Paster v2.0

**Version:** 1.1 (Updated with Clarifications)  
**Date:** 2026-01-30  
**Status:** ✅ APPROVED - Ready for Technical Specification  
**Author:** AI Agent (based on design docs + stakeholder clarifications)

---

## 1. Executive Summary

**AI Prompt Paster v2.0** is a privacy-first, intelligent prompt library that transforms the act of pasting content into a knowledge-building activity. Users paste prompts, code snippets, or notes, and an embedded client-side LLM automatically analyzes and organizes them into a searchable personal library stored in Google Drive. The system eliminates server-side AI costs, ensures complete privacy, and provides a Notion-inspired interface for browsing and reusing content.

**Key Value Propositions:**
- **Automatic Organization**: AI suggests titles, tags, and folders with no manual categorization needed
- **Complete Privacy**: All AI processing happens in-browser; no content sent to external servers
- **Zero Ongoing Costs**: Client-side inference eliminates API fees
- **Cross-Device Sync**: Google Drive storage enables access from any device
- **Semantic Search**: Find prompts by meaning, not just keywords

---

## 2. Key Technical Decisions (Quick Reference)

| Decision Area | Choice | Rationale |
|--------------|---------|-----------|
| **AI Model** | Phi-3-mini-4k-instruct-q4f16_1 (2.3 GB) | Balance of speed, size, quality for tagging/title generation |
| **OAuth Scope** | `drive.appdata` only | Minimal permissions, app-specific folder access |
| **Drive Folder** | Visible at `/AI Prompt Paster/` | Transparency, user can backup/export JSON files |
| **Folder Structure** | Empty by default | User/AI creates structure based on actual content |
| **Tag System** | 3-5 tags per prompt, auto-complete | Flexible tagging with AND/OR filtering |
| **Model Loading** | Progressive with background load | Non-blocking UX, allow browsing while loading |
| **Offline Mode** | Local cache + sync queue | Graceful degradation with automatic sync on reconnect |
| **Browser Support** | Chrome 113+, WebGPU required | Modern browsers only, no polyfill available |
| **Onboarding** | Minimal with contextual tooltips | Discovery-based, no forced tutorial |
| **Rate Limiting** | Batching + caching + exponential backoff | Handle Google Drive API quota limits |

---

## 3. Product Vision & Goals

### 3.1 Vision
Transform casual pasting into intentional knowledge curation, helping users build and maintain a rich personal library of prompts, code, and context that becomes more valuable over time.

### 3.2 Success Criteria
- Users can paste content and save it to their library in under 10 seconds
- AI suggestions are accurate enough that 80%+ are accepted without modification
- Users successfully retrieve saved prompts using semantic search
- System operates entirely client-side with no server-side inference
- Application deploys successfully to Vercel with Google OAuth

### 3.3 Non-Goals (v0.0.1)
- Sharing or collaboration features
- Public prompt libraries or "Commons" integration (future versions)
- Mobile native apps (web-responsive only)
- Browser extension (future version)
- Multi-language UI localization

---

## 3. Target Users & Use Cases

### 3.1 Primary Users
- **AI/LLM Power Users**: Individuals who frequently craft and reuse prompts for various AI tools
- **Developers**: Engineers collecting code snippets, documentation, and technical notes
- **Knowledge Workers**: Researchers, writers, consultants managing context across projects
- **Privacy-Conscious Users**: Individuals unwilling to store sensitive context in cloud-based AI services

### 3.2 Core Use Cases

**UC1: Capture and Organize New Prompt**
1. User pastes content into the Paster interface
2. WebLLM analyzes content and suggests title, tags, and folder
3. User reviews suggestions, optionally edits them
4. User clicks "Save" and prompt is stored in Google Drive
5. Prompt immediately appears in Library view

**UC2: Browse Library by Folder**
1. User opens Library view
2. User navigates folder tree in left sidebar
3. Prompts in selected folder display as cards in main area
4. User clicks a card to view full content and copy to clipboard

**UC3: Search Library Semantically**
1. User enters natural language query in search bar
2. System generates embedding for query using WebLLM
3. System performs vector similarity search against stored embeddings
4. Results ranked by relevance appear instantly
5. User clicks result to view full prompt

**UC4: Compose New Prompt with Context**
1. User opens Prompt Composer
2. As user types, system suggests related prompts from library
3. User clicks suggestion to insert it at cursor position
4. User refines combined prompt and saves to library

---

## 4. Functional Requirements

### 4.1 Authentication (Phase 1)

**FR1.1: Google OAuth Login**
- System MUST authenticate users via Google OAuth 2.0
- Users MUST grant Google Drive API access scopes
- System MUST persist authentication session using NextAuth.js
- Login flow MUST redirect to Library view on success

**FR1.2: Session Management**
- Sessions MUST remain active for 30 days by default
- Users MUST be able to explicitly log out
- System MUST handle token refresh automatically

**Manual Setup Required:**

**OAuth Configuration Steps:**
1. Create Google Cloud Project via console.cloud.google.com
2. Enable Google Drive API in API Library
3. Create OAuth 2.0 Client ID (Web application type)
4. Add authorized redirect URIs:
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://yourdomain.com/api/auth/callback/google`
5. Download credentials JSON and extract Client ID + Client Secret

**Required OAuth Scopes:**
- `https://www.googleapis.com/auth/drive.appdata` - App-specific folder only (not full Drive access)
- `https://www.googleapis.com/auth/userinfo.profile` - User identity

**Environment Variables (.env.local):**
```
GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret_here
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate_with_openssl_rand_base64_32
```

Generate NEXTAUTH_SECRET: `openssl rand -base64 32`

### 4.2 Google Drive Integration (Phase 2)

**FR2.1: App Data Folder**
- System MUST create `/AI Prompt Paster/` folder in user's Google Drive on first use
- Folder structure MUST include `/prompts/` subdirectory for JSON files
- System MUST create `metadata.json` for storing folder hierarchy and settings

**FR2.2: CRUD Operations**
- System MUST support creating new prompt files (JSON format)
- System MUST support reading all prompts from Drive
- System MUST support updating existing prompts
- System MUST support deleting prompts
- All operations MUST be exposed via Next.js API routes

**FR2.3: Data Model**
```json
{
  "id": "uuid-v4",
  "title": "string (max 200 chars)",
  "content": "string (max 50KB)",
  "tags": ["string[]", "max 10 tags"],
  "folderPath": "/Category/Subcategory/",
  "createdAt": "ISO 8601 timestamp",
  "modifiedAt": "ISO 8601 timestamp",
  "sourceUrl": "optional string"
}
```

**FR2.4: Error Handling**
- System MUST retry failed Drive API calls up to 3 times with exponential backoff
- System MUST display user-friendly error messages for quota/network issues
- System MUST handle offline state gracefully with cached data

### 4.3 WebLLM Integration (Phase 3)

**FR3.1: Model Initialization**
- System MUST initialize WebLLM engine on first app load
- System MUST use `Phi-3-mini-4k-instruct-q4f16_1` model (3.8B parameters, 2.3 GB)
- Model loading MUST happen in Web Worker to prevent UI blocking
- System MUST display progress indicator during model download
- Model cached in browser storage (IndexedDB) for instant subsequent loads

**Model Selection Rationale:**
- **Size**: 2.3 GB vs 4.7 GB (Llama-3-8B) — faster initial load
- **Performance**: Optimized for instruction-following and short-form text analysis
- **Speed**: Faster inference on consumer hardware (1-3 seconds per analysis)
- **Quality**: Sufficient for title generation, tagging, and folder suggestions

**Future Enhancement**: Add settings toggle for `Llama-3-8B-Instruct-q4f16_1` for power users with high-end GPUs

**FR3.2: Content Analysis Functions**
- `generateTitle(content: string): Promise<string>` - Generate concise title (max 200 chars)
- `generateTags(content: string): Promise<string[]>` - Generate 3-5 relevant tags
- `suggestFolder(content: string, existingFolders: string[]): Promise<string>` - Suggest folder path from existing or create new

**FR3.3: Analysis Prompts**
System prompts MUST instruct model to:
- Extract main topic/purpose for title
- Identify key concepts for tags
- Categorize based on content type and domain
- Return structured JSON output

**FR3.4: Performance**
- Analysis MUST complete within 5 seconds on typical hardware (1-3 seconds optimal)
- System MUST handle analysis failures gracefully with fallback to manual input
- Minimum hardware: 8GB RAM, integrated GPU or better
- Optimal hardware: 16GB RAM, dedicated GPU

**FR3.5: Model Loading UX (Progressive Loading Strategy)**

**Challenge:** Phi-3-mini takes 10-30 seconds to download and initialize on first load (2.3 GB)

**First Visit Flow:**
1. User lands on welcome screen with "Connect Google Account" button
2. After OAuth success, immediately start model download in background
3. Show loading screen with progress bar and educational tips:
   - "Loading AI engine... (estimated 15 seconds)"
   - "Your prompts are analyzed locally for complete privacy"
   - "This happens once — future visits are instant"
   - "Model cached in your browser (2.3 GB)"
4. Model cached in browser storage (IndexedDB via WebLLM)
5. Redirect to Library view when ready

**Subsequent Visits:**
- Model loads from cache in 2-3 seconds
- Show subtle loading indicator in header
- User can browse library immediately while AI initializes
- AI features (Paster analysis) available once loaded

**Optimization & User Control:**
- Use Web Worker to load model without blocking UI thread
- Implement "Lazy AI" mode: If model not loaded, allow saving prompt without AI suggestions (manual title/tags)
- Provide "Analyze" button to retroactively apply AI to manually-saved prompts
- Settings options:
  - "Clear AI Model Cache" (frees up 2.3 GB storage)
  - "Preload Model on Startup" (default: true)
  - "Auto-retry on Model Load Failure" (default: true, max 3 attempts)

**Error Handling:**
- If model download fails: Show retry button with error message
- If storage quota exceeded: Prompt user to clear space or use incognito mode
- If WebGPU unavailable: Block app with upgrade message (hard requirement)

### 4.4 The Paster UI (Phase 4)

**FR4.1: Content Input**
- Large textarea (minimum 300px height) with placeholder text
- Support for keyboard shortcuts (Cmd/Ctrl+V for paste)
- Character count indicator with 50KB limit warning
- Auto-expand textarea based on content length

**FR4.2: AI Suggestions Display**
- Loading animation while analysis in progress
- Three editable fields: Title, Tags (chips), Folder (dropdown/text)
- Visual indication of AI-generated vs user-edited values
- "Accept All" button and individual field edit options

**FR4.3: Save Flow**
- Validation: title required, at least one tag, folder path valid
- Save button enabled only when validation passes
- Success feedback with animation
- Automatic clear of textarea after save
- Option to "Save and Paste Another"

### 4.5 The Library UI (Phase 4)

**FR4.4: Layout Structure**
- Two-column layout: Sidebar (250px, collapsible) + Main content area
- Sidebar contains folder tree with expand/collapse icons
- Main area displays prompts as cards in responsive grid (3 cols desktop, 2 tablet, 1 mobile)

**FR4.5: Folder Tree**
- Hierarchical folder display with indentation
- Folder icons with prompt count badges
- Click to filter main area to folder contents
- Right-click context menu for "New Folder", "Rename", "Delete"
- Drag-and-drop prompts between folders

**Folder Organization Strategy: Smart Blank Slate**
- Initial state: Completely empty library (no pre-created folders)
- First paste: AI suggests folder based on content; if no existing folders, AI suggests creating new top-level folder
- Optional Quick Start: On first use, show dismissible banner offering common templates:
  - "Code Snippets" → `/Code Snippets/{language}/`
  - "Writing Prompts" → `/Writing/{genre}/`
  - "Research Notes" → `/Research/{topic}/`
  - "Custom" → User creates their own structure
- Philosophy: Let user's actual content shape organization, not impose structure upfront

**FR4.6: Prompt Cards**
- Card displays: title (bold), truncated content preview (2 lines), tags (colored pills), date
- Hover effect reveals full preview and action buttons (Copy, Edit, Delete)
- Click card to open detail view modal
- Tags clickable to filter by tag

**FR4.7: Tag Filtering**
- Tag cloud above cards showing all tags with usage counts
- Click tag to add to active filters
- Multiple tags combine with AND logic (show prompts with ALL selected tags)
- Toggle to OR logic if needed (show prompts with ANY selected tag)
- Clear filters button

**Tag System Specifications:**
- **Multiple Tags Per Prompt**: Yes, 3-5 tags recommended per prompt (max 10)
- **Tag Creation**: 
  - AI suggests tags automatically on paste
  - User can add/edit/remove tags freely
  - Tags created on-the-fly (no pre-defined tag list)
  - Auto-complete suggestions from existing tags as user types
- **Tag Storage**: Tags stored as array of strings in prompt JSON
- **Visual Styling**:
  - Pill-shaped badges with rounded corners
  - Color-coded by tag name (auto-assigned based on hash for consistency)
  - Hover shows tag count across library
  - Click tag to filter library view
- **Tag Filtering**:
  - Multi-select: Combine multiple tags
  - Default AND logic: Show prompts with ALL selected tags
  - Toggle to OR logic: Show prompts with ANY selected tag
  - Clear all filters button

### 4.6 Semantic Search (Phase 5)

**FR5.1: Embedding Generation**
- On prompt save, generate vector embedding using WebLLM model
- Store embedding in IndexedDB with prompt ID as key
- Embeddings persisted across sessions for fast search
- Background process to regenerate embeddings if model changes

**FR5.2: Search Interface**
- Prominent search bar at top of Library view
- Real-time search (debounced, 300ms delay)
- Natural language queries supported (e.g., "Python API examples")
- Results display as cards with relevance scores

**FR5.3: Search Algorithm**
- Generate embedding for query using same model
- Compute cosine similarity against all stored embeddings
- Return top 20 results sorted by similarity score
- Threshold: minimum 0.6 similarity to display

### 4.7 Prompt Composer (Phase 5)

**FR6.1: Composer Interface**
- Full-screen modal with large text editor
- Markdown support with live preview (optional toggle)
- Auto-suggest sidebar showing related prompts as user types
- Debounced suggestions (500ms delay)

**FR6.2: Prompt Suggestions**
- Semantic search based on current editor content
- Display top 5 related prompts in sidebar
- Click to insert at cursor position
- Hover to preview full content

**FR6.3: Variable Management**
- Support template variables in format `{{variableName}}`
- Highlight variables with distinct styling
- Panel to list all variables and provide descriptions
- Fill variables UI when using prompt

**Assumption:** Variables are simple string placeholders, no type validation in v0.0.1.

---

## 5. Non-Functional Requirements

### 5.1 Performance
- Initial page load: < 3 seconds on 3G connection
- WebLLM model download: Display progress, allow background loading
- Prompt save: < 2 seconds from click to confirmation
- Search results: < 500ms for library of 1000 prompts
- UI animations: 60fps, no janky scrolling

### 5.2 Security & Privacy
- All AI processing MUST occur client-side (no content sent to servers)
- OAuth tokens stored securely using NextAuth.js standards
- Google Drive API calls MUST use OAuth tokens, never API keys
- No analytics or tracking without explicit user consent

### 5.3 Accessibility
- WCAG 2.1 Level AA compliance
- Keyboard navigation for all features
- Screen reader support for prompts and navigation
- Sufficient color contrast (4.5:1 minimum)

### 5.4 Browser Compatibility
- Chrome/Edge 113+ (WebGPU required for WebLLM)
- Firefox 115+ (WebGPU support)
- Safari 18+ (WebGPU support)
- Mobile browsers: iOS Safari 17+, Chrome Android 113+

**Unsupported Browser Handling:**
- Detect WebGPU support on app load
- Show friendly message: "AI Prompt Paster requires a modern browser with WebGPU support. Please update your browser or try Chrome/Edge 113+."
- Prevent app initialization if WebGPU unavailable (hard requirement)
- No polyfill available — WebGPU is mandatory for WebLLM

### 5.5 Scalability
- Support libraries up to 10,000 prompts without performance degradation
- IndexedDB storage limit: 1GB+ (browser-dependent)
- Google Drive API quota: 1,000 requests/100 seconds per user

### 5.6 Offline Handling

**Strategy: Graceful Degradation with Local Cache**

**Scenario 1: Initial Load (No Internet)**
- Show friendly message: "Connect to the internet to sync your library"
- Disable Paster and Library (cannot function without Drive access)
- Display last sync time if cache exists

**Scenario 2: Mid-Session Disconnect**
- Enable "Offline Mode" automatically
- Cache all prompts loaded in current session to IndexedDB
- Allow browsing and searching cached prompts
- Queue any new pastes/edits locally in IndexedDB
- Show persistent banner: "Offline — Changes will sync when reconnected"
- Auto-sync when connection restored with exponential backoff retry

**Scenario 3: Sync Conflict**
- If prompt was modified in Drive while offline, detect conflict
- Show diff view with three options:
  - Keep local version
  - Use Drive version
  - Merge manually (side-by-side editor)

**Implementation Details:**
- Use `navigator.onLine` to detect connection status
- Listen to `online`/`offline` events for real-time status changes
- Implement retry logic with exponential backoff for Drive API calls (max 3 retries)
- Store sync queue in IndexedDB with timestamps and operation type (create/update/delete)
- Display sync status indicator in header (green = synced, yellow = syncing, red = offline)

---

## 6. UI/UX Requirements

### 6.1 Design Language
- Aesthetic: Calm, minimal, Notion-inspired
- Color palette: Neutral grays with accent color (blue or purple)
- Typography: System fonts for performance, clear hierarchy
- Spacing: Generous whitespace, 8px grid system

### 6.2 Animations (Framer Motion)
- Card entrance: Fade + slide up (300ms)
- Folder expand/collapse: Smooth height transition (200ms)
- Loading states: Subtle pulse/spinner
- Success feedback: Checkmark animation + green flash

### 6.3 Responsive Design
- Mobile-first approach
- Breakpoints: 640px (mobile), 768px (tablet), 1024px (desktop)
- Sidebar collapses to hamburger menu on mobile
- Cards stack in single column on mobile

---

## 7. Technical Constraints & Assumptions

### 7.1 Constraints

**WebGPU Requirement:**
- Limits browser support to Chrome 113+, Edge 113+, Safari 18+ (2023+ browsers)
- No polyfill available — WebGPU is hard requirement for WebLLM
- Fallback: Show upgrade message and prevent app initialization

**Google Drive API Quotas:**
- 1,000 requests per 100 seconds per user
- 10,000 requests per 100 seconds per project
- Mitigation: Request batching, aggressive caching, exponential backoff

**Client-Side Processing Performance:**
- Inference speed depends on user's GPU (1-5 seconds per analysis)
- Minimum recommended: 8GB RAM, integrated GPU or better
- Graceful degradation: Show loading states, allow manual tag entry if too slow

**Model Size:**
- Phi-3-mini: ~2.3 GB initial download
- Cached in browser storage (requires available disk space)
- One-time cost, but significant for users on metered connections
- Subsequent loads: 2-3 seconds from cache

### 7.2 Assumptions

**User Requirements:**
- Users have Google accounts and accept Google OAuth
- Users grant Google Drive API access (`drive.appdata` scope only)
- Users have sufficient bandwidth for 2.3 GB model download
- Users have modern browser with WebGPU support
- Users have 8GB+ RAM and integrated GPU or better for acceptable AI performance

**Feature Scope:**
- Default folder structure starts empty (user/AI creates as needed)
- Optional quick-start templates offered on first use (dismissible)
- Tags are plain text without predefined categories or hierarchies
- Tag colors auto-generated based on tag name hash for consistency
- Variables in Composer are simple string templates (e.g., `{{topic}}`)
- No type validation for variables in v0.0.1
- No undo/redo in initial version (rely on Google Drive version history)
- No collaborative features (single-user only)
- Offline support via local cache with sync queue (not fully offline-first)

### 7.3 Resolved Questions

All initial open questions have been resolved with concrete implementation decisions:

**Q1: Model Selection** ✓ RESOLVED
- **Decision:** Phi-3-mini-4k-instruct-q4f16_1 (3.8B parameters, 2.3 GB)
- **Rationale:** Optimal balance of speed, size, and quality for tagging/title generation
- **Future Enhancement:** Add settings toggle for Llama-3-8B for power users with high-end GPUs

**Q2: Initial Onboarding** ✓ RESOLVED
- **Decision:** Minimal onboarding with contextual tooltips
- **Implementation:**
  - Welcome screen with "Connect Google Account" CTA
  - Loading screen with progress bar and tips during model download
  - Helpful placeholder text in Paster ("Paste your prompt here...")
  - Tooltips on first interaction with key features
  - Optional "Tips" panel (dismissible) in Library view
  - No multi-step tutorial or forced walkthrough

**Q3: Google Drive Folder Visibility** ✓ RESOLVED
- **Decision:** Visible folder at `/AI Prompt Paster/` (not hidden appDataFolder)
- **Rationale:**
  - Transparency: Users can see and access their data
  - Backup-friendly: Users can manually backup/export JSON files
  - Debugging: Easier to troubleshoot sync issues
- **Trade-off:** Folder appears in Drive UI (acceptable for power users)

**Q4: Rate Limiting (Google Drive API)** ✓ RESOLVED
- **Decision:** Multi-layer mitigation strategy
- **Implementation:**
  1. Request Batching: Combine multiple file operations into batch requests
  2. Aggressive Caching: Cache prompt metadata in IndexedDB, only sync changes
  3. Exponential Backoff: Retry failed requests with increasing delays (max 3 retries)
  4. User Feedback: Show friendly message if quota hit: "Syncing paused — too many changes too quickly. Retrying in 30 seconds..."
  5. Monitoring: Log API usage in dev mode to identify hotspots

**Q5: Model Loading Time** ✓ RESOLVED
- **Decision:** Progressive loading with non-blocking UX
- **Implementation:**
  1. **First Visit:** Show loading screen with progress bar and tips during model download (10-30 seconds)
  2. **Allow Library Browsing:** User can view/search existing prompts while model loads
  3. **Disable Paster:** Show "AI engine loading..." message in Paster until ready
  4. **Background Loading:** Use Web Worker to avoid blocking UI
  5. **Lazy AI Mode:** If user tries to paste before model ready, offer:
     - "Save without AI" (manual title/tags)
     - "Wait for AI" (queue paste for auto-analysis)
  6. **Subsequent Visits:** Model loads from cache in 2-3 seconds (non-blocking)
  7. **User Control:** Settings option to "Clear AI Model Cache" (frees up 2.3 GB storage)

### 7.4 Risk Mitigation

| Risk | Mitigation Strategy |
|------|---------------------|
| **WebGPU not supported** | Detect on app load, show upgrade message with browser recommendations, prevent app initialization |
| **Model download fails** | Retry with exponential backoff (3 attempts), offer "Manual Mode" without AI features, allow retry button |
| **Drive API quota exceeded** | Queue operations in IndexedDB, show sync status indicator, implement request throttling with backoff |
| **Slow inference on low-end hardware** | Show loading states with estimated time, allow manual entry fallback, consider smaller model variant in future |
| **User denies Drive permissions** | Block app access with clear explanation, show permission requirements upfront in onboarding |
| **Browser storage full (model cache)** | Detect quota before download, prompt to clear model cache or use different browser, show available space |
| **Offline during critical operation** | Queue all operations locally with timestamps, sync automatically when reconnected, show offline status clearly |
| **Sync conflicts (concurrent edits)** | Detect conflicts via timestamp comparison, show diff view, offer merge options (keep local/remote/manual merge) |

---

## 8. Out of Scope (Future Versions)

- **v0.0.2+**: Sharing prompts via public links
- **v0.0.3+**: Collaborative workspaces for teams
- **v0.1.0+**: Integration with Dojo Genesis Commons
- **v0.2.0+**: Browser extension for capturing context from any site
- **v0.3.0+**: Mobile native apps (iOS/Android)
- **v1.0.0+**: Public "Wikipedia of Prompts" with community contributions
- **Future**: Fine-tuning local models on user's prompt history
- **Future**: Export to Markdown/Obsidian/Notion formats
- **Future**: Prompt version history and diffing

---

## 9. Dependencies & Prerequisites

### 9.1 Required Before Development

**Google Cloud Project Setup (Manual):**
1. Create Google Cloud Project at console.cloud.google.com
2. Enable Google Drive API in API Library
3. Create OAuth 2.0 Client ID (Web application type)
4. Configure OAuth consent screen with app name and privacy policy
5. Add authorized redirect URIs:
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://yourdomain.com/api/auth/callback/google`
6. Download credentials JSON and extract Client ID + Client Secret

**Required OAuth Scopes:**
- `https://www.googleapis.com/auth/drive.appdata` - App-specific folder only (not full Drive access)
- `https://www.googleapis.com/auth/userinfo.profile` - User identity for display name/avatar

**Environment Configuration (.env.local):**
Create `.env.local` file in project root:
```bash
GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your_client_secret_here
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate_with_openssl_rand_base64_32
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

**Production Deployment (.env.production or Vercel Environment Variables):**
```bash
GOOGLE_CLIENT_ID=same_as_dev
GOOGLE_CLIENT_SECRET=same_as_dev
NEXTAUTH_URL=https://your-production-domain.vercel.app
NEXTAUTH_SECRET=different_secret_for_production
```

### 9.2 Technology Stack
- **Frontend**: Next.js 14.2+ (App Router), React 18+, TypeScript 5.3+
- **Styling**: Tailwind CSS 3.4+, Framer Motion 11+
- **AI**: @mlc-ai/web-llm (latest)
- **Auth**: NextAuth.js 4.24+
- **Storage**: @googleapis/drive (latest)
- **Client DB**: IndexedDB (native browser API)
- **Deployment**: Vercel (recommended)

### 9.3 Development Environment
- Node.js 20+ LTS
- npm or yarn
- Modern browser with DevTools
- Git for version control

---

## 10. Success Metrics (v0.0.1 MVP)

### 10.1 Functional Completion
- [ ] User can authenticate with Google OAuth
- [ ] User can paste content and receive AI suggestions
- [ ] User can save prompts to Google Drive
- [ ] User can browse library by folders
- [ ] User can filter by tags
- [ ] User can search semantically
- [ ] User can compose prompts with suggestions
- [ ] Application deploys to Vercel successfully

### 10.2 Quality Metrics
- All Lighthouse scores > 90 (Performance, Accessibility, Best Practices)
- Zero critical security vulnerabilities (npm audit)
- TypeScript strict mode with zero errors
- All Next.js linting rules pass
- Mobile-responsive design verified on iOS and Android

### 10.3 User Experience
- First prompt saved within 2 minutes of account creation
- AI suggestion acceptance rate > 80%
- Search returns relevant results within 500ms
- No janky animations or UI freezes

---

## 11. References

This PRD is based on the following design documents:
- **DESIGN.md**: Master design and technical architecture
- **IMPLEMENTATION_PLAN.md**: Phase-by-phase development roadmap
- **RESEARCH.md**: Modern pastebin landscape and WebLLM capabilities
- **VISION_SYNTHESIS.md**: Product vision and philosophical foundations
- **README.md**: Documentation overview

---

## 12. Approval & Next Steps

**Status:** ✅ APPROVED - All clarifications integrated, ready for Technical Specification phase

**Changes in v1.1:**
- Integrated OAuth configuration details with step-by-step setup
- Specified Phi-3-mini-4k-instruct-q4f16_1 model (2.3 GB) with full rationale
- Detailed folder organization strategy (smart blank slate with optional templates)
- Comprehensive tag system specifications (3-5 tags, auto-complete, AND/OR filtering)
- Progressive model loading UX with lazy AI mode and user controls
- Offline handling strategy with local cache and sync queue
- Resolved all 5 open questions with concrete implementation decisions
- Added risk mitigation matrix
- Enhanced browser compatibility details with WebGPU requirements
- Expanded environment configuration for dev and production

**Next Steps:**
1. ✅ PRD complete with all stakeholder clarifications integrated
2. → Proceed to Technical Specification document (spec.md)
3. → Create detailed implementation plan (plan.md)
4. → Begin Phase 1: Project Setup & Authentication

---

**Document Version:** 1.1 (Updated with Clarifications)  
**Last Updated:** 2026-01-30  
**Prepared By:** AI Agent (Requirements Phase)  
**Status:** Final - Ready for Technical Specification
