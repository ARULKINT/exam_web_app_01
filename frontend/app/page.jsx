'use client';
import Link from 'next/link';

const EXAM_CATEGORIES = [
  { name: 'UPSC', icon: '🏛️', color: 'bg-purple-100 text-purple-700', desc: 'Civil Services' },
  { name: 'SSC', icon: '📋', color: 'bg-blue-100 text-blue-700', desc: 'Staff Selection' },
  { name: 'Banking', icon: '🏦', color: 'bg-green-100 text-green-700', desc: 'IBPS, SBI, RBI' },
  { name: 'Railways', icon: '🚆', color: 'bg-red-100 text-red-700', desc: 'RRB NTPC, Group D' },
  { name: 'State PSC', icon: '🗺️', color: 'bg-orange-100 text-orange-700', desc: 'All State Exams' },
  { name: 'Defence', icon: '🛡️', color: 'bg-teal-100 text-teal-700', desc: 'NDA, CDS, AFCAT' },
];

const FEATURES = [
  { icon: '🤖', title: 'AI-Powered Questions', desc: 'Questions extracted from real books using Gemini AI' },
  { icon: '⏱️', title: 'Timed Mock Tests', desc: 'Simulate real exam conditions with countdown timer' },
  { icon: '📊', title: 'Smart Analytics', desc: 'Track your progress and identify weak areas' },
  { icon: '🔖', title: 'Bookmark System', desc: 'Save difficult questions and practice them later' },
  { icon: '🏆', title: 'Leaderboard', desc: 'Compete with thousands of students weekly' },
  { icon: '🔥', title: 'Daily Streaks', desc: 'Build a habit with daily practice challenges' },
];

const STATS = [
  { value: '1,00,000+', label: 'Questions' },
  { value: '50,000+', label: 'Students' },
  { value: '500+', label: 'Mock Tests' },
  { value: '6', label: 'Subjects' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎯</span>
            <span className="font-bold text-xl text-gray-900">GovExam <span className="text-blue-600">Pro</span></span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-gray-600 hover:text-gray-900 font-medium px-4 py-2">Login</Link>
            <Link href="/register" className="btn-primary text-sm py-2 px-5">Get Started Free</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white pt-20 pb-32">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur rounded-full px-4 py-2 text-sm font-medium mb-6">
            <span>🚀</span> India's #1 Free Government Exam Platform
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
            Crack Your Government Exam<br />
            <span className="text-yellow-300">With Smart Practice</span>
          </h1>
          <p className="text-lg sm:text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            AI-powered question bank from real books. Practice UPSC, SSC, Banking, Railways & more — completely free.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="bg-white text-blue-700 hover:bg-blue-50 font-bold py-4 px-8 rounded-xl text-lg transition-colors">
              Start Practicing Free →
            </Link>
            <Link href="/login" className="bg-white/10 hover:bg-white/20 border border-white/30 font-bold py-4 px-8 rounded-xl text-lg transition-colors">
              Login
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6">
            {STATS.map(stat => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-extrabold text-white">{stat.value}</div>
                <div className="text-blue-200 text-sm mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Exam Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">All Major Exams Covered</h2>
        <p className="text-center text-gray-500 mb-12">Practice questions for every government exam category</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {EXAM_CATEGORIES.map(cat => (
            <Link key={cat.name} href="/register" className={`${cat.color} rounded-2xl p-5 text-center hover:scale-105 transition-transform cursor-pointer`}>
              <div className="text-3xl mb-2">{cat.icon}</div>
              <div className="font-bold text-sm">{cat.name}</div>
              <div className="text-xs opacity-70 mt-1">{cat.desc}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">Everything You Need to Succeed</h2>
          <p className="text-center text-gray-500 mb-12">Powerful features designed for serious exam aspirants</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(f => (
              <div key={f.title} className="card hover:shadow-md transition-shadow">
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-600 text-white py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">Ready to Start Your Preparation?</h2>
          <p className="text-blue-100 text-lg mb-8">Join 50,000+ students already practicing on GovExam Pro</p>
          <Link href="/register" className="bg-white text-blue-700 hover:bg-blue-50 font-bold py-4 px-10 rounded-xl text-lg inline-block transition-colors">
            Create Free Account →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-10">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-xl">🎯</span>
            <span className="font-bold text-white">GovExam Pro</span>
          </div>
          <p className="text-sm">© 2026 GovExam Pro. Free government exam practice platform.</p>
        </div>
      </footer>
    </div>
  );
}
