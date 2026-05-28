'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { adminAPI, questionsAPI } from '@/lib/api';

function ProcessingStatus({ logId, onDone }) {
  const [log, setLog] = useState(null);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const data = await adminAPI.uploadStatus(logId);
        setLog(data);
        if (data.status === 'completed' || data.status === 'failed') {
          clearInterval(interval);
          if (onDone) onDone(data);
        }
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, [logId, onDone]);

  if (!log) return <div className="text-gray-500 text-sm">Loading status...</div>;

  const progress = log.total_pages ? Math.round((log.processed_pages / log.total_pages) * 100) : 0;

  return (
    <div className="card mt-6">
      <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${log.status === 'processing' ? 'bg-blue-500 animate-pulse' : log.status === 'completed' ? 'bg-green-500' : log.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'}`} />
        Processing: {log.file_name}
      </h3>
      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Pages</span>
            <span>{log.processed_pages || 0} / {log.total_pages || '?'}</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <div className="flex gap-6 text-sm">
          <div>
            <div className="text-xl font-bold text-gray-900">{log.total_questions || 0}</div>
            <div className="text-gray-500">Questions found</div>
          </div>
          <div>
            <div className="text-xl font-bold text-gray-900 capitalize">{log.status}</div>
            <div className="text-gray-500">Status</div>
          </div>
        </div>
        {log.status === 'paused' && (
          <div className="bg-yellow-50 text-yellow-800 rounded-xl p-3 text-sm">
            ⏸ Daily API limit reached. Will auto-resume tomorrow at midnight.
          </div>
        )}
        {log.status === 'completed' && (
          <div className="bg-green-50 text-green-800 rounded-xl p-3 text-sm font-medium">
            ✅ Processing complete! {log.total_questions} questions added to database.
          </div>
        )}
        {log.status === 'failed' && (
          <div className="bg-red-50 text-red-800 rounded-xl p-3 text-sm">
            ❌ Processing failed. Please try again.
          </div>
        )}
      </div>
    </div>
  );
}

