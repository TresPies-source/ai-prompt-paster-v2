# v0.0.2 Manual Testing Checklist

**Version**: v0.0.2  
**Testing Date**: _____________  
**Tester**: _____________

---

## Pre-Testing Setup

- [ ] Application running locally (`npm run dev`)
- [ ] Google Drive authentication working
- [ ] Test Google Drive folder created
- [ ] Browser console open for error monitoring

---

## 1. Version History Testing (P0)

### 1.1 Basic Version Tracking
- [ ] Create a new prompt in Paster
- [ ] Verify prompt saved successfully
- [ ] Edit the prompt title and save
- [ ] Edit the prompt content and save
- [ ] Make 3-4 total edits
- [ ] Open PromptDetailModal
- [ ] Click "History" button
- [ ] **Expected**: VersionHistoryModal opens with list of versions

### 1.2 Version List Display
- [ ] Verify version list shows all edits
- [ ] Check version numbers increment correctly (1, 2, 3...)
- [ ] Verify timestamps are formatted correctly
- [ ] Verify "Current Version" badge on latest version
- [ ] **Expected**: All versions visible with metadata

### 1.3 Version Comparison
- [ ] Select two different versions from history
- [ ] Click "Compare Selected Versions"
- [ ] **Expected**: DiffViewer opens showing side-by-side diff
- [ ] Verify additions highlighted in green
- [ ] Verify deletions highlighted in red
- [ ] Verify line numbers displayed correctly

### 1.4 Version Restore
- [ ] Select an older version
- [ ] Click "Restore This Version"
- [ ] **Expected**: Confirmation dialog appears
- [ ] Confirm restoration
- [ ] **Expected**: Modal closes, prompt content updated
- [ ] Reopen History
- [ ] Verify new version created (not overwrite)
- [ ] **Expected**: Version count increased by 1

### 1.5 Error Scenarios
- [ ] Try viewing history for newly created prompt (no edits yet)
- [ ] **Expected**: Shows single version or empty state
- [ ] Disconnect network and try loading history
- [ ] **Expected**: Error message displayed gracefully

---

## 2. Prompt Templates Testing (P0)

### 2.1 Template Creation
- [ ] Create a prompt with template variables:
  ```
  Hello {{name}}, welcome to {{company}}!
  Your role is {{role}}.
  ```
- [ ] Save the prompt
- [ ] Open PromptDetailModal
- [ ] Click "Save as Template"
- [ ] **Expected**: Success notification
- [ ] Verify `isTemplate` field set in backend
- [ ] Verify variables extracted: ["name", "company", "role"]

### 2.2 Template Library
- [ ] Click "Start from Template" in Paster
- [ ] **Expected**: TemplateLibraryModal opens
- [ ] Verify created template appears in list
- [ ] Verify template shows variable indicators
- [ ] Create 2-3 more templates
- [ ] Verify all templates shown
- [ ] Test search/filter in template library

### 2.3 Template Instantiation
- [ ] Select a template from library
- [ ] **Expected**: VariableInputForm appears
- [ ] Verify input fields for each variable
- [ ] Fill in variable values:
  - name: "John"
  - company: "Acme Corp"
  - role: "Developer"
- [ ] Click "Create from Template"
- [ ] **Expected**: New prompt created with substituted values
- [ ] Verify content shows "Hello John, welcome to Acme Corp!"
- [ ] Verify original template unchanged

### 2.4 Edge Cases
- [ ] Create template with repeated variable: `{{name}} and {{name}}`
- [ ] **Expected**: Only one input field for "name"
- [ ] Create template with no variables
- [ ] **Expected**: Creates copy immediately (no input form)
- [ ] Create template with special characters: `{{user-name}}`
- [ ] **Expected**: Variable extracted correctly (or validation error if unsupported)

---

## 3. Preview Mode Testing (P1)

### 3.1 AI Analysis Preview
- [ ] Paste content into Paster
- [ ] **Expected**: AI analysis runs automatically
- [ ] Verify title suggestion appears in editable field
- [ ] Verify tag suggestions appear (editable)
- [ ] Verify folder suggestion appears (editable)
- [ ] **Expected**: Prompt NOT auto-saved yet

### 3.2 Manual Editing
- [ ] Modify suggested title
- [ ] Add/remove tags
- [ ] Change folder selection
- [ ] **Expected**: All fields accept user input
- [ ] Verify visual indication this is preview mode

### 3.3 Regenerate Functionality
- [ ] Click "Regenerate" button
- [ ] **Expected**: AI re-analyzes content
- [ ] Verify new suggestions generated
- [ ] Verify user edits cleared (or ask to confirm)
- [ ] Test regenerate multiple times

