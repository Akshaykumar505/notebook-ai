# Notebook AI — RAG Research Assistant

A NotebookLM-inspired research assistant: upload multiple knowledge sources
(PDF, text, web URL, YouTube, VTT transcripts), ask questions, get grounded
answers with citations pointing back to the exact source.

## Tech Stack

- **Backend:** Node.js + TypeScript + Express
- **Database (metadata):** SQLite via Prisma ORM
- **Vector store:** Local JSON files + cosine similarity (pure JS, no separate server)
- **LLM / Embeddings:** OpenAI
- **Auth:** JWT + bcrypt

## Project Status

🟢 **Step 1 complete:** Project scaffolding, Express server, config validation, error handling.

## Getting Started (Step 1)

```bash
cd backend
cp .env.example .env
# edit .env and add your real OPENAI_API_KEY

npm install
npm run dev
```

Then visit: `http://localhost:4000/health`

## Folder Structure (backend)

```
backend/
  src/
    config/       -> environment variable loading + validation (fail fast on bad config)
    db/           -> Prisma client instance (Step 2)
    middleware/    -> error handling, auth, etc.
    modules/       -> one folder per domain feature (notebooks, sources, ingestion, embeddings, retrieval, query)
    types/         -> shared TypeScript types
    utils/         -> generic helpers
    app.ts         -> Express app configuration (middleware, routes)
    server.ts      -> starts the HTTP server
  prisma/
    schema.prisma  -> database models
```

**Why this structure?** Each `modules/*` folder is self-contained by feature
(not by technical type), so all the code related to "sources" — routes,
service logic, types — lives together, making the codebase easier to
navigate and review.

## Roadmap

- [x] Step 1: Architecture & scaffolding
- [ ] Step 2: Database schema (Notebook, Source, Chunk models)
- [ ] Step 3: Notebook & Source CRUD APIs
- [ ] Step 4: Source ingestion (PDF, Text, URL, YouTube, VTT)
- [ ] Step 5: Chunking
- [ ] Step 6: Embeddings
- [ ] Step 7: ChromaDB vector store integration
- [ ] Step 8: Retrieval
- [ ] Step 9: RAG answer generation + citations
- [ ] Step 10+: Frontend (React)
