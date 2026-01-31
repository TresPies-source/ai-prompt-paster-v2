# AI Prompt Paster v0.0.3 Implementation Plan

## Configuration
- **Artifacts Path**: `.zenflow/tasks/v0-0-3-2455`
- **Complexity**: HARD
- **Estimated Timeline**: 20-28 days

---

## Agent Instructions

Ask the user questions when anything is unclear or needs their input. This includes:
- Ambiguous or incomplete requirements
- Technical decisions that affect architecture or user experience
- Trade-offs that require business context

Do not make assumptions on important decisions — get clarification first.

---

## Workflow Steps

### [x] Step: Technical Specification

Completed. See `spec.md` for full technical specification.

**Complexity Assessment:** HARD

---

## Phase 1: Data Models & Core Services

### [x] Step: Enhance Prompt Data Model
<!-- chat-id: bbf18018-4f17-4ac8-b092-202704cf1999 -->

Extend the `Prompt` interface in `src/types/prompt.ts` to include v0.0.3 quality tracking fields.

**Tasks:**
- Add optional fields: `ratings`, `successCount`, `failureCount`, `comparisonIds`, `winCount`, `lossCount`, `lastRatedAt`, `refinementHistory`
- Implement helper functions: `getAverageRating()`, `getSuccessRate()`, `getWinRate()`
- Ensure backward compatibility (all new fields optional)

**Verification:**
- [x] TypeScript compilation succeeds
- [x] Helper functions return correct values
- [x] Existing prompts still load without errors

---

### [x] Step: Create PromptCollection Data Model
<!-- chat-id: 0840d0aa-eda4-4948-b15e-1ba9941c6134 -->

Add `PromptCollection` interface and related types to `src/types/prompt.ts`.

**Tasks:**
- Define `PromptCollection` interface with required fields
- Implement `validateCollection()` function
- Add collection-related constants to validation rules

**Verification:**
- [x] TypeScript compilation succeeds
- [x] Validation function catches invalid collections

---

### [x] Step: Create API Request/Response Types
<!-- chat-id: 764d1b02-e64c-42c4-9252-7aa40a3924f9 -->

Add all v0.0.3 API types to `src/types/api.ts`.

**Tasks:**
- Add rating types: `AddRatingRequest`, `AddRatingResponse`, `MarkSuccessRequest`, `MarkSuccessResponse`
- Add comparison types: `RecordComparisonRequest`, `RecordComparisonResponse`
- Add refinement types: `RefinePromptRequest`, `RefinePromptResponse`, `PromptRefinementSuggestion`
- Add collection types: `CreateCollectionRequest`, `CreateCollectionResponse`, `UpdateCollectionRequest`, `UpdateCollectionResponse`, `ListCollectionsResponse`
- Add sharing types: `SharePromptRequest`, `SharePromptResponse`, `GetSharedPromptRequest`, `GetSharedPromptResponse`

**Verification:**
- [x] TypeScript compilation succeeds
- [x] All types properly exported

---

### [x] Step: Enhance PromptService with Quality Tracking
<!-- chat-id: 3a5fc8de-83cc-4637-81b8-b808af9e0f5d -->

Add rating, success tracking, and comparison methods to `src/services/drive/promptService.ts`.

**Tasks:**
- Implement `addRating(promptId: string, rating: number)` method
- Implement `markSuccess(promptId: string, success: boolean)` method
- Implement `recordComparison(winnerId: string, loserIds: string[])` method
- Add input validation for all methods
- Update prompts in Google Drive

**Verification:**
- [ ] Methods update prompt metadata correctly
- [ ] Changes persist to Google Drive
- [ ] Error handling works for invalid inputs
- [ ] Test with manual API calls

---

### [x] Step: Implement AI Prompt Refinement Service
<!-- chat-id: b30d1e72-7b2f-4e1e-ab40-cbd733d5a633 -->

Add `refinePrompt()` method to `src/services/ai/aiService.ts`.

