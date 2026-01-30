# AI Prompt Paster v2.0: Master Design & Implementation Document

**Author:** Manus AI (Dojo)  
**Version:** 1.0  
**Date:** 2026-01-30  
**Status:** Final Design for Implementation

---

## Executive Summary

**AI Prompt Paster v2.0** represents a fundamental reimagining of the original prompt pastebin concept. Rather than a simple text-sharing tool, it becomes an **intelligent prompt library** that helps users build and curate a personal knowledge base over time. By leveraging client-side embedded LLM processing via WebLLM, the system automatically organizes pasted content while maintaining complete privacy and eliminating server-side inference costs. The tool integrates seamlessly with Google Drive for persistent storage and feeds into the broader **Dojo Genesis** ecosystem, creating a pipeline from personal context capture to collective intelligence.

---

## 1. Vision & Core Philosophy

### 1.1 The Problem

Traditional pastebins like Pastebin.com have become obsolete in the modern development landscape. They suffer from three critical failures: **privacy risks** (public-by-default content indexed by search engines, leading to credential leaks), **poor user experience** (ad-heavy interfaces that detract from usability), and **missing modern features** (no version control, collaboration, or intelligent organization). Meanwhile, developers and knowledge workers accumulate hundreds of prompts, code snippets, and context fragments across various tools with no systematic way to organize, search, or reuse them.

### 1.2 The Solution

AI Prompt Paster v2.0 transforms pasting from a temporary action into a **knowledge-building activity**. Each paste becomes a permanent, organized, searchable entry in the user's personal library. The system uses an embedded LLM to automatically analyze content and suggest organizational structures, making it effortless to build a rich, curated collection over time. This approach combines the simplicity of traditional pastebins with the intelligence of modern AI assistants and the organizational power of tools like Notion.

### 1.3 Core Principles

The design adheres to the **11-11 Master Blueprint** principles of sustainable, human-centered AI development:

**Privacy-First Architecture:** All AI processing happens client-side in the user's browser. No content is ever sent to external servers for analysis. The user's prompts remain completely private, stored only in their personal Google Drive.

**Zero Server Costs:** By using WebLLM for in-browser inference, the system eliminates API costs for AI processing. This makes the tool sustainable to operate and free to use.

**Calm, Premium Experience:** The UI draws inspiration from Notion, emphasizing clarity, beauty, and fluid interactions. Framer Motion animations create a sense of calm and polish.

**Open Source Core:** The entire codebase will be open source, allowing the community to fork, extend, and improve the tool.

**Integration with Dojo Genesis:** The tool is not a standalone island but a foundational component of the larger Dojo ecosystem, enabling prompts to flow from personal libraries into the collective Commons.

---

## 2. Technical Architecture

### 2.1 Technology Stack

The system is built as a modern web application optimized for client-side processing and seamless cloud integration.

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Frontend Framework** | Next.js 14 (App Router) | Modern React framework with excellent performance, built-in routing, and alignment with the 11-11 tech stack. |
| **Styling** | Tailwind CSS | Utility-first CSS framework enabling rapid UI development with consistent design tokens. |
| **Animations** | Framer Motion | Industry-leading animation library for creating fluid, premium interactions. |
| **AI Engine** | WebLLM (Client-Side) | High-performance in-browser LLM inference using WebGPU acceleration. Enables privacy-first, cost-free AI processing. |
| **Authentication** | NextAuth.js (Google OAuth) | Secure, standards-based authentication required for Google Drive integration. |
| **Storage Backend** | Google Drive API | Provides persistent, synced storage for the user's prompt library with built-in version history. |
| **Client-Side Database** | IndexedDB | Browser-native database for storing vector embeddings and enabling fast semantic search. |

### 2.2 System Architecture Diagram

The architecture emphasizes client-side processing with minimal server interaction.

```
┌─────────────────────────────────────────────────────────────────┐
│                     Browser (Client-Side)                        │
│                                                                   │
│  ┌──────────────────┐         ┌──────────────────┐              │
│  │   Next.js UI     │◄────────┤  WebLLM Engine   │              │
│  │   Components     │         │  (Web Worker)    │              │
│  └────────┬─────────┘         └──────────────────┘              │
│           │                                                       │
│           │                   ┌──────────────────┐              │
│           ├───────────────────┤   IndexedDB      │              │
│           │                   │ (Vector Store)   │              │
│           │                   └──────────────────┘              │
│           │                                                       │
│           │                   ┌──────────────────┐              │
│           └───────────────────┤ Google Drive API │              │
│                               │     Client       │              │
│                               └────────┬─────────┘              │
└────────────────────────────────────────┼──────────────────────┘
                                         │
                                         ▼
                              ┌──────────────────┐
                              │  Google Cloud    │
                              │  - Auth          │
                              │  - Drive Storage │
                              └──────────────────┘
```

