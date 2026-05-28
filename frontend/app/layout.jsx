import './globals.css';

export const metadata = {
  title: 'GovExam Pro — Government Exam Practice Platform',
  description: 'Practice UPSC, SSC, Banking, Railways, State PSC exams with AI-powered question banks.',
  manifest: '/manifest.json',
  themeColor: '#2563eb',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body style={{ fontFamily: "'Inter', sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
