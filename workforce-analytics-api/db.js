const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('./workforce.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'Employee' CHECK(role IN ('Employee', 'Supervisor', 'Admin')),
    supervisor_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supervisor_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS kpis (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    target_value REAL NOT NULL,
    weightage REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS work_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    kpi_id INTEGER NOT NULL,
    task_description TEXT NOT NULL,
    achieved_value REAL NOT NULL,
    evidence_url TEXT,
    status TEXT DEFAULT 'Pending Approval' CHECK(status IN ('Pending Approval', 'Approved', 'Rejected')),
    supervisor_remarks TEXT,
    final_score REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES users(id),
    FOREIGN KEY (kpi_id) REFERENCES kpis(id)
  );
`);

console.log('[DB] Workforce SQLite database initialized');
module.exports = db;
