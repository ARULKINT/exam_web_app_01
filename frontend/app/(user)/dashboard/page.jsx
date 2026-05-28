'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { questionsAPI, resultsAPI, authAPI } from '@/lib/api';

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [recentResults, setRecentResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = '/login';
        return;
      }

      try {
        const [profile, subs, history] = await Promise.all([
          authAPI.me(),
          questionsAPI.subjects(),
          resultsAPI.history(),
        ]);
        setUser(profile);
        setSubjects(subs.slice(0, 6));
        setRecentResults(history.slice(0, 5));

        authAPI.updateStreak().catch(() => {});
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4 animate-bounce">🎯</div>
        <p className="text-gray-500">Loading your dashboard...</p>
      </div>
    </div>
  );

  const todayChallenge = subjects[0];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg">
            <span>🎯</span> GovExam Pro
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/subjects" className="text-gray-600 hover:text-gray-900 text-sm font-medium">Subjects</Link>
            <Link href="/bookmarks" className="text-gray-600 hover:text-gray-900 text-sm font-medium">Bookmarks</Link>
            <Link href="/leaderboard" className="text-gray-600 hover:text-gray-900 text-sm font-medium">Leaderboard</Link>
            <button onClick={handleLogout} className="text-sm text-red-500 hover:text-red-600 font-medium">Logout</button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {user?.name?.split(' ')[0]} 👋
            </h1>
            <p className="text-gray-500 mt-1">Keep going! You're making great progress.</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-extrabold text-orange-500">{user?.streak_days || 0}</div>
              <div className="text-xs text-gray-500">Day Streak 🔥</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-extrabold text-blue-600">{user?.total_points || 0}</div>
              <div className="text-xs text-gray-500">Total Points</div>
            </div>
          </div>
        </div>

        {/* Today's Challenge */}
        {todayChallenge && (
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white mb-8 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-blue-200 mb-1">📅 Today's Challenge</div>
              <h2 className="text-xl font-bold mb-1">{todayChallenge.name} — Daily Quiz</h2>
              <p className="text-blue-200 text-sm">10 questions • ~10 minutes</p>
            </div>
            <Link
              href={`/quiz/${todayChallenge.id}?type=daily`}
              className="bg-white text-blue-700 hover:bg-blue-50 font-bold py-3 px-6 rounded-xl transition-colors whitespace-nowrap"
            >
              Start Now →
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Subjects */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Quick Practice</h2>
              <Link href="/subjects" className="text-blue-600 text-sm font-medium hover:text-blue-700">View all →</Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {subjects.map(sub => (
                <Link
                  key={sub.id}
                  href={`/quiz/${sub.id}?type=practice`}
                  className="card hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
                >
                  <div className="text-3xl mb-2">{sub.icon || '📚'}</div>
                  <div className="font-semibold text-gray-900">{sub.name}</div>
                  <div className="text-sm text-gray-500 mt-1">
                    {sub.questions?.[0]?.count || 0} questions
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Results */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Tests</h2>
            {recentResults.length === 0 ? (
              <div className="card text-center py-8">
                <div className="text-3xl mb-3">📝</div>
                <p className="text-gray-500 text-sm">No tests taken yet.<br />Start practicing!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentResults.map(r => {
                  const percent = Math.round((r.score / r.total_marks) * 100);
                  return (
                    <Link key={r.id} href={`/results/${r.id}`} className="card flex items-center gap-4 hover:shadow-md transition-shadow p-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white ${percent >= 60 ? 'bg-green-500' : percent >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}>
                        {percent}%
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 text-sm truncate">{r.tests?.title || 'Practice Test'}</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {r.correct_count} correct · {r.wrong_count} wrong
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
