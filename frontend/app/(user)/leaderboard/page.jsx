'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { resultsAPI } from '@/lib/api';
import { supabase } from '@/lib/supabase';

export default function LeaderboardPage() {
  const [leaders, setLeaders] = useState([]);
  const [myId, setMyId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      setMyId(session?.user?.id);
      const data = await resultsAPI.leaderboard();
      setLeaders(data);
      setLoading(false);
    }
    load();
  }, []);

  const MEDAL = ['🥇', '🥈', '🥉'];

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="text-4xl animate-bounce">🏆</div></div>;

  const myRank = leaders.find(l => l.user_id === myId);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="text-gray-400 hover:text-gray-600">← Back</Link>
          <h1 className="font-bold text-gray-900">Weekly Leaderboard</h1>
          <div />
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {myRank && (
          <div className="card bg-gradient-to-r from-blue-600 to-indigo-600 text-white mb-6 flex items-center justify-between">
            <div>
              <div className="text-sm text-blue-200">Your Rank</div>
              <div className="text-3xl font-extrabold">#{myRank.rank}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-blue-200">Weekly Score</div>
              <div className="text-2xl font-bold">{myRank.total_score} pts</div>
            </div>
          </div>
        )}

        {leaders.length === 0 ? (
          <div className="card text-center py-12">
            <div className="text-4xl mb-4">🏆</div>
            <p className="text-gray-500">No scores this week yet. Be the first!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {leaders.map((leader, i) => (
              <div
                key={leader.user_id}
                className={`card flex items-center gap-4 p-4 ${leader.user_id === myId ? 'ring-2 ring-blue-500' : ''}`}
              >
                <div className="w-10 text-center">
                  {i < 3 ? (
                    <span className="text-2xl">{MEDAL[i]}</span>
                  ) : (
                    <span className="text-lg font-bold text-gray-400">#{leader.rank}</span>
                  )}
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                  {leader.user?.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">
                    {leader.user?.name || 'Anonymous'}
                    {leader.user_id === myId && <span className="ml-2 text-xs text-blue-600 font-medium">(You)</span>}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900">{leader.total_score}</div>
                  <div className="text-xs text-gray-500">points</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
