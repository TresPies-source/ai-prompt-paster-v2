# AI Prompt Paster v2.0: Implementation Clarifications

**Author:** Manus AI (Dojo)  
**Date:** 2026-01-30  
**Purpose:** Address specific implementation questions for Zenflow development

---

## OAuth Configuration & Credential Management

**Setup Process:**
1. Create Google Cloud Project via console.cloud.google.com
2. Enable Google Drive API in API Library
3. Create OAuth 2.0 Client ID (Web application type)
4. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google` (dev) and production URL
5. Download credentials JSON and extract Client ID + Client Secret

**Environment Variables (.env.local):**
```
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate_with_openssl_rand_base64_32
```

**Scopes Required:**
- `https://www.googleapis.com/auth/drive.appdata` (app-specific folder only, not full Drive access)
- `https://www.googleapis.com/auth/userinfo.profile` (user identity)

---

## Model Selection: Phi-3 vs Llama-3-8B

**Recommendation: Phi-3-mini (3.8B parameters)**

**Rationale:**
- **Size:** 2.3 GB vs 4.7 GB (Llama-3-8B) — faster initial load
- **Performance:** Optimized for instruction-following and short-form text analysis
- **Speed:** Faster inference on consumer hardware
- **Quality:** Sufficient for title generation, tagging, and folder suggestions

**Model ID for WebLLM:** `Phi-3-mini-4k-instruct-q4f16_1`

**Fallback Strategy:** If user has high-end GPU and wants better quality, provide a settings toggle to switch to `Llama-3-8B-Instruct-q4f16_1`

---

## Default Folder Templates vs Blank Slate

**Approach: Smart Blank Slate with Suggested Templates**

**Initial State:**
- User starts with completely empty library (no pre-created folders)
- First paste triggers AI to suggest a folder based on content
- If no existing folders, AI suggests creating a new top-level folder

**Optional Quick Start Templates (Dismissible Banner):**
On first use, show a subtle banner offering common templates:
- "Code Snippets" → `/Code Snippets/{language}/`
- "Writing Prompts" → `/Writing/{genre}/`
- "Research Notes" → `/Research/{topic}/`
- "Custom" → User creates their own structure

**Philosophy:** Let the user's actual content shape the organization, not impose a structure upfront.

---

## Tag Behavior & Management

**Tag System Specifications:**

**Multiple Tags Per Prompt:** Yes, 3-5 tags recommended per prompt

**Tag Creation:**
- AI suggests tags automatically on paste
- User can add/edit/remove tags freely
- Tags are created on-the-fly (no pre-defined tag list)
- Auto-complete suggestions from existing tags as user types

**Tag Storage:** Tags stored as array of strings in prompt JSON

**Visual Styling:**
- Pill-shaped badges with rounded corners
- Color-coded by category (auto-assigned based on tag name hash for consistency)
- Hover shows tag count across library
- Click tag to filter library view

**Tag Filtering:**
- Multi-select: Combine multiple tags (AND logic: show prompts with ALL selected tags)
- Toggle to OR logic if needed (show prompts with ANY selected tag)
- Clear all filters button

---

## Offline Handling: Google Drive Unavailable

**Strategy: Graceful Degradation with Local Cache**

**Scenarios:**

