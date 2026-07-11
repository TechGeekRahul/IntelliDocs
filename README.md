# IntelliDocs

Upload PDF, DOCX, or Markdown documentation and ask questions about it with cited answers.

## Planned architecture

```
User → Ask Question → Embedding → Vector Search → Top 5 Chunks → Prompt → LLM → Answer + Sources
```

## Tech stack

| Layer    | Tools                                      |
| -------- | ------------------------------------------ |
| Backend  | Python, FastAPI, LangChain, OpenAI/Gemini, ChromaDB or FAISS |
| Frontend | React (Vite)                 |

## Project structure

```
IntelliDocs/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   └── api/routes/
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   └── package.json
└── README.md
```

## Backend setup

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
# source .venv/bin/activate

pip install -r requirements.txt
copy .env.example .env   # Windows
# cp .env.example .env   # macOS / Linux
```

## Run the API

```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Endpoints

| Method | Path     | Description        |
| ------ | -------- | ------------------ |
| GET    | `/`      | API info           |
| GET    | `/health` | Liveness check    |
| GET    | `/ready`  | Readiness check   |
| GET    | `/docs`   | Swagger UI        |
| POST   | `/documents` | Upload a document (PDF, DOCX, MD) |
| GET    | `/documents` | List uploaded documents |
| POST   | `/search` | Semantic search over indexed chunks |
| POST   | `/chat` | Ask a question and get an answer with citations |

## Frontend setup

```bash
cd frontend
npm install
copy .env.example .env   # Windows
# cp .env.example .env   # macOS / Linux
npm run dev
```

Open http://localhost:5173 (API should be running on port 8000).

