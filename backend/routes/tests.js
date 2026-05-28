const express = require('express');
const { supabase } = require('../services/supabase');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// List available tests
router.get('/', async (req, res) => {
  const { subject_id, test_type } = req.query;
  let query = supabase
    .from('tests')
    .select('*, subjects(name, color, icon)')
    .eq('is_active', true);

  if (subject_id) query = query.eq('subject_id', subject_id);
  if (test_type) query = query.eq('test_type', test_type);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Get a specific test with its questions (without answers)
router.get('/:id', authMiddleware, async (req, res) => {
  const { data: test, error } = await supabase
    .from('tests')
    .select('*, subjects(name, color)')
    .eq('id', req.params.id)
    .single();

  if (error || !test) return res.status(404).json({ error: 'Test not found' });

  // Fetch questions for this test
  const { data: testQuestions } = await supabase
    .from('test_questions')
    .select('questions(id, question, option_a, option_b, option_c, option_d, has_image, image_url, difficulty)')
    .eq('test_id', req.params.id);

  const questions = testQuestions?.map(tq => tq.questions) || [];
  res.json({ ...test, questions });
});

// Get daily practice questions for a subject
router.get('/daily/:subjectId', authMiddleware, async (req, res) => {
  const { subjectId } = req.params;

  const { data, error } = await supabase
    .from('questions')
    .select('id, question, option_a, option_b, option_c, option_d, has_image, image_url, difficulty')
    .eq('subject_id', subjectId)
    .limit(10);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

module.exports = router;
