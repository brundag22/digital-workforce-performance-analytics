# Government Certificate & Digital Workforce Analytics Platforms

Two full-stack Node.js, Express, and SQLite (`node:sqlite`) platforms with JWT authentication, Role-Based Access Control (RBAC), and built-in browser dashboards.

## Project Structure

- `govt-certificate-api/` — Port `5000` (Citizen, Agent, Admin)
- `workforce-analytics-api/` — Port `5001` (Employee, Supervisor, Admin)

## Setup & Execution

### 1. Government Certificate Platform
```bash
cd govt-certificate-api
npm install
node server.js
