import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';

import Dashboard from './Dashboard';
import Integrations from './Integrations';
import Information from './Information';
import ResumeParser from './ResumeParser';
import Applications from './Applications';

const NavLink = ({ to, children }: { to: string, children: React.ReactNode }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link 
      to={to} 
      className={`px-4 py-2 rounded-full font-medium transition-all duration-300 ${isActive ? 'bg-white text-indigo-700 shadow-sm' : 'text-indigo-100 hover:bg-white/10 hover:text-white'}`}
    >
      {children}
    </Link>
  );
};

function AppContent() {
  return (
    <div className="App font-sans bg-slate-50 min-h-screen selection:bg-indigo-200 selection:text-indigo-900 flex flex-col">
      <header className="sticky top-0 z-40 bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-600 shadow-lg text-white">
        <div className="container mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-center max-w-7xl gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-white p-1.5 rounded-lg shadow-sm">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-indigo-100">
              JobAggregator
            </h1>
          </div>
          <nav>
            <ul className="flex flex-wrap justify-center gap-1">
              <li><NavLink to="/">Dashboard</NavLink></li>
              <li><NavLink to="/applications">Applications</NavLink></li>
              <li><NavLink to="/resume">Resume</NavLink></li>
              <li><NavLink to="/information">Identity</NavLink></li>
              <li><NavLink to="/integrations">Integrations</NavLink></li>
            </ul>
          </nav>
        </div>
      </header>
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/integrations" element={<Integrations />} />
          <Route path="/information" element={<Information />} />
          <Route path="/applications" element={<Applications />} />
          <Route path="/resume" element={<ResumeParser />} />
        </Routes>
      </main>
      
      <footer className="bg-white border-t border-slate-100 py-8 mt-auto">
        <div className="container mx-auto px-4 flex flex-col items-center justify-center text-center gap-2">
          <div className="text-slate-500 text-sm font-medium">
            &copy; {new Date().getFullYear()} JobAggregator AI. All rights reserved.
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
            <span>Built with 💻 by</span>
            <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">Christopher Guzman Canapi Jr</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