**Tasks:**
- Create meta-prompt template for refinement
- Implement `refinePrompt(promptContent: string)` method
- Parse AI response into structured `PromptRefinementSuggestion[]`
- Add timeout handling (60 seconds)
- Add error handling for AI failures

**Verification:**
- [x] Method generates 3-5 refinement suggestions
- [x] Each suggestion includes content, explanation, and changes
- [x] Timeout prevents hanging
- [x] Gracefully handles AI errors
- [x] Test with various prompt inputs

---

### [x] Step: Create CollectionService
<!-- chat-id: 46f594be-d3dd-4f24-a570-52f8248cb3c7 -->

Implement new service for collection CRUD operations in `src/services/drive/collectionService.ts`.

**Tasks:**
- Create `CollectionService` class with DriveClient dependency injection
- Implement `ensureCollectionsFolder()` to create `/collections` subdirectory
- Implement CRUD methods: `createCollection()`, `getCollection()`, `listCollections()`, `updateCollection()`, `deleteCollection()`
- Add validation using `validateCollection()`
- Add retry logic and error handling

**Verification:**
- [x] Collections folder created in Google Drive
- [x] Create operation saves collection JSON
- [x] Read operation retrieves collection
- [x] Update operation modifies existing collection
- [x] Delete operation removes collection
- [x] Test with Google Drive integration

---

### [x] Step: Create ShareService
<!-- chat-id: 32ec884a-4132-439e-aa28-f5cf2ff4696c -->

Implement new service for prompt sharing in `src/services/drive/shareService.ts`.

**Tasks:**
- Create `ShareService` class with DriveClient dependency injection
- Implement `createShare()` to generate unique tokens
- Implement `getSharedPrompt()` to retrieve by token
- Add token generation (crypto.randomUUID or similar)
- Store share metadata in `/shares` subdirectory
- Implement optional expiration logic

**Verification:**
- [x] Share creation generates unique token
- [x] Share retrieval works with valid token
- [x] Invalid tokens return null
- [x] Expiration logic works (if implemented)
- [x] Test with Google Drive integration

---

## Phase 2: Backend API Routes

### [x] Step: Implement Rating API Routes
<!-- chat-id: 202d75ea-559f-4bb6-88d4-751ea185df0f -->

Create API endpoints for quality ratings.

**Tasks:**
- Create `src/app/api/drive/prompts/[id]/rate/route.ts`
- Implement POST handler for adding ratings (1-5 stars)
- Create `src/app/api/drive/prompts/[id]/mark-success/route.ts`
- Implement POST handler for success/failure tracking
- Add authentication checks
- Add error handling

**Verification:**
- [ ] POST to `/api/drive/prompts/[id]/rate` adds rating
- [ ] POST to `/api/drive/prompts/[id]/mark-success` updates counts
- [ ] Unauthorized requests return 401
- [ ] Invalid ratings return 400
- [ ] Test with Postman or curl

---

### [x] Step: Implement Comparison API Route
<!-- chat-id: c1b395ce-cb35-4867-b721-49f9b2be0d68 -->

Create API endpoint for recording comparison results.

**Tasks:**
- Create `src/app/api/drive/prompts/record-comparison/route.ts`
- Implement POST handler for comparison results
- Update winner's winCount and losers' lossCounts
- Update comparisonIds for all involved prompts
- Add authentication checks

**Verification:**
- [x] POST to `/api/drive/prompts/record-comparison` updates win/loss counts
- [x] All compared prompts have updated metadata
- [x] Test with multiple losers
- [x] Test with Postman or curl

---

### [x] Step: Implement AI Refinement API Route
<!-- chat-id: 66e3bd8c-9e9d-4529-9230-70751220fb14 -->

Create API endpoint for AI-powered prompt refinement.

**Tasks:**
- Create `src/app/api/ai/refine/route.ts`
- Implement POST handler calling `aiService.refinePrompt()`
- Add request validation
- Add timeout handling
- Return structured suggestions

**Verification:**
- [ ] POST to `/api/ai/refine` returns suggestions
- [ ] Response includes content, explanation, changes
- [ ] Handles AI initialization errors
- [ ] Handles timeout gracefully
- [ ] Test with various prompt content

