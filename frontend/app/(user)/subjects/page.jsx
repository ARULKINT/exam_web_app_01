'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { questionsAPI } from '@/lib/api';

const DIFFICULTIES = ['all', 'easy', 'medium', 'hard'];

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    questionsAPI.subjects().then(data => {
      setSubjects(data);
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-4xl animate-bounce">📚</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
          <Link href="/dashboard" className="text-gray-400 hover:text-gray-600">← Back</Link>
          <h1 className="text-lg font-bold text-gray-900">All Subjects</h1>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map(sub => {
            const count = sub.questions?.[0]?.count || 0;
            return (
              <div key={sub.id} className="card hover:shadow-lg transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="text-4xl">{sub.icon || '📚'}</div>
                  <span className="badge bg-blue-100 text-blue-700 text-xs">{count} Qs</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">{sub.name}</h3>
                <p className="text-gray-500 text-sm mb-5">{sub.description || 'Practice questions for this subject'}</p>
                <div className="space-y-2">
                  {DIFFICULTIES.filter(d => d !== 'all').map(diff => (
                    <Link
                      key={diff}
                      href={`/quiz/${sub.id}?type=practice&difficulty=${diff}`}
                      className="block w-full text-center py-2 px-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-sm font-medium text-gray-700 hover:text-blue-700 transition-colors capitalize"
                    >
                      {diff === 'easy' ? '🟢' : diff === 'medium' ? '🟡' : '🔴'} {diff}
                    </Link>
                  ))}
                  <Link
                    href={`/quiz/${sub.id}?type=practice`}
                    className="block w-full text-center py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-colors"
                  >
                    Start Practice →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
