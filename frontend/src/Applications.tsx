import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  url: string;
  source_site: string;
  salary?: string;
  status: string;
}

const statusSteps = [
  { value: 'bookmarked', label: 'Saved', color: 'slate' },
  { value: 'applied', label: 'Applied', color: 'blue' },
  { value: 'interviewed', label: 'Interviewing', color: 'indigo' },
  { value: 'success', label: 'Offer', color: 'emerald' },
  { value: 'rejected', label: 'Rejected', color: 'rose' }
];

const Applications: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchBookmarkedJobs = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/jobs');
      const saved = response.data.filter((job: Job) => job.status);
      setJobs(saved);
    } catch (error) {
      console.error('Error fetching jobs', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookmarkedJobs();
  }, []);

  const handleStatusChange = async (jobId: number, newStatus: string) => {
    try {
      await axios.put(`http://localhost:8000/api/jobs/${jobId}/status`, { status: newStatus });
      setJobs(jobs.map(j => j.id === jobId ? { ...j, status: newStatus } : j));
    } catch (error) {
      console.error('Error updating status', error);
    }
  };

  const removeBookmark = async (jobId: number) => {
    if (!window.confirm("Are you sure you want to remove this job from your pipeline?")) return;
    try {
      await axios.put(`http://localhost:8000/api/jobs/${jobId}/status`, { status: null });
      setJobs(jobs.filter(j => j.id !== jobId));
    } catch (error) {
      console.error('Error removing bookmark', error);
    }
  };

  const filteredJobs = filter === 'all' ? jobs : jobs.filter(j => j.status === filter);

  const getStatusIndex = (status: string) => {
    if (status === 'no_reply') return 1;
    const idx = statusSteps.findIndex(s => s.value === status);
    return idx >= 0 ? idx : 0;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <svg className="animate-spin h-8 w-8 text-indigo-500" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-8">
      {/* Header */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Application Pipeline</h2>
          <p className="text-slate-500 mt-2 font-medium">Track your saved jobs and hiring progress in one place.</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filter === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>All ({jobs.length})</button>
          <button onClick={() => setFilter('bookmarked')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filter === 'bookmarked' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Saved</button>
          <button onClick={() => setFilter('applied')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filter === 'applied' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Applied</button>
          <button onClick={() => setFilter('interviewed')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filter === 'interviewed' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Interviewing</button>
        </div>
      </div>

      {/* Grid */}
      {filteredJobs.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-slate-100">
          <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
          </div>
          <p className="text-slate-800 text-lg font-bold mb-2">No applications found</p>
          <p className="text-slate-500">Go to your Dashboard to save jobs you're interested in.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredJobs.map(job => {
            const currentIdx = getStatusIndex(job.status);
            const isRejected = job.status === 'rejected';
            
            return (
              <div key={job.id} className={`bg-white rounded-2xl shadow-sm border p-6 flex flex-col gap-6 transition-all hover:shadow-md ${isRejected ? 'border-rose-100 bg-rose-50/30' : 'border-slate-100'}`}>
                {/* Job Header */}
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-800 leading-tight mb-1">{job.title}</h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm font-medium mt-2">
                      <span className="text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded-md">{job.company}</span>
                      <span className="text-slate-500">{job.location}</span>
                      {job.salary && <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">{job.salary}</span>}
                    </div>
                  </div>
                  <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-1 rounded font-bold uppercase tracking-widest shrink-0">
                    {job.source_site}
                  </span>
                </div>

                {/* Visual Timeline */}
                <div className="pt-2">
                  <div className="flex items-center justify-between relative">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 rounded-full z-0"></div>
                    <div className={`absolute left-0 top-1/2 -translate-y-1/2 h-1 rounded-full z-0 transition-all duration-500 ${isRejected ? 'bg-rose-500' : 'bg-indigo-500'}`} style={{ width: `${(currentIdx / (statusSteps.length - 1)) * 100}%` }}></div>
                    
                    {statusSteps.map((step, idx) => {
                      const isPast = idx < currentIdx;
                      const isCurrent = idx === currentIdx;
                      let circleClass = 'bg-white border-slate-200 text-transparent';
                      let textClass = 'text-slate-400 font-medium';
                      
                      if (isPast) {
                        circleClass = isRejected ? 'bg-rose-500 border-rose-500 text-white' : 'bg-indigo-500 border-indigo-500 text-white';
                        textClass = 'text-slate-600 font-bold';
                      } else if (isCurrent) {
                        circleClass = isRejected ? 'bg-rose-500 border-rose-500 text-white ring-4 ring-rose-100' : 'bg-indigo-600 border-indigo-600 text-white ring-4 ring-indigo-100';
                        textClass = isRejected ? 'text-rose-600 font-extrabold' : 'text-indigo-700 font-extrabold';
                      }

                      return (
                        <div key={step.value} className="relative z-10 flex flex-col items-center gap-2 group cursor-pointer" onClick={() => handleStatusChange(job.id, step.value)}>
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${circleClass}`}>
                            {isPast || isCurrent ? <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg> : null}
                          </div>
                          <span className={`text-[10px] uppercase tracking-wider absolute top-8 text-center w-20 -ml-7 ${textClass}`}>{step.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-100">
                  <select 
                    className="bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                    value={job.status}
                    onChange={(e) => handleStatusChange(job.id, e.target.value)}
                  >
                    {statusSteps.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  
                  <div className="flex items-center gap-2">
                    <button onClick={() => removeBookmark(job.id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors" title="Remove">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                    <a href={job.url} target="_blank" rel="noreferrer" className="text-sm font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-600 hover:text-white px-4 py-2 rounded-lg transition-colors shadow-sm">
                      View Posting
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Applications;
