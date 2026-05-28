'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { testsAPI, questionsAPI, resultsAPI } from '@/lib/api';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function Timer({ seconds, onTimeUp }) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    if (left <= 0) { onTimeUp(); return; }
    const t = setTimeout(() => setLeft(l => l - 1), 1000);
    return () => clearTimeout(t);
  }, [left, onTimeUp]);

  const m = Math.floor(left / 60);
  const s = left % 60;
  const urgent = left < 60;

  return (
    <div className={`flex items-center gap-2 font-mono font-bold text-lg px-4 py-2 rounded-xl ${urgent ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-gray-100 text-gray-700'}`}>
      ⏱ {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
    </div>
  );
}

export default function QuizPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const type = searchParams.get('type') || 'practice';
  const difficulty = searchParams.get('difficulty');

  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [subject, setSubject] = useState(null);
  const [duration, setDuration] = useState(0);
  const startTime = useRef(Date.now());

  useEffect(() => {
    async function load() {
      try {
        if (type === 'daily' || type === 'practice') {
          const params = { limit: type === 'daily' ? 10 : 30 };
          if (difficulty) params.difficulty = difficulty;

          const subs = await questionsAPI.subjects();
          const sub = subs.find(s => s.id === Number(id));
          setSubject(sub);
          setDuration(type === 'daily' ? 600 : 1800);

          const qs = await questionsAPI.bySubject(id, params);
          setQuestions(shuffle(qs));
        } else {
          const test = await testsAPI.get(id);
          setSubject(test);
          setDuration((test.duration_mins || 30) * 60);
          setQuestions(test.questions || []);
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    load();
  }, [id, type, difficulty]);

  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    const timeTaken = Math.floor((Date.now() - startTime.current) / 1000);

    try {
      if (type === 'practice' || type === 'daily') {
        const questionIds = questions.map(q => q.id);
        const response = await resultsAPI.submitPractice(questionIds, answers, timeTaken);
        localStorage.setItem('quiz_result', JSON.stringify({
          result: response.result,
          review: response.review,
          subject: subject?.name,
          type,
        }));
        router.push('/results/practice');
      } else {
        // Formal test submission
        const answerMap = {};
        questions.forEach(q => { answerMap[q.id] = answers[q.id] || ''; });
        const response = await resultsAPI.submit(id, answerMap, timeTaken);
        router.push(`/results/${response.result.id}`);
      }
    } catch (err) {
      console.error(err);
      setSubmitting(false);
    }
  }, [answers, questions, id, type, subject, router, submitting]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="text-4xl mb-4 animate-spin-slow">⚙️</div>
        <p className="text-gray-500">Loading questions...</p>
      </div>
    </div>
  );

  if (questions.length === 0) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="text-4xl mb-4">😔</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">No questions available</h2>
        <p className="text-gray-500 mb-4">Questions for this subject haven't been added yet.</p>
        <button onClick={() => router.back()} className="btn-secondary">Go Back</button>
      </div>
    </div>
  );

  const q = questions[current];
  const answered = Object.keys(answers).length;
  const progress = ((current + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div>
            <div className="font-semibold text-gray-900">{subject?.name || 'Practice Quiz'}</div>
            <div className="text-xs text-gray-500">{answered}/{questions.length} answered</div>
          </div>
          {duration > 0 && <Timer seconds={duration} onTimeUp={handleSubmit} />}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="btn-primary py-2 text-sm"
          >
            {submitting ? 'Submitting...' : 'Submit Quiz'}
          </button>
        </div>
        {/* Progress Bar */}
        <div className="h-1 bg-gray-100">
          <div className="h-1 bg-blue-500 transition-all" style={{ width: `${progress}%` }} />
        </div>
      </header>

      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Question Panel */}
        <div className="lg:col-span-3">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <span className="badge bg-blue-100 text-blue-700">Q {current + 1} of {questions.length}</span>
              <span className={`badge capitalize ${q.difficulty === 'easy' ? 'bg-green-100 text-green-700' : q.difficulty === 'hard' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {q.difficulty || 'medium'}
              </span>
            </div>

            <p className="text-gray-900 font-medium text-lg leading-relaxed mb-6">{q.question}</p>

            {q.has_image && q.image_url && (
              <div className="mb-6 rounded-xl overflow-hidden border border-gray-200">
                <img src={q.image_url} alt="Question diagram" className="w-full object-contain max-h-64" />
              </div>
            )}

            <div className="space-y-3">
              {['A', 'B', 'C', 'D'].map(opt => {
                const text = q[`option_${opt.toLowerCase()}`];
                const selected = answers[q.id] === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => setAnswers(a => ({ ...a, [q.id]: opt }))}
                    className={`w-full flex items-start gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                      selected
                        ? 'border-blue-500 bg-blue-50 text-blue-800'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${selected ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
                      {opt}
                    </span>
                    <span className="leading-relaxed pt-0.5">{text}</span>
                  </button>
                );
              })}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8">
              <button
                onClick={() => setCurrent(c => Math.max(0, c - 1))}
                disabled={current === 0}
                className="btn-secondary disabled:opacity-30"
              >
                ← Previous
              </button>
              <button
                onClick={() => setAnswers(a => { const n = {...a}; delete n[q.id]; return n; })}
                className="text-sm text-gray-400 hover:text-red-500"
              >
                Clear answer
              </button>
              {current < questions.length - 1 ? (
                <button
                  onClick={() => setCurrent(c => c + 1)}
                  className="btn-primary"
                >
                  Next →
                </button>
              ) : (
                <button onClick={handleSubmit} disabled={submitting} className="btn-primary">
                  {submitting ? 'Submitting...' : 'Finish Quiz'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Question Navigator */}
        <div className="lg:col-span-1">
          <div className="card sticky top-24">
            <h3 className="font-semibold text-gray-900 mb-4 text-sm">Question Navigator</h3>
            <div className="grid grid-cols-5 gap-1.5">
              {questions.map((q, i) => (
                <button
                  key={q.id}
                  onClick={() => setCurrent(i)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                    i === current
                      ? 'bg-blue-600 text-white'
                      : answers[q.id]
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <div className="mt-4 space-y-2 text-xs text-gray-500">
              <div className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-blue-600 inline-block" /> Current</div>
              <div className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-green-500 inline-block" /> Answered</div>
              <div className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-gray-100 border border-gray-300 inline-block" /> Not answered</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
