import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import { ThemeProvider } from '../context/ThemeContext';

export const metadata: Metadata = {
  title: 'DocIntel AI | Enterprise Document Intelligence & Workflow Platform',
  description:
    'Production-ready AI Document Intelligence platform: ingest PDFs, DOCX, and spreadsheets, extract structured entities, execute automated review workflows, and search document knowledge with AI.',
  keywords: [
    'Document Intelligence',
    'AI Extraction',
    'OCR',
    'Workflow Automation',
    'Enterprise SaaS',
  ],
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

// themeColor must be in viewport export (Next.js 14+)
export const viewport: Viewport = {
  themeColor: '#7e22ce',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="shortcut icon" href="/favicon.svg" />
        <meta name="theme-color" content="#7e22ce" />
      </head>
      <body className="min-h-screen bg-white dark:bg-[#0c0817] text-slate-900 dark:text-slate-100 flex flex-col">
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
