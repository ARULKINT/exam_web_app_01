const express = require('express');
const { supabase } = require('../services/supabase');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email and password are required' });
  }

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return res.status(400).json({ error: error.message });

  await supabase.from('users').insert({
    id: data.user.id,
    name,
    email,
  });

  res.json({ message: 'Registration successful. Please check your email to confirm.' });
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return res.status(400).json({ error: error.message });

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', data.user.id)
    .single();

  res.json({ session: data.session, user: profile });
});

// Get current user profile
router.get('/me', authMiddleware, async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', req.user.id)
    .single();

  if (error) return res.status(404).json({ error: 'User not found' });
  res.json(data);
});

// Update streak
router.post('/streak', authMiddleware, async (req, res) => {
  const today = new Date().toDateString();
  const { data: user } = await supabase
    .from('users')
    .select('streak_days, last_active_date')
    .eq('id', req.user.id)
    .single();

  if (!user) return res.status(404).json({ error: 'User not found' });

  const lastActive = user.last_active_date ? new Date(user.last_active_date).toDateString() : null;
  let newStreak = user.streak_days;

  if (lastActive !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    newStreak = lastActive === yesterday.toDateString() ? newStreak + 1 : 1;

    await supabase
      .from('users')
      .update({ streak_days: newStreak, last_active_date: new Date().toISOString() })
      .eq('id', req.user.id);
  }

  res.json({ streak_days: newStreak });
});

module.exports = router;
