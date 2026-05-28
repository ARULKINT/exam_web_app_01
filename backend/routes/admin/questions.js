const express = require('express');
const { supabase } = require('../../services/supabase');
const authMiddleware = require('../../middleware/auth');
const adminOnly = require('../../middleware/adminOnly');
const router = express.Router();

router.use(authMiddleware, adminOnly);

// Get all questions with pagination & filters
router.get('/', async (req, res) => {
  const { subject_id, difficulty, page = 1, limit = 50 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  let query = supabase
    .from('questions')
    .select('*, subjects(name)', { count: 'exact' })
    .range(offset, offset + Number(limit) - 1)
    .order('created_at', { ascending: false });

  if (subject_id) query = query.eq('subject_id', subject_id);
  if (difficulty) query = query.eq('difficulty', difficulty);

  const { data, error, count } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data, count, page: Number(page), limit: Number(limit) });
});

// Create a question manually
router.post('/', async (req, res) => {
  const { subject_id, question, option_a, option_b, option_c, option_d, correct_ans, explanation, difficulty, source_book, page_no } = req.body;

  const required = { subject_id, question, option_a, option_b, option_c, option_d, correct_ans };
  const missing = Object.entries(required).filter(([, v]) => !v).map(([k]) => k);
  if (missing.length) return res.status(400).json({ error: `Missing: ${missing.join(', ')}` });

  if (!['A', 'B', 'C', 'D'].includes(correct_ans)) {
    return res.status(400).json({ error: 'correct_ans must be A, B, C, or D' });
  }

  const { data, error } = await supabase
    .from('questions')
    .insert({ subject_id, question, option_a, option_b, option_c, option_d, correct_ans, explanation, difficulty: difficulty || 'medium', source_book, page_no })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// Update a question
router.put('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('questions')
    .update(req.body)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Delete a question
router.delete('/:id', async (req, res) => {
  const { error } = await supabase
    .from('questions')
    .delete()
    .eq('id', req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Question deleted' });
});

// Bulk delete
router.delete('/bulk', async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'ids array is required' });
  }

  const { error } = await supabase
    .from('questions')
    .delete()
    .in('id', ids);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: `${ids.length} questions deleted` });
});

// Admin dashboard stats
router.get('/stats', async (req, res) => {
  const [questions, users, results, uploads] = await Promise.all([
    supabase.from('questions').select('*', { count: 'exact', head: true }),
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('test_results').select('*', { count: 'exact', head: true }).gte('submitted_at', new Date(new Date().setHours(0,0,0,0)).toISOString()),
    supabase.from('pdf_upload_logs').select('*').order('started_at', { ascending: false }).limit(5),
  ]);

  res.json({
    total_questions: questions.count || 0,
    total_users: users.count || 0,
    tests_today: results.count || 0,
    recent_uploads: uploads.data || [],
  });
});

module.exports = router;