export default function UploadPage() {
  const [subjects, setSubjects] = useState([]);
  const [form, setForm] = useState({ subject_id: '', source_book: '', difficulty: 'medium' });
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [activeLogId, setActiveLogId] = useState(null);
  const [mode, setMode] = useState('pdf');
  const fileRef = useRef();

  useEffect(() => {
    questionsAPI.subjects().then(setSubjects);
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f?.type === 'application/pdf') setFile(f);
    else setError('Only PDF files are supported');
  };

  const handleUpload = async () => {
    if (!file || !form.subject_id) {
      return setError('Please select a file and subject');
    }
    setUploading(true);
    setError('');

    const fd = new FormData();
    fd.append('pdf', file);
    fd.append('subject_id', form.subject_id);
    fd.append('source_book', form.source_book || file.name);
    fd.append('difficulty', form.difficulty);

    try {
      const res = await adminAPI.uploadPDF(fd);
      setActiveLogId(res.log_id);
    } catch (err) {
      setError(err.error || 'Upload failed');
    }
    setUploading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-gray-900 text-white sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center gap-4">
          <Link href="/admin/dashboard" className="text-gray-400 hover:text-white">← Dashboard</Link>
          <h1 className="font-bold">Question Upload Center</h1>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Mode Tabs */}
        <div className="flex gap-2 mb-6">
          {['pdf', 'manual'].map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-5 py-2 rounded-xl font-medium text-sm transition-colors ${mode === m ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300'}`}
            >
              {m === 'pdf' ? '📄 PDF Upload' : '✏️ Manual Entry'}
            </button>
          ))}
        </div>

        {mode === 'pdf' && (
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Upload PDF Book</h2>

            {error && <div className="bg-red-50 text-red-700 rounded-xl p-4 mb-4 text-sm">{error}</div>}

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject *</label>
                <select
                  className="input"
                  value={form.subject_id}
                  onChange={e => setForm({ ...form, subject_id: e.target.value })}
                >
                  <option value="">Select Subject</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Book Name</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g., R.S. Aggarwal Quantitative Aptitude"
                  value={form.source_book}
                  onChange={e => setForm({ ...form, source_book: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Difficulty</label>
                <select className="input" value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })}>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>

            {/* Drop Zone */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-colors ${dragging ? 'border-blue-500 bg-blue-50' : file ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}`}
            >
              <input ref={fileRef} type="file" accept="application/pdf" className="hidden" onChange={e => setFile(e.target.files[0])} />
              {file ? (
                <>
                  <div className="text-5xl mb-3">📄</div>
                  <div className="font-semibold text-green-700">{file.name}</div>
                  <div className="text-sm text-green-600 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                  <button className="mt-3 text-xs text-gray-400 hover:text-red-500" onClick={e => { e.stopPropagation(); setFile(null); }}>Remove</button>
                </>
              ) : (
                <>
                  <div className="text-5xl mb-3">📤</div>
                  <div className="font-semibold text-gray-700">Drag & Drop PDF here</div>
                  <div className="text-sm text-gray-500 mt-1">or click to browse (max 50MB)</div>
                </>
              )}
            </div>

            <button
              onClick={handleUpload}
              disabled={uploading || !file || !form.subject_id}
              className="btn-primary w-full mt-6 flex items-center justify-center gap-2"
            >
              {uploading ? '⏳ Uploading...' : '🚀 Start Processing'}
            </button>

            <div className="mt-4 bg-blue-50 text-blue-700 rounded-xl p-4 text-sm">
              <strong>📊 Daily Limit:</strong> Gemini 2.0 Flash processes up to 1,500 pages/day.
              Large PDFs auto-pause and resume the next day until complete.
            </div>
          </div>
        )}

        {mode === 'manual' && <ManualEntryForm subjects={subjects} />}

        {activeLogId && <ProcessingStatus logId={activeLogId} />}
      </div>
    </div>
  );
}

function ManualEntryForm({ subjects }) {
  const [form, setForm] = useState({
    subject_id: '', question: '', option_a: '', option_b: '', option_c: '', option_d: '',
    correct_ans: '', explanation: '', difficulty: 'medium', source_book: '', page_no: '',
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    const required = ['subject_id', 'question', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_ans'];
    if (required.some(f => !form[f])) return setError('Please fill all required fields');
    setSaving(true);
    setError('');
    try {
      await adminAPI.createQuestion({ ...form, page_no: form.page_no ? Number(form.page_no) : null });
      setSuccess(true);
      setForm({ subject_id: form.subject_id, question: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_ans: '', explanation: '', difficulty: 'medium', source_book: '', page_no: '' });
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.error || 'Failed to save question');
    }
    setSaving(false);
  };

  return (
    <div className="card">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Add Question Manually</h2>
      {error && <div className="bg-red-50 text-red-700 rounded-xl p-4 mb-4 text-sm">{error}</div>}
      {success && <div className="bg-green-50 text-green-700 rounded-xl p-4 mb-4 text-sm">✅ Question saved!</div>}

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject *</label>
            <select className="input" value={form.subject_id} onChange={e => setForm({ ...form, subject_id: e.target.value })}>
              <option value="">Select</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Difficulty *</label>
            <select className="input" value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })}>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Question *</label>
          <textarea className="input resize-none" rows={3} value={form.question} onChange={e => setForm({ ...form, question: e.target.value })} placeholder="Enter the question..." />
        </div>
        {['A', 'B', 'C', 'D'].map(opt => (
          <div key={opt}>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Option {opt} *</label>
            <input type="text" className="input" value={form[`option_${opt.toLowerCase()}`]} onChange={e => setForm({ ...form, [`option_${opt.toLowerCase()}`]: e.target.value })} placeholder={`Option ${opt}`} />
          </div>
        ))}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Correct Answer *</label>
          <select className="input" value={form.correct_ans} onChange={e => setForm({ ...form, correct_ans: e.target.value })}>
            <option value="">Select correct option</option>
            {['A', 'B', 'C', 'D'].map(o => <option key={o} value={o}>Option {o}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Explanation</label>
          <textarea className="input resize-none" rows={2} value={form.explanation} onChange={e => setForm({ ...form, explanation: e.target.value })} placeholder="Brief explanation for the correct answer..." />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Source Book</label>
            <input type="text" className="input" value={form.source_book} onChange={e => setForm({ ...form, source_book: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Page No.</label>
            <input type="number" className="input" value={form.page_no} onChange={e => setForm({ ...form, page_no: e.target.value })} />
          </div>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary w-full">
          {saving ? 'Saving...' : '💾 Save Question'}
        </button>
      </div>
    </div>
  );
}