### 3.4 Save Confirmation
- [ ] Make final edits to AI suggestions
- [ ] Click "Save Prompt" button
- [ ] **Expected**: Prompt saved to Google Drive
- [ ] Verify saved with user-modified metadata (not AI original)
- [ ] Verify prompt appears in Library

### 3.5 Cancel/Clear
- [ ] Paste content and get AI suggestions
- [ ] Click "Cancel" or "Clear"
- [ ] **Expected**: Form clears, nothing saved
- [ ] Verify no orphan files in Google Drive

---

## 4. Export Functionality Testing (P1)

### 4.1 Single Prompt Export (JSON)
- [ ] Go to Library
- [ ] Select a single prompt
- [ ] Click "Export" button
- [ ] Select format: JSON
- [ ] **Expected**: File downloads
- [ ] Open downloaded JSON file
- [ ] Verify structure includes:
  - `id`, `title`, `content`, `tags`, `folderPath`
  - `createdAt`, `updatedAt`
  - v0.0.2 fields if present

### 4.2 Multiple Prompts Export (JSON)
- [ ] Select 3-5 prompts
- [ ] Click "Export"
- [ ] Select format: JSON
- [ ] **Expected**: Array of prompts downloaded
- [ ] Verify file named appropriately (e.g., `prompts_export_2026-01-30.json`)

### 4.3 Markdown Export
- [ ] Select prompts
- [ ] Click "Export"
- [ ] Select format: Markdown
- [ ] **Expected**: .md file downloads
- [ ] Open file in text editor
- [ ] Verify frontmatter format:
  ```markdown
  ---
  title: Example
  tags: [tag1, tag2]
  ---
  # Content here
  ```

### 4.4 Export All
- [ ] Click "Export All" option
- [ ] Select format
- [ ] **Expected**: All library prompts exported
- [ ] Verify count matches library size

---

## 5. Import Functionality Testing (P1)

### 5.1 Valid JSON Import
- [ ] Export prompts as JSON (use above test)
- [ ] Click "Import" button
- [ ] Upload exported JSON file
- [ ] **Expected**: Import preview appears
- [ ] Verify shows prompt count and details
- [ ] Click "Confirm Import"
- [ ] **Expected**: Prompts created successfully
- [ ] Verify prompts appear in Library

### 5.2 Valid Markdown Import
- [ ] Export prompts as Markdown
- [ ] Click "Import"
- [ ] Upload .md file
- [ ] **Expected**: Parsed correctly
- [ ] Verify metadata extracted from frontmatter
- [ ] Confirm import
- [ ] Verify prompts created

### 5.3 Error Handling
- [ ] Upload empty file
- [ ] **Expected**: Error message "No valid prompts found"
- [ ] Upload plain text file (not JSON/MD)
- [ ] **Expected**: Format error message
- [ ] Upload malformed JSON: `{invalid`
- [ ] **Expected**: Parse error with helpful message
- [ ] Upload JSON missing required fields
- [ ] **Expected**: Validation error specifying missing fields

### 5.4 Large File Import
- [ ] Create export with 20+ prompts
- [ ] Import the large file
- [ ] **Expected**: Progress indicator shown
- [ ] Verify all prompts imported
- [ ] Check for performance issues

---

## 6. Analytics Testing (P2)

### 6.1 View Tracking
- [ ] Open a prompt in PromptDetailModal
- [ ] Close and reopen same prompt
- [ ] Repeat 3-4 times
- [ ] **Expected**: `viewCount` increments each time
- [ ] Check `lastUsedAt` timestamp updates
- [ ] Verify tracking API called (check network tab)

### 6.2 Most Used Section
- [ ] Open Library
- [ ] Navigate to "Most Used" section
- [ ] **Expected**: Prompts sorted by `viewCount` (highest first)
- [ ] Verify only prompts with views > 0 shown
- [ ] Open a different prompt multiple times
- [ ] Refresh Library
- [ ] **Expected**: "Most Used" order updated

### 6.3 Recently Used Section
- [ ] Navigate to "Recently Used" section
- [ ] **Expected**: Prompts sorted by `lastUsedAt` (most recent first)
- [ ] Open an old prompt
- [ ] Refresh Library
- [ ] **Expected**: That prompt moves to top of "Recently Used"

### 6.4 Analytics Display
- [ ] View PromptCard in Library
- [ ] Verify view count badge visible
- [ ] Verify "last used" timestamp shown (e.g., "2 days ago")
- [ ] Open PromptDetailModal
- [ ] Verify metadata section shows analytics

---

## 7. Backward Compatibility Testing (P2)

### 7.1 Old Prompt Format
- [ ] Load prompts created before v0.0.2
- [ ] **Expected**: Prompts load without errors
- [ ] Verify missing fields default appropriately:
  - `isTemplate` → false
  - `variables` → []
  - `viewCount` → 0
  - `version` → 1

