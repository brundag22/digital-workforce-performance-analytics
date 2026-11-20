const express = require('express');
const db = require('../db');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Admin: Create a KPI
router.post('/', protect, authorize('Admin'), (req, res) => {
  try {
    const { title, description = '', target_value, weightage } = req.body;
    const result = db.prepare(
      'INSERT INTO kpis (title, description, target_value, weightage) VALUES (?, ?, ?, ?)'
    ).run(title, description, target_value, weightage);

    const kpi = db.prepare('SELECT * FROM kpis WHERE id = ?').get(Number(result.lastInsertRowid));
    res.status(201).json(kpi);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// All authenticated users: View all KPIs
router.get('/', protect, (req, res) => {
  try {
    const kpis = db.prepare('SELECT * FROM kpis ORDER BY created_at DESC').all();
    res.json(kpis);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
