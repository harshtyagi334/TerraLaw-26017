

# Land Acquisition Delay Predictive Analytics System

An AI-assisted decision-support platform for identifying, explaining, and monitoring land acquisition delays across infrastructure projects.

The repository contains a React/Vite dashboard, a Python prediction service, dataset engineering utilities, model artifacts, and a CSV-based data ingestion workflow. It is designed for transparent operational review: predictions support administrative decisions and do not replace statutory processes or legal authority.

## What It Provides

- Portfolio dashboard for project health, delay exposure, approvals, compensation, rehabilitation, and disputes.
- Data ingestion for approved land acquisition CSV fields, with immediate downstream risk quantification.
- Project-level detail views, GIS visualization, audit history, reporting, and API exploration.
- Random Forest-based delay forecasting with held-out evaluation metrics and feature importance outputs.
- AI-assisted project briefings with grounded legal evidence and fallback behavior when external evidence is unavailable.

## Repository Map

| Path | Responsibility |
| --- | --- |
| `src/` | React application, views, domain types, context, hooks, and client utilities |
| `model_server.py` | Local model prediction service |
| `production_api.py` | API service entry point |
| `train_model.py` | Model training and evaluation workflow |
| `audit_and_engineer_dataset.py` | Dataset audit, correction, and expansion workflow |
| `*.csv` | Demonstration and engineered datasets |
| `model_outputs/` | Tracked model evaluation charts |
| `.github/workflows/ci.yml` | Pull request and branch quality checks |

## Quick Start

### Prerequisites

- Node.js 20 or newer
- npm 10 or newer
- Python 3.10 or newer for model and API services

### Install and run

```bash
npm ci
npm run dev
```

The Vite dashboard opens at `http://localhost:3000`. The development command also starts the local Python model service. If port 3000 is unavailable, Vite selects the next available port.

Optional AI features use `GEMINI_API_KEY`. Create `.env.local` from `.env.example` when that file is provided by your environment. Never commit API keys or other secrets.

## Quality Checks

Run the same checks used by CI before opening a pull request:

```bash
npm run lint
npm run build
npm run test:copilot
```

The smoke tests verify grounded and clean-slate AI briefing behavior. The production build validates that the browser application can be bundled successfully.

## Data and Model Workflows

Train the model and regenerate evaluation artifacts:

```bash
python train_model.py
```

Audit and expand the supplied datasets:

```bash
python audit_and_engineer_dataset.py
```

The primary demonstration dataset is `expanded_land_acquisition_delays.csv`. The model forecasts `RealWorld_Months_Delayed` from land area, affected families, acquisition timelines, clearances, compensation, court cases, rehabilitation progress, stakeholder responsiveness, sector, and state.

`Project_Risk_Classification` is derived from the delay target and must not be included as a model feature. This repository includes synthetic and demonstration data; it must not be treated as an authoritative government record without appropriate governance and validation.

## Approved Ingestion Fields

The downstream risk briefing accepts these CSV fields:

`project_id`, `project_name`, `project_type`, `state`, `district`, `land_area_hectares`, `affected_families`, `compensation_disbursed_pct`, `pending_approvals_count`, and `legal_disputes_count`.

The briefing calculates unique sub-project count, total area, aggregate displacement, average compensation, and per-project risk tiers. It observes the existing import and persistence path without changing validation rules or database behavior.

## Development Principles

- Keep business rules and persistence mechanics separate from analytical presentation.
- Prefer typed domain models and deterministic tests for user-visible behavior.
- Do not commit secrets, local environments, build output, or dependency directories.
- Treat model output as decision support and display limitations clearly.
- Keep pull requests focused, reviewable, and backed by passing CI checks.

## License and Usage

This project is a prototype for demonstration and evaluation. Add the governing project license and data-use terms before distributing it outside the intended team.
