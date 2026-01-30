# AI Prompt Paster v2.0: Zenflow Implementation Plan

**Author:** Manus AI (Dojo)
**Version:** 1.0
**Date:** 2026-01-30

This document outlines the implementation plan for **AI Prompt Paster v2.0**, following the Zenflow Automation Protocol.

## Zenflow Protocol Configuration

| Field | Command |
| :--- | :--- |
| **Setup Script** | `npm install && npm install @mlc-ai/web-llm @google-cloud/local-auth @googleapis/drive` |
| **Dev Server Script** | `npm run dev` |
| **Cleanup Script** | `npm run lint` |
| **Copy Files** | `.env.local` |

## Implementation Phases

The project will be developed in phases, prioritizing a backend-first approach for core functionality before building the UI.

### Phase 1: Project Setup & Authentication

**Goal:** Initialize the Next.js project and set up Google OAuth for authentication.

**Tasks:**
1.  **Initialize Next.js Project:** Create a new Next.js application using `create-next-app` with TypeScript and Tailwind CSS.
2.  **Set up NextAuth.js:** Configure NextAuth.js with the Google Provider.
3.  **Create Google Cloud Project:** Set up a new project in the Google Cloud Console, enable the Google Drive API, and create OAuth 2.0 credentials.
4.  **Environment Configuration:** Create the `.env.local` file and add the necessary Google Client ID, Client Secret, and NextAuth secret.
5.  **Build Login/Logout Flow:** Create a simple UI with login and logout buttons to verify the authentication flow.

### Phase 2: Google Drive Integration

**Goal:** Implement the core logic for reading from and writing to the user's Google Drive.

**Tasks:**
1.  **Install Google Drive API Client:** Add the `@googleapis/drive` package.
2.  **Create API Wrapper:** Build a service class that encapsulates all interactions with the Google Drive API (e.g., `createFile`, `readFile`, `listFiles`, `updateFile`).
3.  **App Data Folder Logic:** Ensure the application correctly creates and accesses its dedicated folder in the user's Google Drive (`/AI Prompt Paster/`).
4.  **CRUD Operations:** Implement the backend logic for creating, reading, updating, and deleting prompt files (the JSON data model) in Google Drive.
5.  **API Routes:** Expose the CRUD operations through Next.js API routes to be consumed by the frontend.

### Phase 3: WebLLM Integration (Client-Side AI)

**Goal:** Integrate the WebLLM engine for client-side content analysis.

**Tasks:**
1.  **Install WebLLM Package:** Add the `@mlc-ai/web-llm` package.
2.  **Create AI Service:** Build a client-side service that initializes the WebLLM engine and loads a suitable model (e.g., Phi-3 or Llama-3-8B).
3.  **Implement Analysis Functions:** Create functions within the AI service to perform specific tasks:
    - `generateTitle(content)`
    - `generateTags(content)`
    - `suggestFolder(content, existingFolders)`
4.  **Web Worker Integration:** Offload the WebLLM engine to a Web Worker to prevent blocking the main UI thread during model loading and inference.

### Phase 4: UI Development - The Paster & Library

**Goal:** Build the core user interface for pasting content and viewing the library.

**Tasks:**
1.  **Build the Paster Component:** Create the main text input area.
2.  **Integrate AI Analysis:** When content is pasted, trigger the WebLLM service to analyze it and display the suggested title, tags, and folder.
3.  **Build the Library View:**
    - Create the Notion-inspired layout with a folder tree and a card-based view for prompts.
    - Fetch and display the user's prompts from their Google Drive via the API routes.
    - Implement folder creation and navigation.
    - Implement tag-based filtering.
4.  **Implement Save Flow:** Create the logic to save a new, organized prompt to Google Drive.

### Phase 5: Advanced Features - Search & Composer

**Goal:** Implement semantic search and the prompt composition assistant.

**Tasks:**
1.  **Build Semantic Search:**
    - On initial load, use the WebLLM engine to create vector embeddings for all prompts in the user's library.
    - Store these embeddings in IndexedDB for fast client-side retrieval.
    - When a user searches, create an embedding for the query and perform a vector similarity search against the stored prompt embeddings.
2.  **Build the Prompt Composer:**
    - Create a new UI for writing and editing prompts.
    - As the user types, perform real-time semantic search to find and suggest related prompts from their library.
    - Implement functionality to easily insert or chain suggested prompts.
    - Add a simple UI for managing variables within prompts.

### Phase 6: Finalization & Deployment

**Goal:** Polish the UI, perform testing, and prepare for deployment.

**Tasks:**
1.  **UI/UX Polish:** Refine animations, transitions, and overall aesthetic using Framer Motion.
2.  **Responsive Design:** Ensure the application is fully responsive and usable on mobile devices.
3.  **Testing:** Perform thorough end-to-end testing of all features.
4.  **Deployment:** Deploy the application to Vercel, configuring all necessary environment variables.