**1. Initial Load (No Internet):**
- Show friendly message: "Connect to the internet to sync your library"
- Disable Paster and Library (can't function without Drive access)

**2. Mid-Session Disconnect:**
- Enable "Offline Mode" automatically
- Cache all prompts loaded in current session to IndexedDB
- Allow browsing and searching cached prompts
- Queue any new pastes/edits locally
- Show persistent banner: "Offline — Changes will sync when reconnected"
- Auto-sync when connection restored

**3. Sync Conflict:**
- If prompt was modified in Drive while offline, show diff view
- Let user choose: Keep local version, use Drive version, or merge manually

**Implementation:**
- Use `navigator.onLine` to detect connection status
- Implement retry logic with exponential backoff for Drive API calls
- Store sync queue in IndexedDB with timestamps

---

## WebLLM Model Loading Time Management

**Challenge:** Phi-3-mini takes 10-30 seconds to download and initialize on first load

**Strategy: Progressive Loading with Smart UX**

**First Visit:**
1. User lands on welcome screen with "Connect Google Account" button
2. After OAuth, immediately start model download in background
3. Show beautiful loading screen with progress bar and tips:
   - "Loading AI engine... (15 seconds)"
   - "Your prompts are analyzed locally for complete privacy"
   - "This happens once — future visits are instant"
4. Model cached in browser (IndexedDB via WebLLM)

**Subsequent Visits:**
- Model loads from cache in 2-3 seconds
- Show subtle loading indicator in header
- User can browse library immediately (AI features available once loaded)

**Optimization:**
- Use Web Worker to load model without blocking UI
- Implement "lazy AI" mode: If model not loaded, save prompt without AI suggestions (user can manually add title/tags)
- Provide "Analyze" button to retroactively apply AI to manually-saved prompts

**User Control:**
- Settings option to "Clear AI Model Cache" (frees up 2.3 GB storage)
- Settings option to "Preload Model on Startup" (default: true)

---

## Summary: Key Decisions

| Question | Decision |
|----------|----------|
| **OAuth Setup** | Google Cloud Console → OAuth 2.0 Client → Drive.appdata scope only |
| **Model Choice** | Phi-3-mini (2.3 GB, faster, sufficient quality) |
| **Folder Templates** | Blank slate with optional dismissible quick-start templates |
| **Tag Behavior** | 3-5 tags per prompt, auto-complete, multi-select filtering, color-coded pills |
| **Offline Handling** | Graceful degradation with local cache and sync queue |
| **Model Loading** | Progressive loading with progress indicator, cache for instant subsequent loads |

---

**Copy-Paste Ready:** These decisions are final and ready for implementation. No further clarification needed.


---

## Technical Constraints & Assumptions

### Constraints

**WebGPU Requirement:**
- Limits browser support to Chrome 113+, Edge 113+, Safari 18+ (2023+ browsers)
- Fallback message for unsupported browsers: "AI Prompt Paster requires a modern browser with WebGPU support. Please update your browser or try Chrome/Edge."
- No polyfill available — WebGPU is hard requirement for WebLLM

**Google Drive API Quotas:**
- 1,000 requests per 100 seconds per user
- 10,000 requests per 100 seconds per project
- Mitigation: Implement request batching, aggressive caching, and exponential backoff

**Client-Side Processing Performance:**
- Inference speed depends on user's GPU (1-5 seconds per analysis)
- Minimum recommended: 8GB RAM, integrated GPU or better
- Graceful degradation: Show loading states, allow manual tag entry if too slow

**Model Size:**
- Phi-3-mini: ~2.3 GB initial download
- Cached in browser storage (requires available disk space)
- One-time cost, but significant for users on metered connections

### Assumptions

**User Requirements:**
- ✓ Users have Google accounts and accept Google OAuth
- ✓ Users grant Google Drive API access (drive.appdata scope)
- ✓ Users have sufficient bandwidth for 2.3 GB model download
- ✓ Users have modern browser with WebGPU support

**Feature Scope:**
- ✓ Default folder structure starts empty (user/AI creates as needed)
- ✓ Tags are plain text without predefined categories or hierarchies
- ✓ Variables in Composer are simple string templates (e.g., `{{topic}}`)
- ✓ No offline-first support in v1.0 (requires internet for Drive sync)
- ✓ No undo/redo in initial version (rely on Google Drive version history)
- ✓ No collaborative features (single-user only)

### Resolved Questions

**Q1: Model Selection**
- **Decision:** Phi-3-mini-4k-instruct (3.8B parameters, 2.3 GB)
- **Rationale:** Optimal balance of speed, size, and quality for tagging/title generation
- **Future:** Add settings toggle for Llama-3-8B for power users

**Q2: Initial Onboarding**
- **Decision:** Minimal onboarding with contextual tooltips
- **Implementation:** 
  - Welcome screen with "Connect Google Account" CTA
  - Helpful placeholder text in Paster ("Paste your prompt here...")
  - Tooltips on first interaction with key features
  - Optional "Tips" panel (dismissible) in Library view
- **No:** Multi-step tutorial or forced walkthrough

**Q3: Google Drive Folder Visibility**
- **Decision:** Visible folder at `/AI Prompt Paster/` (not hidden appDataFolder)
- **Rationale:** 
  - Transparency: Users can see and access their data
  - Backup-friendly: Users can manually backup/export JSON files
  - Debugging: Easier to troubleshoot sync issues
- **Trade-off:** Folder appears in Drive UI (acceptable for power users)

**Q4: Rate Limiting (Google Drive API)**
- **Decision:** Implement multi-layer mitigation strategy
- **Implementation:**
  1. **Request Batching:** Combine multiple file operations into batch requests
  2. **Aggressive Caching:** Cache prompt metadata in IndexedDB, only sync changes
  3. **Exponential Backoff:** Retry failed requests with increasing delays
  4. **User Feedback:** If quota hit, show friendly message: "Syncing paused — too many changes too quickly. Retrying in 30 seconds..."
- **Monitoring:** Log API usage in dev mode to identify hotspots

**Q5: Model Loading Time**
- **Decision:** Progressive loading with non-blocking UX
- **Implementation:**
  1. **First Visit:** Show loading screen with progress bar during model download
  2. **Allow Library Browsing:** User can view/search existing prompts while model loads
  3. **Disable Paster:** Show "AI engine loading..." message in Paster until ready
  4. **Background Loading:** Use Web Worker to avoid blocking UI
  5. **Lazy AI Mode:** If user tries to paste before model ready, offer:
     - "Save without AI" (manual title/tags)
     - "Wait for AI" (queue paste for auto-analysis)
- **Subsequent Visits:** Model loads from cache in 2-3 seconds (non-blocking)

### Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| **WebGPU not supported** | Detect on load, show upgrade message, prevent app initialization |
| **Model download fails** | Retry with exponential backoff, offer "manual mode" without AI |
| **Drive API quota exceeded** | Queue operations, show sync status, implement request throttling |
| **Slow inference on low-end hardware** | Show loading states, allow manual entry, consider smaller model variant |
| **User denies Drive permissions** | Block app access, show clear explanation of why permission needed |
| **Browser storage full** | Detect quota, prompt to clear model cache or use different browser |

---

**Status:** All assumptions documented and risks mitigated. Ready for implementation.
