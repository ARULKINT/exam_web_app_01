'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminAPI } from '@/lib/api';
import { supabase } from '@/lib/supabase';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function check() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { window.location.href = '/login'; return; }

      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (profile?.role !== 'admin') { window.location.href = '/dashboard'; return; }

      const data = await adminAPI.stats();
      setStats(data);
      setLoading(false);
    }
    check();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="text-4xl animate-bounce">⚙️</div></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-gray-900 text-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg">
            <span>🎯</span> GovExam Pro <span className="bg-yellow-500 text-yellow-900 text-xs px-2 py-0.5 rounded-full ml-2">Admin</span>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <Link href="/admin/upload" className="hover:text-blue-300">📤 Upload PDF</Link>
            <Link href="/admin/questions" className="hover:text-blue-300">❓ Questions</Link>
            <button onClick={handleLogout} className="text-red-400 hover:text-red-300">Logout</button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {[
            { label: 'Total Questions', value: stats?.total_questions?.toLocaleString(), icon: '❓', color: 'bg-blue-50 text-blue-700' },
            { label: 'Total Users', value: stats?.total_users?.toLocaleString(), icon: '👥', color: 'bg-green-50 text-green-700' },
            { label: 'Tests Today', value: stats?.tests_today?.toLocaleString(), icon: '📝', color: 'bg-purple-50 text-purple-700' },
            { label: 'Uploads', value: stats?.recent_uploads?.length, icon: '📁', color: 'bg-orange-50 text-orange-700' },
          ].map(card => (
            <div key={card.label} className="card">
              <div className={`w-12 h-12 ${card.color} rounded-xl flex items-center justify-center text-2xl mb-4`}>{card.icon}</div>
              <div className="text-3xl font-extrabold text-gray-900">{card.value ?? 0}</div>
              <div className="text-gray-500 text-sm mt-1">{card.label}</div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          <Link href="/admin/upload" className="card hover:shadow-md transition-shadow text-center group">
            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform inline-block">📄</div>
            <h3 className="font-bold text-lg text-gray-900">Upload PDF</h3>
            <p className="text-gray-500 text-sm mt-1">Extract questions from books using Gemini AI</p>
          </Link>
          <Link href="/admin/questions" className="card hover:shadow-md transition-shadow text-center group">
            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform inline-block">✏️</div>
            <h3 className="font-bold text-lg text-gray-900">Manage Questions</h3>
            <p className="text-gray-500 text-sm mt-1">View, edit, and delete questions</p>
          </Link>
          <Link href="/admin/questions?mode=add" className="card hover:shadow-md transition-shadow text-center group">
            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform inline-block">➕</div>
            <h3 className="font-bold text-lg text-gray-900">Add Question</h3>
            <p className="text-gray-500 text-sm mt-1">Manually add a new question</p>
          </Link>
        </div>

        {/* Recent Uploads */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Uploads</h2>
          {stats?.recent_uploads?.length === 0 ? (
            <div className="card text-center py-8 text-gray-400">No uploads yet.</div>
          ) : (
            <div className="space-y-3">
              {stats?.recent_uploads?.map(log => (
                <div key={log.id} className="card flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="text-2xl">📄</div>
                    <div>
                      <div className="font-medium text-gray-900">{log.file_name}</div>
                      <div className="text-sm text-gray-500">{log.subjects?.name} · {log.total_questions} questions</div>
                    </div>
                  </div>
                  <span className={`badge text-xs capitalize ${
                    log.status === 'completed' ? 'bg-green-100 text-green-700' :
                    log.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                    log.status === 'failed' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>{log.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
