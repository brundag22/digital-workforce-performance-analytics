const express = require('express');
const db = require('../db');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Admin: Get all users (excluding passwords)
router.get('/users', protect, authorize('Admin'), (req, res) => {
  try {
    const users = db.prepare(
      'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC'
    ).all();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: Get all service requests
router.get('/requests', protect, authorize('Admin'), (req, res) => {
  try {
    const requests = db.prepare(
      `SELECT sr.*, u.name AS applicant_name, a.name AS agent_name
       FROM service_requests sr
       JOIN users u ON sr.applicant_id = u.id
       LEFT JOIN users a ON sr.assigned_agent_id = a.id
       ORDER BY sr.created_at DESC`
    ).all();
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: Dashboard summary stats
router.get('/stats', protect, authorize('Admin'), (req, res) => {
  try {
    const totalUsers = db.prepare('SELECT COUNT(*) AS count FROM users').get().count;
    const totalRequests = db.prepare('SELECT COUNT(*) AS count FROM service_requests').get().count;
    const byStatus = db.prepare(
      'SELECT status, COUNT(*) AS count FROM service_requests GROUP BY status'
    ).all();

    res.json({ totalUsers, totalRequests, byStatus });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
