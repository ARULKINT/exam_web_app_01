const { supabase } = require('../services/supabase');

async function adminOnly(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { data, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', req.user.id)
    .single();

  if (error || !data || data.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: admin access required' });
  }

  next();
}

module.exports = adminOnly;