---

### [x] Step: Implement Collections CRUD API Routes
<!-- chat-id: c156e91b-68c4-4be1-82cb-8ef170c00c12 -->

Create API endpoints for collection management.

**Tasks:**
- Create `src/app/api/drive/collections/route.ts` (GET, POST)
- Create `src/app/api/drive/collections/[id]/route.ts` (GET, PATCH, DELETE)
- Implement all CRUD operations
- Add authentication checks
- Add validation

**Verification:**
- [ ] GET /api/drive/collections lists all collections
- [ ] POST /api/drive/collections creates new collection
- [ ] GET /api/drive/collections/[id] retrieves specific collection
- [ ] PATCH /api/drive/collections/[id] updates collection
- [ ] DELETE /api/drive/collections/[id] removes collection
- [ ] Test full CRUD cycle with Postman

---

### [x] Step: Implement Sharing API Routes
<!-- chat-id: 33b00386-ad6a-4b67-b0be-1ef86b39d597 -->

Create API endpoints for prompt sharing.

**Tasks:**
- Create `src/app/api/drive/prompts/[id]/share/route.ts` (POST)
- Create `src/app/api/public/share/[token]/route.ts` (GET, no auth)
- Implement share creation with token generation
- Implement public share retrieval
- Add optional password handling (deferred if complex)

**Verification:**
- [ ] POST /api/drive/prompts/[id]/share generates share link
- [ ] GET /api/public/share/[token] retrieves prompt (no auth required)
- [ ] Invalid tokens return 404
- [ ] Shared prompt doesn't expose sensitive data
- [ ] Test in incognito window

---

## Phase 3: Evaluation Workbench UI (P0)

### [x] Step: Create PromptComparisonView Component
<!-- chat-id: f3df59e5-27a6-4fc5-8753-a8b0cc03e106 -->

Build the main comparison interface for A/B testing prompts.

**Tasks:**
- Create `src/components/comparison/PromptComparisonView.tsx`
- Implement multi-select prompt picker (2-4 prompts)
- Add single input textarea for test content
- Create side-by-side output display grid
- Add "Vote for Best" buttons
- Implement win rate display
- Add loading states per prompt

**Verification:**
- [x] Can select 2-4 prompts from library
- [x] Test input field works
- [x] Side-by-side layout displays correctly
- [x] Vote buttons call comparison API
- [x] Win rates update after voting
- [x] Responsive on mobile/tablet/desktop

---

### [x] Step: Create RefinementModal Component
<!-- chat-id: 6bba72a2-d44b-43b8-b439-deabc166eee6 -->

Build the AI refinement suggestions modal.

**Tasks:**
- Create `src/components/library/RefinementModal.tsx`
- Implement loading state during AI generation
- Display 3-5 suggestions with explanations
- Show list of changes for each suggestion
- Add "Apply as New Version" button per suggestion
- Add "Compare All" button (optional)
- Handle AI errors gracefully

**Verification:**
- [ ] Modal opens when "Improve" clicked
- [ ] Loading spinner shows during generation
- [ ] Suggestions display with proper formatting
- [ ] Apply button creates new prompt version
- [ ] Error messages display for failures
- [ ] Can close modal and return to prompt

---

### [x] Step: Create Comparison Page
<!-- chat-id: 213cc8e0-7322-42c1-a453-71d9e9a86a26 -->

Add a dedicated page for prompt comparison.

**Tasks:**
- Create `src/app/compare/page.tsx`
- Integrate PromptComparisonView component
- Add navigation link from main layout
- Handle authentication
- Add page metadata

**Verification:**
- [x] Page accessible at /compare
- [x] Requires authentication
- [x] Navigation link visible in header
- [x] PromptComparisonView renders correctly

---

## Phase 4: Workflows & Quality Tracking UI (P1)

### [x] Step: Enhance PromptDetailModal with Quality Features
<!-- chat-id: bdebe0d6-3ba9-445f-a958-1100a700335b -->

Add rating, success tracking, and refinement to prompt detail view.

