const express = require('express');
const db = require('../db');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Employee: Submit a work log
router.post('/', protect, authorize('Employee'), (req, res) => {
  try {
    const { kpi_id, task_description, achieved_value, evidence_url = null } = req.body;
    const result = db.prepare(
      'INSERT INTO work_logs (employee_id, kpi_id, task_description, achieved_value, evidence_url) VALUES (?, ?, ?, ?, ?)'
    ).run(req.user.id, kpi_id, task_description, achieved_value, evidence_url);

    const log = db.prepare('SELECT * FROM work_logs WHERE id = ?').get(Number(result.lastInsertRowid));
    res.status(201).json(log);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Employee: View own work logs
router.get('/my', protect, authorize('Employee'), (req, res) => {
  try {
    const logs = db.prepare(
      `SELECT wl.*, k.title AS kpi_title, k.target_value, k.weightage
       FROM work_logs wl
       JOIN kpis k ON wl.kpi_id = k.id
       WHERE wl.employee_id = ?
       ORDER BY wl.created_at DESC`
    ).all(req.user.id);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Supervisor/Admin: View all work logs
router.get('/', protect, authorize('Supervisor', 'Admin'), (req, res) => {
  try {
    const logs = db.prepare(
      `SELECT wl.*, u.name AS employee_name, k.title AS kpi_title, k.target_value, k.weightage
       FROM work_logs wl
       JOIN users u ON wl.employee_id = u.id
       JOIN kpis k ON wl.kpi_id = k.id
       ORDER BY wl.created_at DESC`
    ).all();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Supervisor/Admin: Approve or Reject a work log and compute score
router.patch('/:id/review', protect, authorize('Supervisor', 'Admin'), (req, res) => {
  try {
    const { status, supervisor_remarks = '' } = req.body; // 'Approved' or 'Rejected'
    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be Approved or Rejected' });
    }

    const log = db.prepare(
      `SELECT wl.*, k.target_value, k.weightage
       FROM work_logs wl
       JOIN kpis k ON wl.kpi_id = k.id
       WHERE wl.id = ?`
    ).get(req.params.id);

    if (!log) return res.status(404).json({ message: 'Work log not found' });

    const finalScore = status === 'Approved'
      ? Number(((log.achieved_value / log.target_value) * log.weightage).toFixed(2))
      : 0;

    db.prepare(
      'UPDATE work_logs SET status = ?, supervisor_remarks = ?, final_score = ? WHERE id = ?'
    ).run(status, supervisor_remarks, finalScore, req.params.id);

    const updated = db.prepare('SELECT * FROM work_logs WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Supervisor/Admin: Performance Analytics Leaderboard
router.get('/analytics', protect, authorize('Supervisor', 'Admin'), (req, res) => {
  try {
    const leaderboard = db.prepare(
      `SELECT u.id, u.name, u.email,
              COUNT(wl.id) AS total_logs,
              SUM(CASE WHEN wl.status = 'Approved' THEN 1 ELSE 0 END) AS approved_logs,
              ROUND(COALESCE(SUM(wl.final_score), 0), 2) AS total_score
       FROM users u
       LEFT JOIN work_logs wl ON u.id = wl.employee_id
       WHERE u.role = 'Employee'
       GROUP BY u.id
       ORDER BY total_score DESC`
    ).all();
    res.json(leaderboard);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
