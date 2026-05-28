'use client';
import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { questionsAPI } from '@/lib/api';

function ScoreRing({ percent }) {
  const color = percent >= 60 ? '#22c55e' : percent >= 40 ? '#f59e0b' : '#ef4444';
  const r = 40;
  const circumference = 2 * Math.PI * r;
  const dash = (percent / 100) * circumference;

  return (
    <svg width="120" height="120" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r={r} fill="none" stroke="#f3f4f6" strokeWidth="10" />
      <circle
        cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="10"
        strokeDasharray={`${dash} ${circumference}`}
        strokeLinecap="round"
        transform="rotate(-90 50 50)"
      />
      <text x="50" y="45" textAnchor="middle" fill={color} fontSize="18" fontWeight="bold">{percent}%</text>
      <text x="50" y="62" textAnchor="middle" fill="#9ca3af" fontSize="10">Score</text>
    </svg>
  );
}

export default function ResultsPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [result, setResult] = useState(null);
  const [review, setReview] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id === 'practice') {
      const stored = localStorage.getItem('quiz_result');
      if (stored) {
        const data = JSON.parse(stored);
        const { result, review, subject, type } = data;
        setResult({ ...result, subject, type });
        setReview(review || []);
      }
      setLoading(false);
    }
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="text-4xl animate-bounce">📊</div></div>;
  if (!result) return <div className="min-h-screen flex items-center justify-center"><p>Result not found.</p></div>;

  const percent = Math.round((result.score / result.total_marks) * 100);
  const grade = percent >= 80 ? 'Excellent! 🎉' : percent >= 60 ? 'Good Job! 👍' : percent >= 40 ? 'Keep Practicing 📚' : 'Need More Practice 💪';
  const mins = Math.floor((result.time_taken || 0) / 60);
  const secs = (result.time_taken || 0) % 60;

  const filtered = review.filter(r => {
    if (activeFilter === 'correct') return r.is_correct;
    if (activeFilter === 'wrong') return !r.is_correct && r.user_answer;
    if (activeFilter === 'skipped') return !r.user_answer;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 font-medium">← Dashboard</Link>
          <h1 className="font-bold text-gray-900">Quiz Results</h1>
          <div />
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Score Card */}
        <div className="card">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{grade}</h2>
            <p className="text-gray-500">{result.subject} — {result.type || 'Practice'}</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
            <ScoreRing percent={percent} />
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-2xl font-extrabold text-green-500">{result.correct_count}</div>
                <div className="text-sm text-gray-500">Correct</div>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-red-500">{result.wrong_count}</div>
                <div className="text-sm text-gray-500">Wrong</div>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-gray-400">{result.skipped_count}</div>
                <div className="text-sm text-gray-500">Skipped</div>
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-center gap-2 text-sm text-gray-500">
            <span>Score: <strong className="text-gray-900">{result.score}/{result.total_marks}</strong></span>
            <span>·</span>
            <span>Time: <strong className="text-gray-900">{mins}m {secs}s</strong></span>
          </div>
          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            <Link href="/subjects" className="btn-primary text-sm py-2">New Practice →</Link>
            <Link href="/dashboard" className="btn-secondary text-sm py-2">Dashboard</Link>
          </div>
        </div>

        {/* Review Section */}
        <div>
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <h2 className="text-lg font-bold text-gray-900">Question Review</h2>
            <div className="flex gap-2">
              {['all', 'correct', 'wrong', 'skipped'].map(f => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors capitalize ${activeFilter === f ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300'}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {filtered.map((item, i) => (
              <div key={item.question_id} className={`card border-l-4 ${item.is_correct ? 'border-l-green-500' : item.user_answer ? 'border-l-red-500' : 'border-l-gray-300'}`}>
                <div className="flex items-start gap-3 mb-4">
                  <span className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${item.is_correct ? 'bg-green-500' : item.user_answer ? 'bg-red-500' : 'bg-gray-400'}`}>
                    {item.is_correct ? '✓' : item.user_answer ? '✗' : '—'}
                  </span>
                  <p className="text-gray-900 font-medium leading-relaxed">{item.question}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                  {['A', 'B', 'C', 'D'].map(opt => {
                    const text = item[`option_${opt.toLowerCase()}`];
                    const isCorrect = opt === item.correct_ans;
                    const isUser = opt === item.user_answer;
                    return (
                      <div key={opt} className={`flex items-start gap-2 p-2 rounded-lg text-sm ${isCorrect ? 'bg-green-100 text-green-800' : isUser && !isCorrect ? 'bg-red-100 text-red-800' : 'text-gray-600'}`}>
                        <span className={`shrink-0 w-5 h-5 rounded flex items-center justify-center text-xs font-bold ${isCorrect ? 'bg-green-500 text-white' : isUser && !isCorrect ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-600'}`}>{opt}</span>
                        {text}
                        {isCorrect && <span className="ml-auto text-green-600 text-xs">✓ Correct</span>}
                        {isUser && !isCorrect && <span className="ml-auto text-red-600 text-xs">Your answer</span>}
                      </div>
                    );
                  })}
                </div>
                {item.explanation && (
                  <div className="bg-blue-50 text-blue-800 rounded-xl p-3 text-sm">
                    <strong>💡 Explanation:</strong> {item.explanation}
                  </div>
                )}
                <div className="mt-3">
                  <BookmarkButton questionId={item.question_id} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function BookmarkButton({ questionId }) {
  const [bookmarked, setBookmarked] = useState(false);
  const toggle = async () => {
    const res = await questionsAPI.bookmark(questionId);
    setBookmarked(res.bookmarked);
  };
  return (
    <button onClick={toggle} className="text-sm text-gray-400 hover:text-yellow-500 transition-colors">
      {bookmarked ? '⭐ Bookmarked' : '☆ Bookmark this question'}
    </button>
  );
}