**Tasks:**
- Modify `src/components/library/PromptDetailModal.tsx`
- Add "Improve" button (opens RefinementModal)
- Add 5-star rating widget
- Add "Mark as Success/Failure" buttons
- Display average rating and success rate in header
- Show comparison history (if available)
- Wire up API calls for all actions

**Verification:**
- [x] "Improve" button opens RefinementModal
- [x] Star rating widget functional
- [x] Success/failure buttons update counts
- [x] Average rating displays correctly
- [x] Success rate displays correctly
- [x] UI updates after actions

---

### [x] Step: Enhance PromptCard with Quality Indicators
<!-- chat-id: d52bb8bd-3e74-417c-bb3d-21a53b347984 -->

Add visual quality indicators to prompt cards.

**Tasks:**
- Modify `src/components/library/PromptCard.tsx`
- Display star rating (visual)
- Display success rate badge
- Display win rate (if compared)
- Add color-coding by quality (green/yellow/gray)
- Handle missing data gracefully

**Verification:**
- [x] Star rating displays on cards with ratings
- [x] Success rate badge shows when available
- [x] Win rate displays for compared prompts
- [x] Color-coding reflects quality
- [x] No errors for prompts without quality data

---

### [x] Step: Enhance LibraryLayout with Advanced Features
<!-- chat-id: 91c42066-374b-4628-af6c-7e7f4ba7cbc2 -->

Add collections tab, filters, and discovery features.

**Tasks:**
- Modify `src/components/library/LibraryLayout.tsx`
- Add "Collections" tab alongside "Prompts"
- Add filter dropdowns (rating, success rate, date range)
- Add "Find Similar" functionality to search
- Display quality metrics on prompt list
- Add sorting by quality metrics

**Verification:**
- [x] Collections tab visible and functional
- [x] Filter dropdowns work correctly
- [x] "Find Similar" uses vector similarity
- [x] Sorting by rating/success rate works
- [x] UI remains responsive

---

### [x] Step: Create CollectionBuilder Component
<!-- chat-id: 984bc8f0-22b7-4ed8-8f88-483d84d14284 -->

Build drag-and-drop interface for creating collections.

**Tasks:**
- Create `src/components/collections/CollectionBuilder.tsx`
- Implement prompt search/filter for adding prompts
- Add drag-and-drop reordering (native HTML5 or library)
- Add collection metadata editor (name, description, tags)
- Add save/cancel buttons
- Wire up collection API

**Verification:**
- [x] Can search and add prompts to collection
- [x] Drag-and-drop reordering works smoothly
- [x] Can edit collection metadata
- [x] Save button creates/updates collection
- [x] Cancel button discards changes

---

### [x] Step: Create CollectionCard Component
<!-- chat-id: a6915c93-6b56-4ddb-9286-17e71b319cc8 -->

Build card component for displaying collections.

**Tasks:**
- Create `src/components/collections/CollectionCard.tsx`
- Display collection name, description, tags
- Show prompt count
- Preview first 3 prompt titles
- Add "Open", "Edit", "Delete" actions
- Match styling with PromptCard

**Verification:**
- [ ] Collection info displays correctly
- [ ] Prompt preview accurate
- [ ] Actions trigger correct behaviors
- [ ] Styling consistent with app

---

### [x] Step: Create Collections Page
<!-- chat-id: 15fbdbb5-3650-4916-bd65-c2ee6a5d51c6 -->

Add dedicated page for managing collections.

**Tasks:**
- Create `src/app/collections/page.tsx`
- Display grid of CollectionCard components
- Add "New Collection" button
- Integrate CollectionBuilder for create/edit
- Handle authentication

**Verification:**
- [x] Page accessible at /collections
- [x] All collections display
- [x] "New Collection" opens builder
- [x] Edit/delete actions work
- [x] Navigation link in header

---

### [x] Step: Create Advanced Search Components
<!-- chat-id: d1098eaa-54cc-4b63-933f-4b1e1e86a4df -->

Build enhanced search and discovery UI.

