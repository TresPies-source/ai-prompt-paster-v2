# AI Prompt Paster v2.0 - Documentation

This directory contains all the design and planning documents for **AI Prompt Paster v2.0**, an intelligent prompt library with client-side AI processing.

## 📚 Document Overview

### [DESIGN.md](./DESIGN.md)
**Master Design & Implementation Document**

The comprehensive blueprint for the entire project, including:
- Vision and core philosophy
- Technical architecture and system diagrams
- Detailed feature specifications
- Data model and storage strategy
- 8-week implementation roadmap
- Integration with Dojo Genesis
- Success metrics

**Start here** for the complete picture of what we're building and why.

### [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)
**Zenflow Implementation Plan**

Phase-by-phase development tasks following the Zenflow Automation Protocol:
- Zenflow configuration (setup, dev server, cleanup scripts)
- 6 implementation phases with specific tasks
- Backend-first development approach
- Clear deliverables for each phase

**Use this** when ready to start building.

### [RESEARCH.md](./RESEARCH.md)
**Research Findings**

Background research that informed the design:
- Modern pastebin landscape and patterns
- System design best practices for pastebin-like services
- WebLLM capabilities and integration patterns
- Privacy-first architecture considerations

**Reference this** to understand the competitive landscape and technical decisions.

### [VISION_SYNTHESIS.md](./VISION_SYNTHESIS.md)
**Vision Synthesis & Requirements**

The original synthesis document that captured the project vision:
- Evolution from original AIPP concept
- Modern pastebin patterns
- Embedded LLM opportunities
- Clarifying questions and answers
- Core requirements and constraints

**Review this** to understand how we arrived at the final design.

---

## 🎯 Quick Start

1. **Read DESIGN.md** for the full vision and architecture
2. **Review IMPLEMENTATION_PLAN.md** for the development roadmap
3. **Initialize the repository** and begin Phase 1 (authentication setup)

## 🚀 Key Concepts

**What is AI Prompt Paster v2.0?**

An intelligent prompt library that helps users build and curate a personal knowledge base over time. It automatically organizes pasted content using client-side AI (WebLLM), making it easy to search and reuse prompts while maintaining complete privacy.

**Core Features:**
- **The Paster**: Intelligent content ingestion with AI-powered organization
- **The Library**: Notion-inspired view with folders and tags
- **Semantic Search**: Find prompts by meaning, not keywords
- **Prompt Composer**: Write and combine prompts with AI assistance

**Tech Stack:**
- Next.js 14 + Tailwind CSS + Framer Motion
- WebLLM (client-side AI)
- Google Drive (storage)
- IndexedDB (vector embeddings)

---

## 📝 Version History

- **v1.0** (2026-01-30): Initial design and planning documents

---

**Author:** Manus AI (Dojo)  
**Project:** AI Prompt Paster v2.0  
**Status:** Design Complete, Ready for Implementation
