const express = require('express');
const { supabase } = require('../services/supabase');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

const POINTS_CORRECT = 10;
const POINTS_WRONG = -2;

// Submit test result
router.post('/submit', authMiddleware, async (req, res) => {
  const { test_id, answers, time_taken } = req.body;
  if (!test_id || !answers) {
    return res.status(400).json({ error: 'test_id and answers are required' });
  }

  // Fetch correct answers for all answered questions
  const questionIds = Object.keys(answers);
  const { data: questions, error } = await supabase
    .from('questions')
    .select('id, correct_ans, explanation')
    .in('id', questionIds);

  if (error) return res.status(500).json({ error: error.message });

  let correct = 0, wrong = 0, skipped = 0;
  const reviewData = [];

  for (const q of questions) {
    const userAnswer = answers[q.id];
    if (!userAnswer || userAnswer === '') {
      skipped++;
    } else if (userAnswer === q.correct_ans) {
      correct++;
    } else {
      wrong++;
    }
    reviewData.push({
      question_id: q.id,
      user_answer: userAnswer || null,
      correct_ans: q.correct_ans,
      explanation: q.explanation,
      is_correct: userAnswer === q.correct_ans,
    });
  }

  const { data: test } = await supabase
    .from('tests')
    .select('total_marks')
    .eq('id', test_id)
    .single();

  const score = (correct * POINTS_CORRECT) + (wrong * POINTS_WRONG);
  const total_marks = test?.total_marks || questions.length * POINTS_CORRECT;

  const { data: result, error: insertError } = await supabase
    .from('test_results')
    .insert({
      user_id: req.user.id,
      test_id,
      score: Math.max(0, score),
      total_marks,
      time_taken: time_taken || 0,
      correct_count: correct,
      wrong_count: wrong,
      skipped_count: skipped,
    })
    .select()
    .single();

  if (insertError) return res.status(500).json({ error: insertError.message });

  // Update user points
  await supabase.rpc('increment_points', {
    user_id: req.user.id,
    points: Math.max(0, score),
  });

  res.json({ result, review: reviewData });
});

// Get a specific result
router.get('/:id', authMiddleware, async (req, res) => {
  const { data, error } = await supabase
    .from('test_results')
    .select('*, tests(title, subjects(name))')
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)
    .single();

  if (error || !data) return res.status(404).json({ error: 'Result not found' });
  res.json(data);
});

// Get user's recent results
router.get('/my/history', authMiddleware, async (req, res) => {
  const { data, error } = await supabase
    .from('test_results')
    .select('*, tests(title, test_type, subjects(name, color))')
    .eq('user_id', req.user.id)
    .order('submitted_at', { ascending: false })
    .limit(20);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Leaderboard
router.get('/leaderboard/weekly', async (req, res) => {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const { data, error } = await supabase
    .from('test_results')
    .select('user_id, score, users(name, avatar_url)')
    .gte('submitted_at', weekAgo.toISOString())
    .order('score', { ascending: false })
    .limit(50);

  if (error) return res.status(500).json({ error: error.message });

  // Aggregate by user
  const leaderMap = {};
  for (const row of data) {
    if (!leaderMap[row.user_id]) {
      leaderMap[row.user_id] = { user_id: row.user_id, total_score: 0, user: row.users };
    }
    leaderMap[row.user_id].total_score += row.score;
  }

  const leaderboard = Object.values(leaderMap)
    .sort((a, b) => b.total_score - a.total_score)
    .map((entry, i) => ({ ...entry, rank: i + 1 }));

  res.json(leaderboard);
});

module.exports = router;