**Tasks:**
- Create `src/components/search/AdvancedSearchBar.tsx` with filters
- Create `src/components/search/SimilarPrompts.tsx` for similarity search
- Create `src/components/search/TagCloud.tsx` for tag browsing
- Integrate with existing search functionality
- Add filter state management

**Verification:**
- [x] Advanced filters work (rating, success rate, date)
- [x] Similar prompts feature finds related prompts
- [x] Tag cloud displays and filters correctly
- [x] Search performance acceptable

---

## Phase 5: Sharing & Polish UI (P2)

### [x] Step: Create ShareDialog Component
<!-- chat-id: 42d9883d-758d-4261-a0ee-30065f8d1b0a -->

Build dialog for generating shareable links.

**Tasks:**
- Create `src/components/library/ShareDialog.tsx`
- Add "Generate Link" button
- Display generated URL
- Add "Copy to Clipboard" button
- Add optional password field (deferred if complex)
- Add optional expiration selector (deferred if complex)
- Wire up share API

**Verification:**
- [ ] Dialog opens from "Share" button
- [ ] Link generation works
- [ ] Copy to clipboard functional
- [ ] URL format correct
- [ ] Dialog closes properly

---

### [x] Step: Integrate ShareDialog into PromptDetailModal
<!-- chat-id: bab386ff-e4e8-4e0f-b1d8-ff444af241e2 -->

Add share functionality to prompt details.

**Tasks:**
- Modify `src/components/library/PromptDetailModal.tsx`
- Add "Share" button
- Integrate ShareDialog component
- Handle share state management

**Verification:**
- [ ] "Share" button visible in modal
- [ ] ShareDialog opens correctly
- [ ] Share functionality works end-to-end

---

### [x] Step: Create Public Shared Prompt Page
<!-- chat-id: e610df4a-e3d4-42a4-8b8f-faec07737250 -->

Build public page for viewing shared prompts.

**Tasks:**
- Create `src/app/share/[token]/page.tsx`
- Implement public layout (no auth required)
- Display prompt title, content, tags
- Add "Copy Content" button
- Add read-only styling
- Handle invalid tokens

**Verification:**
- [x] Page accessible without authentication
- [x] Shared prompt displays correctly
- [x] Copy content button works
- [x] Invalid tokens show error message
- [x] Clean, minimal design
- [x] Test in incognito window

---

## Phase 6: Testing & Polish

### [x] Step: Manual End-to-End Testing
<!-- chat-id: 692bcca4-2b0d-428d-bb9a-a1f6c9ce6d93 -->

Perform comprehensive manual testing of all features.

**Tasks:**
- Test all P0 features (comparison, refinement)
- Test all P1 features (collections, quality tracking, search)
- Test all P2 features (sharing)
- Test on multiple browsers (Chrome, Firefox, Safari)
- Test on mobile devices
- Document any bugs found

**Verification:**
- [x] All P0 features work correctly
- [x] All P1 features work correctly
- [x] All P2 features work correctly
- [x] No console errors
- [x] Responsive design works
- [x] Performance acceptable

---

### [x] Step: Code Quality & Linting
<!-- chat-id: ffdcdf87-7bf2-429d-b584-b8b7e34fe646 -->

Ensure code quality and fix linting issues.

**Tasks:**
- Run `npm run lint` and fix all issues
- Run `npm run build` and fix any build errors
- Review code for consistency with existing patterns
- Add comments for complex logic
- Remove debug console.logs

**Verification:**
- [x] `npm run lint` passes with 0 errors
- [x] `npm run build` succeeds
- [x] Code follows project conventions
- [x] No unnecessary console logs

---

### [x] Step: Documentation & Finalization
<!-- chat-id: cf44b53a-6dec-4428-aad4-7df5c99d5885 -->

Create user-facing documentation and implementation report.

**Tasks:**
- Write implementation report to `report.md`
- Document major changes
- Document testing approach
- List any known issues or limitations
- Note deferred features (password protection, QR codes, etc.)

**Verification:**
- [x] Report.md completed with all sections
- [x] Major changes documented
- [x] Testing summary included
- [x] Known issues listed
