const express = require('express');
const multer = require('multer');
const { supabase } = require('../../services/supabase');
const { processPDF } = require('../../services/batchProcessor');
const authMiddleware = require('../../middleware/auth');
const adminOnly = require('../../middleware/adminOnly');
const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF files are allowed'), false);
    }
    cb(null, true);
  },
});

router.use(authMiddleware, adminOnly);

// Upload and start processing a PDF
router.post('/', upload.single('pdf'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'PDF file is required' });

  const { subject_id, source_book, difficulty = 'medium' } = req.body;
  if (!subject_id) return res.status(400).json({ error: 'subject_id is required' });

  const { data: log, error } = await supabase
    .from('pdf_upload_logs')
    .insert({
      admin_id: req.user.id,
      file_name: req.file.originalname,
      subject_id: Number(subject_id),
      source_book: source_book || req.file.originalname,
      status: 'pending',
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  // Process asynchronously
  processPDF(log.id, req.file.buffer, Number(subject_id), source_book, difficulty)
    .catch(err => {
      console.error('PDF processing error:', err);
      supabase
        .from('pdf_upload_logs')
        .update({ status: 'failed' })
        .eq('id', log.id);
    });

  res.json({ message: 'Upload started', log_id: log.id, log });
});

// Get processing status
router.get('/status/:logId', async (req, res) => {
  const { data, error } = await supabase
    .from('pdf_upload_logs')
    .select('*')
    .eq('id', req.params.logId)
    .single();

  if (error || !data) return res.status(404).json({ error: 'Upload log not found' });
  res.json(data);
});

// Get all upload logs
router.get('/logs', async (req, res) => {
  const { data, error } = await supabase
    .from('pdf_upload_logs')
    .select('*, subjects(name)')
    .order('started_at', { ascending: false })
    .limit(50);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

module.exports = router;
