# MedRag

A document-grounded question answering system for medical professionals. Upload clinical documents, ask questions in natural language, and receive answers backed by cited sources — directly from your own documents.

---

## What It Does

MedRag ingests PDF documents, processes them into searchable chunks, embeds them using OpenAI, and retrieves the most semantically relevant context to answer user queries via GPT-4o. Every answer includes citations pointing back to the exact source and page number it was derived from.

```
Upload PDF → Extract → Chunk → Embed → Store (pgvector)
                                              ↓
                    Query → Embed → Vector Search → GPT-4o → Cited Answer
```

---

## Architecture

```
Frontend (React)  →  Gateway (Node/Express)  →  AI Service (FastAPI)  →  PostgreSQL + pgvector
     :5173               :3000                        :8000
```

The system follows an **API Gateway pattern** — all client traffic routes through a single gateway that handles authentication, role authorization, and proxying to the AI service. The AI service owns all document processing, retrieval, and LLM logic.

---

## Key Features

- **PDF Ingestion** — Upload documents via the frontend; text is extracted page-by-page using PyMuPDF
- **Intelligent Chunking** — LangChain `RecursiveCharacterTextSplitter` splits text into overlapping 512-character chunks, preserving context at boundaries
- **Vector Embeddings** — Each chunk is embedded using OpenAI `text-embedding-3-small` in batches and stored as a `pgvector` column
- **Semantic Retrieval** — Queries are embedded at runtime and matched against stored chunks using cosine similarity (`<=>` operator)
- **Cited Answers** — GPT-4o generates responses grounded strictly in retrieved context, with inline `[Source N, p.X]` citations
- **Streaming** — Chat responses stream token-by-token via Server-Sent Events
- **Session Memory** — Conversation history is maintained per session and passed as context on follow-up queries
- **Role-Based Access** — JWT-based auth with roles: `doctor`, `patient`, `nurse`, `researcher`
- **S3 Support** — Documents can be stored locally or on AWS S3; the processor handles both transparently
- **Async Processing** — Document processing runs as a background task; status is trackable via a dedicated endpoint

---

## Services

### Gateway — `Node.js + Express`
Handles all inbound HTTP traffic. Responsibilities:
- Auth: registration, login, logout, JWT issuance via `httpOnly` cookies
- Role-based middleware for protected routes
- Proxying document, retrieval, and chat requests to the AI service
- Streaming SSE responses from the AI service to the client

### AI Service — `FastAPI + Python`
Core processing and intelligence layer. Responsibilities:
- Document CRUD and background processing pipeline
- PDF text extraction (PyMuPDF), chunking (LangChain), embedding (OpenAI), storage (pgvector)
- Vector similarity search scoped per user and optionally per document
- LLM answer generation with citation parsing (GPT-4o)
- Chat session and message persistence
- User management

### Frontend — `React + Vite`
Minimal interface for document upload and chat interaction.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, Tailwind CSS |
| Gateway | Node.js, Express, JWT, bcrypt |
| AI Service | Python, FastAPI, Uvicorn |
| PDF Parsing | PyMuPDF (fitz) |
| Text Splitting | LangChain `RecursiveCharacterTextSplitter` |
| Embeddings | OpenAI `text-embedding-3-small` |
| LLM | OpenAI GPT-4o |
| ORM | SQLAlchemy |
| Database | PostgreSQL 15 + pgvector |
| File Storage | Local filesystem / AWS S3 |
| Containerisation | Docker, Docker Compose |
| Reverse Proxy | Nginx |

---

## Database Schema

### `users`
| Column | Type |
|---|---|
| `id` | Integer (PK) |
| `email` | String (unique) |
| `name` | String |
| `password` | String (hashed) |
| `role` | String |
| `avatar_url` | Text |

### `documents`
| Column | Type |
|---|---|
| `id` | Integer (PK) |
| `user_id` | Integer |
| `filename` | String |
| `file_path` | String |
| `status` | String (`pending` / `processing` / `processed` / `ready` / `failed`) |
| `error_message` | Text |
| `created_at` | Timestamp |

### `chunks`
| Column | Type |
|---|---|
| `id` | Integer (PK) |
| `document_id` | Integer (FK) |
| `text` | Text |
| `page_number` | Integer |
| `chunk_index` | Integer |
| `embedding` | Vector(1536) |

### `chat_sessions`
| Column | Type |
|---|---|
| `id` | String (PK) |
| `user_id` | Integer |
| `title` | String |
| `created_at` / `updated_at` | Timestamp |

### `chat_messages`
| Column | Type |
|---|---|
| `id` | Integer (PK) |
| `session_id` | String (FK) |
| `role` | String (`user` / `assistant`) |
| `content` | Text |
| `created_at` | Timestamp |

---

## Project Structure

```
MedRag/
├── frontend/                   # React + Vite application
│   └── src/
├── gateway/                    # Express API gateway
│   └── src/
│       ├── routes/
│       ├── middleware/
│       └── utils/
├── ai-service/                 # FastAPI service
│   ├── main.py
│   ├── models.py
│   ├── database.py
│   ├── services/
│   │   ├── processor.py        # PDF extraction + chunking
│   │   ├── embedder.py         # OpenAI embedding generation
│   │   ├── retriever.py        # Vector similarity search
│   │   ├── llm.py              # GPT-4o answer generation + citation parsing
│   │   └── memory.py           # Chat session management
│   ├── alembic/                # DB migrations
│   └── requirements.txt
├── nginx/
│   └── medrag.conf
├── docker-compose.yml
├── docker-compose.prod.yml
└── .env.example
```

---

## Getting Started

### Prerequisites
- Docker and Docker Compose
- OpenAI API key

### 1. Configure environment

```bash
cp .env.example .env
```

Fill in:
```
OPENAI_API_KEY=sk-...
JWT_SECRET=your_secret
POSTGRES_USER=medrag_user
POSTGRES_PASSWORD=medrag_pass
POSTGRES_DB=medrag_db
```

### 2. Start all services

```bash
docker compose up --build
```

This starts: PostgreSQL + pgvector, pgAdmin, AI service, Gateway, and Frontend.

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Gateway | http://localhost:3000 |
| AI Service | http://localhost:8000 |
| pgAdmin | http://localhost:5050 |

---

## API Reference

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | Login and receive JWT cookie |
| POST | `/auth/logout` | Clear auth cookie |
| GET | `/auth/me` | Get current user |

### Documents
| Method | Endpoint | Description |
|---|---|---|
| POST | `/documents/upload` | Upload a PDF |
| GET | `/documents/user/:id` | List documents for a user |
| GET | `/documents/:id/status` | Poll processing status |
| DELETE | `/documents/:id` | Delete document and its chunks |

### Chat
| Method | Endpoint | Description |
|---|---|---|
| POST | `/chat` | Ask a question (returns full response) |
| POST | `/chat/stream` | Ask a question (streams tokens via SSE) |
| GET | `/chat/history` | Fetch session message history |
| GET | `/chat/sessions` | List all sessions for current user |
| POST | `/chat/clear` | Clear a session's history |
