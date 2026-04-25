# Netwrix Intelligence Dashboard — Architecture

## Modules (adaptive — enabled based on NA/NDC configured sources)

| Module | Data Sources | Key Features |
|---|---|---|
| Active Directory | NA (AD events, GPO, Logon) + PingCastle XML | Risk users, GPO changes, logon anomalies, AD health score |
| Entra ID | NA (Entra module) + Graph API | Sign-in risk, MFA failures, CA bypasses, app consents |
| File Server | NA (FS events) + NDC | Share exposure, sensitive data heatmap, access anomalies |
| SharePoint Online | NA (SPO module) + NDC Cloud | Oversharing, external access, sensitive content |
| Exchange Online | NA (Exchange module) + NDC | DLP violations, forwarding rules, sensitive email |
| Microsoft Teams | NA (Teams module) + NDC | External access, guest activity, sensitive messages |

## KPI Predictions
- Horizons: 1M / 2M / 3M / 1Y / 2Y
- Engine: Ollama (local LLM — llama3.2) analyzing InfluxDB time-series trends
- Output: risk_trend, breach_probability, predicted_kpis, recommended_actions, executive_summary

## PingCastle Integration
- Upload XML report via UI → parsed and stored in MongoDB
- Correlated with NA AD events for full AD risk picture
- Scores tracked over time: Global, Stale, Privileged, Trust, Anomaly

## Data Flow
NA API → Rails sync job → MongoDB (documents) + InfluxDB (time-series)
NDC SOAP → Rails sync job → MongoDB
PingCastle XML → Upload → MongoDB
MongoDB + InfluxDB → Rails API → React dashboard
Rails → Ollama → AI predictions/recommendations

## Adaptive Modules
Dashboard queries NA/NDC on startup to discover configured sources.
Only modules with active data are shown. Cached 30 minutes.

## Stack
- Backend: Ruby on Rails 7.2 (API mode)
- Frontend: React + Vite + TailwindCSS + Recharts/Nivo
- Time-series DB: InfluxDB 2.7 (free OSS)
- Document DB: MongoDB 7
- Local AI: Ollama (llama3.2)
- Background jobs: Sidekiq + Redis
- Deployment: Docker Compose (Windows Server via Docker Desktop / WSL2)
