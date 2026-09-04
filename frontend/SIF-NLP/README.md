# SIF-Sentinel: AI/NLP Precursor Detection Engine
### Tailored for Oil India Limited (OIL) HSE Operations

SIF-Sentinel is a safety-critical AI/NLP precursor detection system designed for Oil India Limited's upstream drilling rigs, gas gathering stations, production installations, and cross-country pipelines. It triages Unsafe Act, Unsafe Condition, and Near Miss safety reports to identify Serious Injury & Fatality (SIF) precursors before high-energy incidents occur.

---

## Project Architecture

```
my-web-app/
│
├── frontend/                    # React + Vite User Interface
│   ├── public/                  # Static assets & icons
│   └── src/
│       ├── assets/              # Icons and brand assets
│       ├── components/          # Reusable components (Triage, Navigation, Common)
│       ├── pages/               # Full modules (Executive Pulse, Triage, Heatmap, CAPA, Admin)
│       ├── layouts/             # AppLayout shell
│       ├── hooks/               # Custom hooks (Theme, Keyboard shortcuts)
│       ├── services/            # API client
│       ├── store/               # Global state (AppContext)
│       ├── utils/               # Formatters, SPS calculations, evidence highlighters
│       ├── types/               # Type definitions
│       ├── styles/              # Dual theme CSS (Oceanic & Warm Terra)
│       ├── App.jsx              # Root component
│       └── main.jsx             # React entry point
│
├── backend/                     # Node.js + Express REST API
│   ├── src/
│   │   ├── config/              # Environment config
│   │   ├── controllers/         # Request handling & HTTP responses
│   │   ├── routes/              # REST endpoints (/api/reports, /api/capa, etc.)
│   │   ├── models/              # Data models (Reports, CAPA, Audit)
│   │   ├── services/            # SPS calculation, guardrails, analytics
│   │   ├── middleware/          # Role auth, logging, error handlers
│   │   ├── validators/          # Validation (PRD §11 minimum 10 char override rule)
│   │   ├── utils/               # Taxonomy constants & response helpers
│   │   ├── types/               # Domain type annotations
│   │   └── server.js            # Express server
│   ├── .env
│   └── package.json
│
├── database/                    # Domain data & schema
│   ├── migrations/              # SQL schema definition
│   └── seed/                    # Initial seed reports, taxonomy, and MLOps models
│
├── .gitignore
├── README.md
└── package.json                 # Monorepo orchestrator
```

---

## Running the Application

### 1. Install All Dependencies
From the repository root:
```bash
npm run install:all
```

### 2. Run the Development Server
```bash
npm run dev
```
This starts both:
- **Backend Express API**: `http://localhost:5000`
- **Frontend Vite Client**: `http://localhost:5173`

---

## Key Safety Science & Product Features

1. **Dual Themes**: Oceanic Professional (cool slate & teal) and Warm Terra (warm orange & stone), each supporting Light and Dark modes.
2. **SPS Scoring (0–100)**: Multi-factor score derived from High Energy Severity (40%), Barrier Degradation (35%), and Personnel Exposure Vector (25%).
3. **Anti-Hallucination Guardrail**: Evidence phrases highlighted in incident narratives are strictly validated against verified raw substrings.
4. **Non-Punitive Safety Governance (PRD §11)**: Strict prohibition of individual worker blaming; human overrides require mandatory engineering justification notes (minimum 10 characters).
5. **Keyboard Shortcuts**: In report inspection, press `E` to escalate to CAPA, `O` to override SIF tier, `J` for the next report, and `Esc` to dismiss drawers.