### 2.3 Data Flow

**Paste Flow:**
1. User pastes content into the Paster component
2. Content is sent to WebLLM (running in Web Worker) for analysis
3. WebLLM generates title, tags, and folder suggestion
4. User reviews and optionally edits the suggestions
5. Prompt is saved as JSON to Google Drive via API
6. Vector embedding is generated and stored in IndexedDB for search

**Retrieval Flow:**
1. User opens the Library view
2. Application fetches prompt metadata from Google Drive
3. Prompts are displayed in Notion-inspired card layout
4. User can filter by folder, tags, or use semantic search
5. Semantic search queries IndexedDB vector store for fast results

---

## 3. Core Features

### 3.1 The Paster: Intelligent Content Ingestion

The Paster is the primary entry point for new content. It is designed to be simple and unobtrusive, allowing users to quickly capture context without friction.

**User Experience:**
The interface consists of a large, clean text area with subtle placeholder text inviting the user to paste. As soon as content is pasted, a gentle loading animation appears while the WebLLM engine analyzes the content. Within seconds, the system presents three AI-generated suggestions displayed in an elegant card: a **title** (capturing the essence of the content), **tags** (3-5 relevant keywords), and a **folder path** (suggesting where this fits in the user's existing organizational structure).

Each suggestion is presented as an editable field, allowing the user to refine the AI's recommendations. The user can accept all suggestions with a single click or make adjustments before saving. Once saved, the prompt is immediately added to the library and becomes searchable.

**Technical Implementation:**
The Paster component uses a controlled textarea with debounced input handling. When content is pasted, it triggers the `analyzeContent` function in the WebLLM service, which runs in a Web Worker to avoid blocking the UI. The analysis uses a carefully crafted system prompt that instructs the model to extract key information and suggest organizational metadata. The component uses React state to manage the loading state and display the suggestions in a smooth, animated reveal.

### 3.2 The Library: Notion-Inspired Organization

The Library is where users spend most of their time, browsing and managing their collection of prompts. The design takes heavy inspiration from Notion, featuring a clean hierarchical structure that is both powerful and intuitive.

**User Experience:**
The Library view is divided into two main sections. On the left is a collapsible sidebar showing the folder tree, allowing users to navigate their organizational structure. Folders can be nested arbitrarily deep, and each folder displays a count of prompts it contains. The main content area displays prompts as cards in a responsive grid layout. Each card shows the prompt's title, a truncated preview of the content, its tags as colorful pills, and metadata like creation date.

Users can create new folders directly from the sidebar, drag prompts between folders, and use a powerful tag-based filtering system. Multiple tags can be combined to narrow results, and the interface updates instantly as filters are applied. The entire experience is smooth and responsive, with subtle animations guiding the user's attention.

**Technical Implementation:**
The Library uses a compound component pattern with separate components for the sidebar, folder tree, prompt grid, and individual prompt cards. State management is handled through React Context to avoid prop drilling. The folder tree component uses recursive rendering to handle arbitrary nesting depth. The filtering system uses a combination of client-side filtering for instant feedback and efficient data structures to handle large libraries. Framer Motion provides layout animations when cards are added, removed, or filtered.

### 3.3 Semantic Search

Traditional keyword search fails when users remember the concept but not the exact words. Semantic search solves this by understanding the meaning and intent behind queries.

**User Experience:**
A prominent search bar sits at the top of the Library view. As the user types, results appear instantly below, ranked by relevance. The search understands natural language queries like "find my prompts about creating Python web servers" or "show me database migration examples" and returns relevant results even if those exact phrases don't appear in the prompts. Each result highlights why it matched, helping users understand the connection.

**Technical Implementation:**
When prompts are saved, the system generates vector embeddings using the WebLLM model and stores them in IndexedDB alongside the prompt ID. The embedding generation happens asynchronously to avoid blocking the UI. When a user searches, the query is also converted to a vector embedding, and a cosine similarity search is performed against all stored embeddings. The top results are retrieved and displayed. This approach provides fast, privacy-preserving semantic search entirely in the browser.

### 3.4 Prompt Composer

The Composer helps users write better prompts by surfacing relevant context from their existing library and providing tools for combining and refining prompts.

**User Experience:**
The Composer opens as a full-screen modal with a large text editor. As the user types, a sidebar appears showing related prompts from their library, updated in real-time based on semantic similarity to what they're writing. Users can click any suggested prompt to insert it at the cursor position or view it in a preview pane. The Composer also supports variable management, allowing users to define placeholders like `{{topic}}` or `{{tone}}` that can be filled in when the prompt is used. A toolbar provides quick actions for formatting, inserting templates, and chaining multiple prompts together.

**Technical Implementation:**
The Composer component uses a rich text editor (likely a lightweight Markdown editor) with custom plugins for variable insertion and prompt chaining. As the user types, a debounced handler triggers semantic search against the library, and the top results are displayed in a sidebar. The variable system uses a simple template string parser to identify and highlight variables in the editor. When prompts are chained, they're concatenated with configurable separators and formatting.

---

## 4. Data Model

Each prompt is stored as a JSON file in the user's Google Drive within a dedicated application folder (`/AI Prompt Paster/`). This approach provides several benefits: prompts are human-readable, the format is simple and extensible, and users maintain full ownership of their data.

### 4.1 Prompt Schema

```json
{
  "id": "uuid-v4-string",
  "title": "Generate a Python Flask Server",
  "content": "Write a basic Python Flask server with a single endpoint that returns 'Hello, World!'",
  "tags": ["python", "flask", "web-server", "backend"],
  "folderPath": "/Code Snippets/Python/",
  "createdAt": "2026-01-30T10:00:00Z",
  "modifiedAt": "2026-01-30T10:00:00Z",
  "sourceUrl": "https://example.com/source-of-paste",
  "embedding": [0.123, 0.456, ...] // Optional: stored in IndexedDB, not Drive
}
```

### 4.2 Folder Structure in Google Drive

```
/AI Prompt Paster/
├── prompts/
│   ├── {uuid-1}.json
│   ├── {uuid-2}.json
│   └── {uuid-3}.json
├── metadata.json  // Stores folder structure and app settings
└── embeddings/    // Optional: backup of embeddings
```

The `metadata.json` file stores the folder hierarchy and user preferences, allowing the application to quickly reconstruct the organizational structure without scanning all prompt files.

---

## 5. Implementation Roadmap

The project will be developed in six phases, following a backend-first approach that prioritizes core functionality before UI polish.

### Phase 1: Project Setup & Authentication (Week 1)

**Objective:** Establish the foundational Next.js project and implement secure Google OAuth authentication.

**Key Deliverables:**
- Initialized Next.js 14 project with TypeScript and Tailwind CSS
- NextAuth.js configured with Google Provider
- Google Cloud Project created with OAuth 2.0 credentials
- Environment configuration documented
- Basic login/logout UI and flow verified

**Success Criteria:** Users can successfully authenticate with their Google account and see their authentication status in the UI.

### Phase 2: Google Drive Integration (Week 2)

**Objective:** Build the core backend logic for interacting with Google Drive.

**Key Deliverables:**
- Google Drive API client wrapper service
- CRUD operations for prompt files (create, read, update, delete)
- App data folder logic ensuring proper isolation
- Next.js API routes exposing CRUD operations
- Error handling and retry logic for network failures

**Success Criteria:** The application can successfully create, read, update, and delete JSON files in the user's Google Drive app folder through API calls.

### Phase 3: WebLLM Integration (Week 3)

**Objective:** Integrate the WebLLM engine for client-side AI processing.

**Key Deliverables:**
- WebLLM package installed and configured
- AI service with model initialization (Phi-3 or Llama-3-8B)
- Analysis functions: `generateTitle`, `generateTags`, `suggestFolder`
- Web Worker implementation to offload processing
- Loading states and error handling for model operations

**Success Criteria:** The system can analyze pasted content and generate accurate titles, tags, and folder suggestions entirely in the browser.

### Phase 4: Core UI - Paster & Library (Weeks 4-5)

**Objective:** Build the primary user interface for pasting content and viewing the library.

**Key Deliverables:**
- Paster component with text input and AI suggestion display
- Library view with folder sidebar and prompt card grid
- Folder creation and navigation functionality
- Tag-based filtering system
- Save flow connecting Paster to Google Drive
- Responsive design for mobile and desktop

**Success Criteria:** Users can paste content, review AI suggestions, save prompts to their library, and navigate their organized collection.

### Phase 5: Advanced Features - Search & Composer (Weeks 6-7)

**Objective:** Implement semantic search and the prompt composition assistant.

**Key Deliverables:**
- Vector embedding generation for all prompts
- IndexedDB integration for storing embeddings
- Semantic search with cosine similarity ranking
- Prompt Composer UI with real-time suggestions
- Variable management system
- Prompt chaining functionality

**Success Criteria:** Users can find prompts using natural language queries and compose new prompts with assistance from their existing library.

### Phase 6: Finalization & Deployment (Week 8)

**Objective:** Polish the user experience and prepare for production deployment.

**Key Deliverables:**
- UI/UX refinement with Framer Motion animations
- Comprehensive responsive design testing
- End-to-end testing of all features
- Performance optimization (code splitting, lazy loading)
- Documentation (README, user guide)
- Vercel deployment with environment configuration

**Success Criteria:** The application is deployed to production, fully functional, performant, and ready for users.

---

## 6. Zenflow Automation Protocol

Following the Zenflow Automation Protocol, the following configuration will be maintained throughout development:

| Field | Command |
|-------|---------|
| **Setup Script** | `npm install && npm install @mlc-ai/web-llm @googleapis/drive` |
| **Dev Server Script** | `npm run dev` |
| **Cleanup Script** | `npm run lint && npm run type-check` |
| **Copy Files** | `.env.local` |

---

## 7. Integration with Dojo Genesis

AI Prompt Paster v2.0 is designed as a foundational component of the **Dojo Genesis** ecosystem. The integration follows a clear data flow:

**Personal Library → Dojo Commons:** Users can selectively promote prompts from their personal library to the Dojo Commons, making them available to the broader community. This creates a curated, high-quality collection of prompts that benefits all users.

**Dojo Agent Integration:** The Dojo Agent can access a user's prompt library (with permission) to provide context-aware suggestions during thinking sessions. This allows the agent to reference the user's existing knowledge and patterns.

**Seed Module Creation:** Well-crafted prompts in the library can be elevated to Seed Modules, becoming reusable thinking patterns that can be applied across multiple sessions and projects.

The integration respects user privacy and autonomy. Prompts remain private by default, and users have full control over what they choose to share with the Commons.

---

## 8. Out of Scope (v1.0)

To maintain focus and ensure a high-quality initial release, the following features are explicitly out of scope for v1.0:

**Public Sharing:** No functionality for sharing prompts via public URLs or embedding prompts on external websites. The tool is designed for personal use.

**Real-Time Collaboration:** No multi-user editing, comments, or collaborative workspaces. These features may be considered for future versions.

**Advanced Version Control:** While Google Drive provides basic version history, there will be no Git-like branching, merging, or diff visualization in v1.0.

**Multiple Cloud Providers:** Only Google Drive will be supported for storage. Integration with Dropbox, OneDrive, or other providers may be added later.

**Mobile Native Apps:** The initial release is a web application optimized for desktop and mobile browsers. Native iOS and Android apps are not planned for v1.0.

**AI Model Customization:** Users will not be able to fine-tune or customize the embedded LLM in v1.0. The system will use a pre-selected model optimized for the task.

---

## 9. Success Metrics

The success of AI Prompt Paster v2.0 will be measured across three dimensions:

**Adoption Metrics:**
- Number of authenticated users within the first month
- Average number of prompts saved per user
- User retention rate (weekly active users)

**Effectiveness Metrics:**
- Time from paste to save (target: under 10 seconds)
- Accuracy of AI-generated titles and tags (measured through user edits)
- Search success rate (percentage of searches resulting in prompt selection)

**Quality Metrics:**
- User satisfaction score (collected through in-app feedback)
- Performance metrics (page load time, search latency)
- Error rate and system reliability

---

## 10. Conclusion

AI Prompt Paster v2.0 represents a significant evolution from the original concept. By combining the simplicity of traditional pastebins with the intelligence of modern AI and the organizational power of tools like Notion, it creates a new category of tool: the **intelligent prompt library**. The use of client-side embedded LLMs ensures complete privacy while eliminating server costs, making the tool sustainable and accessible. Integration with Dojo Genesis creates a pathway for personal knowledge to contribute to collective intelligence, embodying the principles of the 11-11 Master Blueprint.

The implementation roadmap is realistic and achievable, with clear phases and success criteria. The technology stack is modern, proven, and aligned with the broader ecosystem. Most importantly, the tool solves a real problem: helping users capture, organize, and reuse the growing collection of prompts and context fragments that are essential to working effectively with AI.

This is not just a pastebin. It's a thinking partner, a knowledge garden, and a bridge between personal practice and collective wisdom.

---

**Next Steps:**
1. Review and approve this design document
2. Create GitHub repository for the project
3. Initialize Next.js project with Zenflow
4. Begin Phase 1 implementation

**Questions or Feedback:**
This document is a living blueprint. If you have questions, suggestions, or want to refine any aspect of the design, let's discuss before moving to implementation.
