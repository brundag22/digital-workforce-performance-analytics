const express = require('express');
const db = require('../db');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Citizen: Submit a new certificate request
router.post('/', protect, authorize('Citizen'), (req, res) => {
  try {
    const { certificate_type, document_url = null } = req.body;
    const result = db.prepare(
      'INSERT INTO service_requests (certificate_type, applicant_id, document_url) VALUES (?, ?, ?)'
    ).run(certificate_type, req.user.id, document_url);

    const request = db.prepare('SELECT * FROM service_requests WHERE id = ?').get(Number(result.lastInsertRowid));
    res.status(201).json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Citizen: View own requests
router.get('/my', protect, authorize('Citizen'), (req, res) => {
  try {
    const requests = db.prepare(
      'SELECT * FROM service_requests WHERE applicant_id = ? ORDER BY created_at DESC'
    ).all(req.user.id);
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Agent/Admin: View pending requests and requests assigned to this agent
router.get('/agent', protect, authorize('Agent', 'Admin'), (req, res) => {
  try {
    const requests = db.prepare(
      `SELECT sr.*, u.name AS applicant_name, u.email AS applicant_email
       FROM service_requests sr
       JOIN users u ON sr.applicant_id = u.id
       WHERE sr.status = 'Pending' OR sr.assigned_agent_id = ?
       ORDER BY sr.created_at DESC`
    ).all(req.user.id);
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Agent: Accept or Reject a pending request
router.patch('/:id/respond', protect, authorize('Agent'), (req, res) => {
  try {
    const { action } = req.body; // 'accept' or 'reject'
    const status = action === 'accept' ? 'In Progress' : action === 'reject' ? 'Rejected' : null;
    if (!status) return res.status(400).json({ message: 'Action must be accept or reject' });

    const assignedAgentId = action === 'accept' ? req.user.id : null;
    const result = db.prepare(
      'UPDATE service_requests SET status = ?, assigned_agent_id = ? WHERE id = ? AND status = ?'
    ).run(status, assignedAgentId, req.params.id, 'Pending');

    if (result.changes === 0) return res.status(404).json({ message: 'Pending request not found' });

    const updated = db.prepare('SELECT * FROM service_requests WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Agent: Update status of an assigned request
router.patch('/:id/status', protect, authorize('Agent'), (req, res) => {
  try {
    const { status, document_url } = req.body;
    const result = db.prepare(
      `UPDATE service_requests
       SET status = ?, document_url = COALESCE(?, document_url)
       WHERE id = ? AND assigned_agent_id = ?`
    ).run(status, document_url ?? null, req.params.id, req.user.id);

    if (result.changes === 0) return res.status(404).json({ message: 'Assigned request not found' });

    const updated = db.prepare('SELECT * FROM service_requests WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
