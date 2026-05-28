'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { questionsAPI } from '@/lib/api';

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    async function load() {
      const [bmarks, subs] = await Promise.all([
        questionsAPI.myBookmarks(),
        questionsAPI.subjects(),
      ]);
      setBookmarks(bmarks);
      setSubjects(subs);
      setLoading(false);
    }
    load();
  }, []);

  const handleRemove = async (questionId) => {
    await questionsAPI.bookmark(questionId);
    setBookmarks(b => b.filter(bm => bm.question_id !== questionId));
  };

  const filtered = filter === 'all'
    ? bookmarks
    : bookmarks.filter(b => b.questions?.subject_id === Number(filter));

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="text-4xl animate-bounce">🔖</div></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="text-gray-400 hover:text-gray-600">← Back</Link>
          <h1 className="font-bold text-gray-900">Bookmarks ({bookmarks.length})</h1>
          <div />
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="flex gap-2 flex-wrap mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}
          >
            All ({bookmarks.length})
          </button>
          {subjects.filter(s => bookmarks.some(b => b.questions?.subject_id === s.id)).map(s => (
            <button
              key={s.id}
              onClick={() => setFilter(String(s.id))}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filter === String(s.id) ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}
            >
              {s.name}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="card text-center py-16">
            <div className="text-5xl mb-4">🔖</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">No bookmarks yet</h2>
            <p className="text-gray-500 mb-6">Bookmark questions from your quiz review to practice them later.</p>
            <Link href="/subjects" className="btn-primary inline-block">Start Practicing</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(bm => {
              const q = bm.questions;
              if (!q) return null;
              const isExpanded = expanded[q.id];
              return (
                <div key={bm.id} className="card">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="badge bg-blue-100 text-blue-700 text-xs">{q.subjects?.name}</span>
                        <span className={`badge text-xs capitalize ${q.difficulty === 'easy' ? 'bg-green-100 text-green-700' : q.difficulty === 'hard' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{q.difficulty}</span>
                      </div>
                      <p className="text-gray-900 font-medium leading-relaxed">{q.question}</p>
                    </div>
                    <button onClick={() => handleRemove(q.id)} className="shrink-0 text-gray-300 hover:text-red-400 text-lg">✕</button>
                  </div>

                  <button
                    onClick={() => setExpanded(e => ({ ...e, [q.id]: !e[q.id] }))}
                    className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {isExpanded ? '▲ Hide answer' : '▼ Show answer'}
                  </button>

                  {isExpanded && (
                    <div className="mt-4 space-y-2">
                      {['A', 'B', 'C', 'D'].map(opt => (
                        <div key={opt} className={`flex items-start gap-2 p-2.5 rounded-lg text-sm ${opt === q.correct_ans ? 'bg-green-100 text-green-800 font-medium' : 'text-gray-600'}`}>
                          <span className={`shrink-0 w-5 h-5 rounded flex items-center justify-center text-xs font-bold ${opt === q.correct_ans ? 'bg-green-500 text-white' : 'bg-gray-200'}`}>{opt}</span>
                          {q[`option_${opt.toLowerCase()}`]}
                          {opt === q.correct_ans && <span className="ml-auto text-green-600">✓</span>}
                        </div>
                      ))}
                      {q.explanation && (
                        <div className="bg-blue-50 text-blue-800 rounded-xl p-3 text-sm mt-2">
                          💡 {q.explanation}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