### 7.2 Migration Path
- [ ] Edit an old prompt
- [ ] Save changes
- [ ] **Expected**: v0.0.2 fields added automatically
- [ ] Verify version incremented
- [ ] Verify `updatedAt` timestamp set

---

## 8. Integration Testing (Cross-Feature)

### 8.1 Template + Version History
- [ ] Create template with variables
- [ ] Create instance from template
- [ ] Edit the instance
- [ ] View version history
- [ ] **Expected**: Shows both original (from template) and edits

### 8.2 Export + Import + Analytics
- [ ] Export prompts with analytics data
- [ ] Import into different account/environment
- [ ] **Expected**: Analytics data preserved (`viewCount`, `lastUsedAt`)
- [ ] Verify imported prompts show in "Most Used"

### 8.3 Preview + Templates
- [ ] Start from template in Paster
- [ ] Fill variables
- [ ] **Expected**: Enter preview mode with template content
- [ ] Edit AI suggestions
- [ ] Save
- [ ] Verify final prompt has both template content AND user edits

---

## 9. Error Scenario Testing

### 9.1 Network Failures
- [ ] Disconnect network
- [ ] Try loading version history
- [ ] **Expected**: "Unable to load versions" error
- [ ] Try importing file
- [ ] **Expected**: Network error message
- [ ] Reconnect network
- [ ] Retry operations
- [ ] **Expected**: Work correctly after reconnect

### 9.2 Google Drive API Errors
- [ ] Test with invalid file ID
- [ ] **Expected**: 404 Not Found error
- [ ] Test with revoked Drive permissions
- [ ] **Expected**: 403 Forbidden error with clear message
- [ ] Test quota exceeded scenario (if possible)
- [ ] **Expected**: Quota error with suggestions

### 9.3 Concurrent Edit Simulation
- [ ] Open same prompt in two browser tabs
- [ ] Edit in both tabs
- [ ] Save from tab 1
- [ ] Save from tab 2
- [ ] **Expected**: Both versions saved (conflict handling)
- [ ] Check version history shows both

---

## 10. UI/UX Polish Testing (P2)

### 10.1 Animations
- [ ] Open/close modals
- [ ] **Expected**: Smooth Framer Motion transitions
- [ ] Switch between sections in Library
- [ ] **Expected**: Fade animations
- [ ] Hover over buttons and cards
- [ ] **Expected**: Subtle hover effects

### 10.2 Accessibility
- [ ] Tab through all interactive elements
- [ ] **Expected**: Logical focus order
- [ ] Verify ARIA labels on icon buttons
- [ ] Test with screen reader (VoiceOver/NVDA)
- [ ] **Expected**: All actions announced
- [ ] Check color contrast ratios
- [ ] Verify keyboard shortcuts work

### 10.3 Responsive Design
- [ ] Resize browser to mobile width (375px)
- [ ] **Expected**: All features usable on small screens
- [ ] Test tablet width (768px)
- [ ] Test large desktop (1920px)
- [ ] Verify modals responsive
- [ ] Check diff viewer on mobile

### 10.4 Loading States
- [ ] Trigger slow network (throttle in DevTools)
- [ ] Observe loading skeletons/spinners
- [ ] **Expected**: Clear indication of loading
- [ ] Verify no "flash of empty state"

### 10.5 Error States
- [ ] Trigger various errors (see above)
- [ ] **Expected**: User-friendly error messages
- [ ] Verify error doesn't crash app
- [ ] Check error boundaries catch failures

---

## 11. Performance Testing

### 11.1 Large Library
- [ ] Create 50+ prompts (can import)
- [ ] Load Library
- [ ] **Expected**: Loads within 2-3 seconds
- [ ] Scroll through list
- [ ] **Expected**: Smooth scrolling, no lag

### 11.2 Version History with Many Versions
- [ ] Edit a prompt 20+ times
- [ ] Load version history
- [ ] **Expected**: All versions load
- [ ] Compare distant versions
- [ ] **Expected**: Diff computed quickly

### 11.3 Large Prompt Content
- [ ] Create prompt with 5000+ characters
- [ ] Save and load
- [ ] View in diff viewer
- [ ] Export/import
- [ ] **Expected**: No performance degradation

---

## Test Summary

**Total Tests**: _____ / _____  
**Passed**: _____  
**Failed**: _____  
**Blocked**: _____  

### Critical Issues Found
1. _____________________________
2. _____________________________
3. _____________________________

### Minor Issues Found
1. _____________________________
2. _____________________________
3. _____________________________

### Recommendations
- _____________________________
- _____________________________
- _____________________________

---

**Testing Completed**: _____ / _____ / _____  
**Tester Signature**: _____________________  
**Status**: ⬜ Ready for Production  |  ⬜ Needs Fixes
