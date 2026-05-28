const express = require('express');
const { supabase } = require('../services/supabase');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// Get all subjects with question counts
router.get('/subjects', async (req, res) => {
  const { data, error } = await supabase
    .from('subjects')
    .select('*, questions(count)');

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Get questions by subject (random sample)
router.get('/subject/:subjectId', authMiddleware, async (req, res) => {
  const { subjectId } = req.params;
  const { limit = 30, difficulty } = req.query;
  const n = Math.min(Number(limit), 50);

  // Get total count first for random offset
  let countQuery = supabase
    .from('questions')
    .select('id', { count: 'exact', head: true })
    .eq('subject_id', subjectId);
  if (difficulty) countQuery = countQuery.eq('difficulty', difficulty);
  const { count } = await countQuery;

  // Pick a random starting offset so each session is fresh
  const maxOffset = Math.max(0, (count || 0) - n);
  const offset = maxOffset > 0 ? Math.floor(Math.random() * maxOffset) : 0;

  let query = supabase
    .from('questions')
    .select('id, question, option_a, option_b, option_c, option_d, has_image, image_url, difficulty')
    .eq('subject_id', subjectId)
    .range(offset, offset + n - 1);

  if (difficulty) query = query.eq('difficulty', difficulty);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Get question with answer (only after test submission)
router.get('/:id/answer', authMiddleware, async (req, res) => {
  const { data, error } = await supabase
    .from('questions')
    .select('id, correct_ans, explanation')
    .eq('id', req.params.id)
    .single();

  if (error) return res.status(404).json({ error: 'Question not found' });
  res.json(data);
});

// Bookmark a question
router.post('/:id/bookmark', authMiddleware, async (req, res) => {
  const { data: existing } = await supabase
    .from('bookmarks')
    .select('id')
    .eq('user_id', req.user.id)
    .eq('question_id', req.params.id)
    .single();

  if (existing) {
    await supabase.from('bookmarks').delete().eq('id', existing.id);
    return res.json({ bookmarked: false });
  }

  await supabase.from('bookmarks').insert({
    user_id: req.user.id,
    question_id: req.params.id,
  });
  res.json({ bookmarked: true });
});

// Get user bookmarks
router.get('/bookmarks/mine', authMiddleware, async (req, res) => {
  const { subject_id } = req.query;
  let query = supabase
    .from('bookmarks')
    .select('id, question_id, questions(id, question, option_a, option_b, option_c, option_d, correct_ans, explanation, difficulty, subject_id, subjects(name, color))')
    .eq('user_id', req.user.id);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  const filtered = subject_id
    ? data.filter(b => b.questions?.subject_id === Number(subject_id))
    : data;

  res.json(filtered);
});

module.exports = router;
