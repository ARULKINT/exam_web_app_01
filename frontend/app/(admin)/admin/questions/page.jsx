'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { adminAPI, questionsAPI } from '@/lib/api';

export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ subject_id: '', difficulty: '' });
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = { page, limit: 50 };
    if (filters.subject_id) params.subject_id = filters.subject_id;
    if (filters.difficulty) params.difficulty = filters.difficulty;

    const res = await adminAPI.questions(params);
    setQuestions(res.data || []);
    setTotal(res.count || 0);
    setLoading(false);
  }, [page, filters]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { questionsAPI.subjects().then(setSubjects); }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this question?')) return;
    await adminAPI.deleteQuestion(id);
    load();
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selected.length} questions?`)) return;
    await adminAPI.bulkDelete(selected);
    setSelected([]);
    load();
  };

  const toggleSelect = (id) => {
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-gray-900 text-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
          <Link href="/admin/dashboard" className="text-gray-400 hover:text-white">← Dashboard</Link>
          <h1 className="font-bold">Questions Manager</h1>
          <span className="text-gray-400 text-sm">{total.toLocaleString()} total</span>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Filters */}
        <div className="card mb-6 flex flex-wrap items-center gap-4">
          <select className="input flex-1 min-w-[160px]" value={filters.subject_id} onChange={e => setFilters({ ...filters, subject_id: e.target.value })}>
            <option value="">All Subjects</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select className="input flex-1 min-w-[140px]" value={filters.difficulty} onChange={e => setFilters({ ...filters, difficulty: e.target.value })}>
            <option value="">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          <button onClick={load} className="btn-secondary text-sm py-2">Filter</button>
          {selected.length > 0 && (
            <button onClick={handleBulkDelete} className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-xl text-sm">
              Delete {selected.length} selected
            </button>
          )}
        </div>

        {/* Questions Table */}
        {loading ? (
          <div className="text-center py-12"><div className="text-4xl animate-bounce">⏳</div></div>
        ) : (
          <div className="space-y-2">
            {questions.map(q => (
              <div key={q.id} className={`card p-4 flex items-start gap-4 ${selected.includes(q.id) ? 'ring-2 ring-blue-500' : ''}`}>
                <input type="checkbox" checked={selected.includes(q.id)} onChange={() => toggleSelect(q.id)} className="mt-1 w-4 h-4 accent-blue-600" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="badge bg-blue-100 text-blue-700 text-xs">{q.subjects?.name}</span>
                    <span className={`badge text-xs capitalize ${q.difficulty === 'easy' ? 'bg-green-100 text-green-700' : q.difficulty === 'hard' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{q.difficulty}</span>
                  </div>
                  <p className="text-gray-800 text-sm leading-relaxed line-clamp-2">{q.question}</p>
                  <p className="text-xs text-gray-400 mt-1">Correct: <strong>{q.correct_ans}</strong></p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => setEditing(q)} className="text-blue-600 hover:text-blue-700 text-sm font-medium">Edit</button>
                  <button onClick={() => handleDelete(q.id)} className="text-red-500 hover:text-red-600 text-sm font-medium">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between mt-6">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-sm py-2 disabled:opacity-30">← Prev</button>
          <span className="text-sm text-gray-500">Page {page} · {total} questions</span>
          <button onClick={() => setPage(p => p + 1)} disabled={questions.length < 50} className="btn-secondary text-sm py-2 disabled:opacity-30">Next →</button>
        </div>
      </div>

      {/* Edit Modal */}
      {editing && <EditModal q={editing} subjects={subjects} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
    </div>
  );
}

function EditModal({ q, subjects, onClose, onSaved }) {
  const [form, setForm] = useState(q);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await adminAPI.updateQuestion(q.id, form);
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Edit Question</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject</label>
            <select className="input" value={form.subject_id} onChange={e => setForm({ ...form, subject_id: e.target.value })}>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Question</label>
            <textarea className="input resize-none" rows={3} value={form.question} onChange={e => setForm({ ...form, question: e.target.value })} />
          </div>
          {['A', 'B', 'C', 'D'].map(opt => (
            <div key={opt}>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Option {opt}</label>
              <input type="text" className="input" value={form[`option_${opt.toLowerCase()}`] || ''} onChange={e => setForm({ ...form, [`option_${opt.toLowerCase()}`]: e.target.value })} />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Correct Answer</label>
            <select className="input" value={form.correct_ans} onChange={e => setForm({ ...form, correct_ans: e.target.value })}>
              {['A', 'B', 'C', 'D'].map(o => <option key={o} value={o}>Option {o}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Explanation</label>
            <textarea className="input resize-none" rows={2} value={form.explanation || ''} onChange={e => setForm({ ...form, explanation: e.target.value })} />
          </div>
          <div className="flex gap-3">
            <button onClick={save} disabled={saving} className="btn-primary flex-1">{saving ? 'Saving...' : 'Save Changes'}</button>
            <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}
