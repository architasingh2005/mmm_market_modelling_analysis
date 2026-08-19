# Marketing Intelligence System — MMM AI Platform

A production-grade, full-stack SaaS platform designed for marketing analysts, growth leads, and data science teams to ingest datasets, automatically generate multi-dimensional analytical reports, perform conversational dataset queries via a Retrieval-Augmented Generation (RAG) architecture, and explore interactive marketing mix modeling (MMM) metrics.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture & Component Interaction](#architecture--component-interaction)
3. [Core Capabilities](#core-capabilities)
4. [Technology Stack](#technology-stack)
5. [Repository Structure](#repository-structure)
6. [Quick Start & Setup](#quick-start--setup)
   - [Prerequisites](#prerequisites)
   - [Environment Configuration](#environment-configuration)
   - [Backend Service (Node.js/Express)](#backend-service-nodejsexpress)
   - [AI Engine (Python/FastAPI)](#ai-engine-pythonfastapi)
   - [Frontend Application (React/Vite)](#frontend-application-reactvite)
7. [API Reference](#api-reference)
8. [RAG & Vector Search Pipeline](#rag--vector-search-pipeline)
9. [Report Generation Pipeline](#report-generation-pipeline)
10. [Intent Classification Engine](#intent-classification-engine)
11. [Data Science & Modeling Notebooks](#data-science--modeling-notebooks)
12. [Testing & Verification](#testing--verification)
13. [Current System Constraints](#current-system-constraints)
14. [Future Scope — Agentic AI & Multi-Agent Systems](#future-scope--agentic-ai--multi-agent-systems)
15. [License & Ownership](#license--ownership)

---

## System Overview

The **Marketing Intelligence System** bridges raw transactional/marketing performance datasets and executive-level decision-making. Upon dataset upload, the system automatically detects dataset schemas, runs exploratory data analysis (EDA) and statistical attribution pipelines, persists findings to MongoDB, and exposes a contextual AI assistant for natural language querying.

### Key Value Propositions
- **Automated Dataset Fingerprinting**: Automatically categorizes datasets (`mmm`, `sentiment`, or `generic`) and triggers tailored analytical workflows.
- **RAG-Driven Dataset Chat**: Combines structured statistical extraction with vector similarity search (Pinecone + Mistral AI) for grounded Q&A.
- **Deterministic Intent Guardrails**: Prevents common LLM hallucinations (such as confusing Pearson correlation with causal ROI) via pre-LLM intent classification.
- **Interactive Visual Analytics**: Dynamic charts, KPI metrics, and correlation heatmaps generated directly from raw dataset data.

---

## Architecture & Component Interaction

The platform follows a decoupled, three-tier service architecture:

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         React 19 SPA (Vite)                              │
│   Dashboard · Upload · Reports · AI Chat · Analytics · Profile · About  │
└──────────────────────────┬───────────────────────────────────────────────┘
                           │  REST API (Axios / JWT)
                           ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                     Node.js / Express API Backend                        │
│   Authentication · File Handling (Multer) · MongoDB Persistence          │
└──────────┬──────────────────────────────────────────┬────────────────────┘
           │  Internal HTTP Payload                   │  Database I/O
           ▼                                          ▼
┌──────────────────────────────┐          ┌───────────────────────────────┐
│   Python FastAPI AI Engine   │          │        MongoDB Database       │
│                              │          │ Users · Datasets · Reports    │
│  /api/analyze   (Reports)    │          │ Chat History · Analytics      │
│  /api/analytics (KPIs)       │          └───────────────────────────────┘
│  /api/chat      (RAG + NLP)  │
│                              │
│  ┌────────────────────────┐  │
│  │  Report Pipeline       │  │
│  └────────────────────────┘  │
│  ┌────────────────────────┐  │
│  │  Intent Classifier     │  │          ┌────────────────────────┐
│  └────────────────────────┘  │          │  Pinecone Vector Store │
│  ┌────────────────────────┐  │◄─────────┤  (`marketing-rag` index)│
│  │  RAG Engine & Embeddings│  │          │  Mistral Embed & LLM   │
│  └────────────────────────┘  │          └────────────────────────┘
└──────────────────────────────┘
```

---

## Core Capabilities

### 1. Dataset Upload & Multi-Format Ingestion
- Ingests `.csv`, `.xls`, and `.xlsx` files with schema parsing.
- Implements checksum/filename validation to prevent orphaned re-upload records.
- Enforces strict user isolation across storage paths and database records.

### 2. Multi-Report Generation Pipeline
- Fingerprints dataset type based on column signatures and filename hints:
  - **MMM Datasets**: Generates Dataset Understanding, EDA, Correlation Analysis, Sales Performance, Channel Analysis, MMM Analysis, and Sales Forecasting reports.
  - **Sentiment Datasets**: Generates Dataset Understanding, EDA, and Customer Sentiment Analysis reports.
  - **Generic Datasets**: Generates Dataset Understanding, EDA, Sales Performance, Correlation Analysis, and Forecasting reports.
- Outputs clean Markdown-formatted summaries stored alongside structured JSON metadata.

### 3. Intent-Aware Conversational AI
- Pre-classifies user queries into deterministic intent categories before invoking LLM logic:
  - `MMM_HIGHEST_ROI`: Returns top ROAS/ROI channel directly from MMM analysis results.
  - `MMM_ROI_RANKING` / `ROI_ATTRIBUTION`: Generates tabular channel performance breakdowns.
  - `BUDGET_ALLOCATION`: Offers channel spending recommendations.
  - `CORRELATION`: Calculates and presents Pearson correlation matrices (explicitly isolated from ROI calculations).
  - `DATASET_STATS` / `DATA_PROFILE`: Reports dataset shape, null counts, and summary statistics.
  - `FORECAST` / `SENTIMENT`: Pulls targeted statistical sections.
  - `GENERAL`: Routes through vector retrieval and Mistral LLM context building.

### 4. Interactive Analytics Dashboard
- Live computation of row/column metrics, data completeness, total/mean sales, channel performance metrics, and correlation coefficients.
- Dynamic visual components rendered with Recharts and Framer Motion.

---

## Technology Stack

### Frontend Application
- **Framework**: React 19 + Vite 8
- **Routing**: React Router DOM 7
- **Styling**: Tailwind CSS 4
- **State & Query Management**: TanStack Query (React Query v5)
- **Data Visualizations**: Recharts 3
- **Animations & Icons**: Framer Motion 12, Lucide React

### API Service Layer (Backend)
- **Runtime**: Node.js + Express 5
- **Database ODM**: Mongoose 9 (MongoDB)
- **Authentication**: JSON Web Tokens (JWT) & bcrypt password hashing
- **File Ingestion**: Multer
- **Security & Logging**: Helmet, Morgan, CORS, Zod validation

### AI & Analytics Engine
- **Framework**: Python 3.9+ / FastAPI
- **Data Processing**: Pandas, NumPy, SciPy, Scikit-learn, Statsmodels
- **Plotting & Reporting**: Matplotlib (Agg headless backend), Seaborn
- **RAG & Vector Search**: LangChain Core, Pinecone Client, `langchain-mistralai`
- **Embeddings & LLM**: Mistral Embeddings (`mistral-embed`) & Mistral Chat (`mistral-large-latest`)

---

## Repository Structure

```
mmm_market_modelling_analysis/
├── app/                               # Python FastAPI AI Engine
│   ├── main.py                        # FastAPI endpoints & CORS configuration
│   ├── report_pipeline.py             # Dataset fingerprinting & report orchestrator
│   ├── analytics_engine.py            # Live KPI & stats computation engine
│   ├── query_service.py               # Intent-routed query processor
│   ├── intent_classifier.py           # Deterministic query intent classifier
│   ├── mmm_extractor.py               # Structured MMM report parser
│   ├── context_builder.py             # RAG context builder & system prompts
│   └── roi_calculator.py              # Attribution helper routines
├── backend/                           # Node.js Express REST API
│   ├── config/                        # DB connections & environment setup
│   ├── controllers/                   # Auth, Dataset, Report, Chat controllers
│   ├── middlewares/                   # JWT auth, Multer upload, 404 handlers
│   ├── models/                        # Mongoose schemas (User, Dataset, Report, ChatHistory)
│   ├── routes/                        # Express API route definitions
│   ├── uploads/                       # Local dataset storage folder
│   └── index.js                       # Server entry point
├── frontend/                          # React + Vite Frontend
│   ├── src/
│   │   ├── components/                # Layout, Sidebar, Shared UI elements
│   │   ├── pages/                     # Dashboard, Upload, Reports, Chat, Analytics, Profile
│   │   ├── routes/                    # Router definitions
│   │   └── services/                  # API hooks & custom queries
│   └── package.json
├── src/                               # Core Python RAG & ML Modules
│   ├── embeddings/                    # Mistral embedding manager
│   ├── knowledge_base/                # Text chunkers & document loaders
│   ├── rag/                           # RAG pipeline, LLM client, prompt builders
│   ├── retrieval/                     # Pinecone search retriever
│   ├── vectorstore/                   # Pinecone index manager
│   ├── data_preprocessing.py          # Cleaning & normalization helpers
│   ├── feature_engineering.py         # Adstock, lag creation, rolling statistics
│   ├── train_baseline.py              # Baseline regression model trainer
│   └── robyn_pipeline.py              # Media mix modeling data transformer
├── notebooks/                         # EDA, Modeling & RAG Exploration Notebooks
├── tests/                             # Python Test Suite (22 test suites)
├── requirements.txt                   # Python environment dependencies
└── README.md                          # Platform documentation
```

---

## Quick Start & Setup

### Prerequisites
- **Node.js**: v18.x or higher
- **Python**: v3.9 or higher
- **MongoDB**: Local instance or MongoDB Atlas cluster
- **Pinecone Account**: Vector index named `marketing-rag`
- **Mistral AI Key**: API key for embeddings and text generation

---

### Environment Configuration

Create `.env` files in their respective service locations using generic placeholders (never commit actual keys to source control):

#### 1. Backend Service Environment (`backend/.env`)
```env
PORT=3001
MONGO_URI=mongodb://127.0.0.1:27017/mmm_intelligence
JWT_SECRET=your_jwt_secret_token_here
FASTAPI_URL=http://127.0.0.1:8000
```

#### 2. AI Engine Environment (Root `.env`)
```env
MISTRAL_API_KEY=your_mistral_api_key_here
PINECONE_API_KEY=your_pinecone_api_key_here
MONGODB_URI=mongodb://127.0.0.1:27017/mmm_intelligence
```

#### 3. Frontend Environment (`frontend/.env`)
```env
VITE_API_BASE_URL=http://localhost:3001
```

---

### Running the Services

#### Step 1: Start Node.js Express API
```bash
cd backend
npm install
npm run dev
# Server running at http://localhost:3001
```

#### Step 2: Start Python FastAPI Engine
```bash
# From project root directory
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
# source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
# AI Engine running at http://127.0.0.1:8000
```

#### Step 3: Start Frontend SPA
```bash
cd frontend
npm install
npm run dev
# Web application accessible at http://localhost:5173
```

---

## API Reference

### Express REST API (`http://localhost:3001`)

| Endpoint | Method | Security | Functionality |
|---|---|---|---|
| `/api/auth/register` | `POST` | Public | Register new platform account |
| `/api/auth/login` | `POST` | Public | Authenticate user & issue JWT |
| `/api/datasets` | `GET` | JWT Protected | Fetch current user's datasets |
| `/api/datasets/upload` | `POST` | JWT Protected | Upload CSV/Excel dataset & trigger pipeline |
| `/api/datasets/:id` | `DELETE` | JWT Protected | Delete dataset & associated reports |
| `/api/reports/:datasetId` | `GET` | JWT Protected | Fetch generated reports for dataset |
| `/api/chat/message` | `POST` | JWT Protected | Submit user chat query to RAG workflow |
| `/api/chat/history` | `GET` | JWT Protected | Retrieve session-based conversation turns |

### FastAPI Engine (`http://localhost:8000`)

| Endpoint | Method | Description |
|---|---|---|
| `/` | `GET` | Service status check |
| `/api/analyze` | `POST` | Ingests file path, fingerprints dataset, generates report suite |
| `/api/analytics` | `POST` | Computes dataset quality, KPIs, channel stats, and correlations |
| `/api/chat` | `POST` | Intent classification & RAG query execution |

---

## RAG & Vector Search Pipeline

The RAG workflow follows a hybrid retrieval mechanism:

1. **Intent Extraction**: incoming questions pass through `intent_classifier.py`.
2. **Deterministic Fallback/Extraction**: If the query seeks precise mathematical or tabular metrics (e.g. highest ROI, budget split, Pearson correlation), `query_service.py` executes exact dataframe or structured report evaluation.
3. **Semantic Vector Retrieval**: For unclassified or conceptual queries:
   - Queries are embedded using `MistralAIEmbeddings` (`mistral-embed`).
   - `PineconeManager` searches the `marketing-rag` index filtering by `dataset_id`.
   - Dynamic text chunking (`KnowledgeTextChunker`) acts as an immediate fallback if vector matches are sparse.
   - Context is constructed into a bounded prompt and synthesized by `ChatMistralAI` (`mistral-large-latest`).

---

## Report Generation Pipeline

`app/report_pipeline.py` implements an automated multi-report generation engine:

```
                  ┌──────────────────────────────┐
                  │  Raw Dataset Ingestion (CSV) │
                  └──────────────┬───────────────┘
                                 │
                                 ▼
                  ┌──────────────────────────────┐
                  │   detect_dataset_type()      │
                  │   - MMM / Sentiment / Generic│
                  └──────────────┬───────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         ▼                       ▼                       ▼
 ┌───────────────┐       ┌───────────────┐       ┌───────────────┐
 │  MMM Suite    │       │ Sentiment     │       │ Generic Suite │
 │  (7 Reports)  │       │ (3 Reports)   │       │ (5 Reports)   │
 └───────┬───────┘       └───────┬───────┘       └───────┬───────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                                 ▼
                  ┌──────────────────────────────┐
                  │ MongoDB Report Persistence   │
                  └──────────────────────────────┘
```

---

## Intent Classification Engine

To avoid common LLM reasoning errors in domain-specific analytics, `app/intent_classifier.py` uses keyword signal matching with strict priority evaluation:

```
User Query ──► Regex Normalization ──► Granular Keyword Match ──► Priority Scorer ──► Intent Tag
```

By prioritizing exact mathematical handlers for ROI, channel performance, and correlations, the system guarantees accurate attribution metrics.

---

## Data Science & Modeling Notebooks

The `notebooks/` directory contains exploratory, development, and modeling research notebooks:

- `01_Data_Understanding.ipynb`: Initial schema analysis, distributions, and summary statistics.
- `02_Data_Cleaning.ipynb`: Missing value imputation and anomaly filtering algorithms.
- `03_EDA.ipynb`: Comprehensive exploratory data analysis and correlation heatmaps.
- `04_Feature_Engineering.ipynb`: Lag creation, rolling transformations, and adstock modeling.
- `05_Baseline_Model.ipynb`: Multi-variable linear regression baseline models.
- `06_Robyn_Preparation.ipynb`: Preparation pipelines for Meta Robyn MMM integration.
- `07_Market_Mix_Modeling.ipynb`: Media mix modeling and channel return curve calculations.
- `08_Sales_Forecasting_Prophet.ipynb`: Time-series forecasting using Facebook Prophet.
- `Module3_Customer_Sentiment_Analysis.ipynb`: NLP analysis on product reviews and feedback.
- `Module4_Multi_RAG_Knowledge_Base.ipynb`: RAG index creation and vector testing.

---

## Testing & Verification

The repository includes a comprehensive Python test suite covering unit, integration, and service-level components:

```bash
# Run full python test suite
python -m pytest tests/ -v
```

### Key Test Coverage
- `test_analytics_engine.py`: Dynamic metric calculation accuracy.
- `test_embedding_manager.py`: Vector embedding pipeline verification.
- `test_pinecone_manager.py`: Pinecone index connection and document upserts.
- `test_rag_pipeline.py`: RAG question-answering verification.
- `test_report_generator.py`: Dataset type detection and report generation logic.
- `test_mongodb.py`: Database operations and model persistence.

---

## Current System Constraints

- **Synchronous Execution**: Report generation runs synchronously inside FastAPI request handlers. Large datasets (>50MB) should be processed with increased HTTP timeout configurations.
- **Shared Vector Index**: Pinecone uses metadata filtering (`dataset_id`) for document separation within a single index rather than multi-tenant index partitioning.
- **Local File Storage**: Uploaded files reside in `backend/uploads/` by default. Production multi-node deployments should connect to S3-compatible object stores.

---

## Future Scope — Agentic AI & Multi-Agent Systems

The roadmap outlines transitioning from the current single-agent intent router to an **Autonomous Multi-Agent Architecture**:

```
                       ┌─────────────────────────┐
                       │   Orchestrator Agent    │
                       │   (Task Decomposition)  │
                       └────────────┬────────────┘
                                    │
         ┌──────────────────────────┼──────────────────────────┐
         ▼                          ▼                          ▼
┌─────────────────┐        ┌─────────────────┐        ┌─────────────────┐
│  Data Hygiene   │        │ MMM Attribution │        │ Forecasting     │
│  Sub-Agent      │        │ Sub-Agent       │        │ Sub-Agent       │
└─────────────────┘        └─────────────────┘        └─────────────────┘
```

### Roadmap Highlights

1. **Multi-Agent Orchestration (LangGraph / CrewAI)**:
   - Introduction of a primary **Planner Agent** that breaks complex strategic prompts into specialized agent sub-tasks.
   - Inter-agent message passing and validation protocols.

2. **Autonomous Data Hygiene Agent**:
   - Automated detection of missing values, skewness, seasonality, and collinearity prior to model execution.
   - Self-correcting data cleaning scripts executed in a sandboxed Python runtime.

3. **Bayesian MMM Agent**:
   - Dynamic Bayesian hyperparameter tuning for Adstock (Geometric/Weibull) and Saturation (Hill function) curves using PyMC Marketing.

4. **Self-Reflective RAG Agent**:
   - Corrective RAG (CRAG) mechanisms to evaluate retrieved vector relevance and dynamically fall back to web search or secondary statistical tools when context quality is low.

5. **Natural Language Code Execution Agent**:
   - Secure REPL execution sandbox allowing analysts to request custom dynamic statistical plots and ad-hoc Pandas calculations on demand.

---

## License & Ownership

**Proprietary & Exclusive Ownership**:

Copyright © 2026. All Rights Reserved.

This software, including all source code, UI components, documentation, backend architecture, and AI modules, is **proprietary software**.

- **Exclusive Ownership**: All intellectual property rights belong exclusively to the owner/organization of this repository.
- **Restrictions**: No unauthorized party may copy, modify, distribute, publish, sub-license, host, or create derivative works from this repository without explicit written permission from the copyright holder.

