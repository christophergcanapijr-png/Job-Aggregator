import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  source_site: string;
  salary?: string;
  posted_date?: string;
  job_type?: string;
  skills?: string;
  status?: string;
}

interface ProfileData {
  name?: string;
  profile_pic?: string;
  sections?: Record<string, string>;
  error?: string;
}

const Dashboard: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [keyword, setKeyword] = useState('');
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [scrapeTargets, setScrapeTargets] = useState({ OnlineJobsPH: true, JobStreet: false });
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  
  // Smart Filters
  const [filterCompany, setFilterCompany] = useState('');
  const [filterSalary, setFilterSalary] = useState('');
  const [filterRemote, setFilterRemote] = useState('all');
  const [filterDate, setFilterDate] = useState('any');
  const [filterMatchScore, setFilterMatchScore] = useState(0);
  const [sortBy, setSortBy] = useState("latest");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [aiSource, setAiSource] = useState<'profile' | 'resume' | 'both'>('both');

  const fetchJobs = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/jobs');
      setJobs(response.data);
    } catch (error) {
      console.error('Error fetching jobs', error);
    }
  };

  const fetchProfile = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/profile/onlinejobsph?refresh=false', { timeout: 10000 });
      setProfile(response.data);
    } catch (error) {
      console.error('Error fetching profile', error);
      setProfile({ error: 'Not connected' });
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    fetchProfile();
  }, []);

  const handleScrape = async () => {
    if (!keyword) return;
    setLoadingJobs(true);
    try {
      const platforms = Object.entries(scrapeTargets).filter(([_, checked]) => checked).map(([name]) => name);
      if (platforms.length === 0) {
        alert("Please select at least one platform to scrape.");
        setLoadingJobs(false);
        return;
      }
      
      await axios.post('http://localhost:8000/api/scrape', { keyword, platforms });
      await fetchJobs();
      setKeyword('');
    } catch (error) {
      console.error('Error scraping jobs', error);
      alert('Failed to scrape jobs. Ensure you connected the requested accounts in Integrations.');
    } finally {
      setLoadingJobs(false);
    }
  };

  const handleScrapeLatest = async () => {
    setLoadingJobs(true);
    try {
      const platforms = Object.entries(scrapeTargets).filter(([_, checked]) => checked).map(([name]) => name);
      if (platforms.length === 0) {
        alert("Please select at least one platform to scrape.");
        setLoadingJobs(false);
        return;
      }
      await axios.post('http://localhost:8000/api/scrape', { keyword: "", platforms });
      await fetchJobs();
    } catch (error) {
      console.error('Error pulling latest jobs', error);
    } finally {
      setLoadingJobs(false);
    }
  };

  const handleBookmark = async (jobId: number) => {
    try {
      await axios.put(`http://localhost:8000/api/jobs/${jobId}/status`, { status: 'bookmarked' });
      setJobs(jobs.map(j => j.id === jobId ? { ...j, status: 'bookmarked' } : j));
    } catch (error) {
      console.error('Error bookmarking job', error);
      alert('Failed to bookmark job.');
    }
  };

  const handleClearFeed = async () => {
    if (!window.confirm("Are you sure you want to clear your job feed? Your Bookmarked jobs will be kept safe.")) return;
    setLoadingJobs(true);
    try {
      await axios.delete('http://localhost:8000/api/jobs');
      await fetchJobs();
    } catch (error) {
      console.error('Error clearing jobs', error);
      alert('Failed to clear job feed.');
    } finally {
      setLoadingJobs(false);
    }
  };

  const handleUnbookmark = async (jobId: number) => {
    try {
      await axios.put(`http://localhost:8000/api/jobs/${jobId}/status`, { status: null });
      setJobs(jobs.map(j => j.id === jobId ? { ...j, status: undefined } : j));
      if (selectedJob && selectedJob.id === jobId) {
        setSelectedJob({ ...selectedJob, status: undefined });
      }
    } catch (error) {
      console.error('Error removing bookmark', error);
      alert('Failed to remove bookmark.');
    }
  };

  const [extractingJobId, setExtractingJobId] = useState<number | null>(null);

  const [coverLetter, setCoverLetter] = useState<string | null>(null);
  const [isGeneratingCoverLetter, setIsGeneratingCoverLetter] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState(localStorage.getItem('geminiApiKey') || '');


  const handleExtractDescription = async (jobId: number) => {
    setExtractingJobId(jobId);
    try {
      const response = await axios.post(`http://localhost:8000/api/jobs/${jobId}/extract`);
      const updatedJob = response.data;
      setJobs(jobs.map(j => j.id === jobId ? updatedJob : j));
      if (selectedJob && selectedJob.id === jobId) {
        setSelectedJob(updatedJob);
      }
    } catch (error) {
      console.error('Error extracting description', error);
      alert('Failed to extract full description.');
    } finally {
      setExtractingJobId(null);
    }
  };

  
  const handleGenerateCoverLetter = async (job: Job) => {
    setIsGeneratingCoverLetter(true);
    setCoverLetter(null);
    try {
      const savedResume = localStorage.getItem('parsedResume');
      let rData = savedResume ? (JSON.parse(savedResume).parsed_data || {}) : {};
      let pData = profile?.sections || {};
      
      let resumeData: Record<string, any> = {};
      if (aiSource === 'resume') {
        resumeData = rData;
      } else if (aiSource === 'profile') {
        resumeData = pData;
      } else {
        resumeData = { ...pData, ...rData };
      }

      if (Object.keys(resumeData).length === 0) {
        alert("Please upload a resume or connect your profile first!");
        setIsGeneratingCoverLetter(false);
        return;
      }

      const response = await fetch('http://localhost:8000/api/generate-cover-letter-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_title: job.title,
          job_company: job.company,
          job_description: job.description || "No description provided",
          resume_data: resumeData,
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to generate cover letter");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader");
      
      const decoder = new TextDecoder("utf-8");
      let currentLetter = "";
      setCoverLetter("");
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        currentLetter += chunk;
        setCoverLetter(currentLetter);
      }
    } catch (error: any) {
      console.error('Error generating cover letter:', error);
      alert(error.response?.data?.detail || "Failed to generate cover letter. Check your API key.");
      if (error.response?.status === 400 || error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('geminiApiKey');
        setGeminiApiKey('');
      }
    } finally {
      setIsGeneratingCoverLetter(false);
    }
  };

  const getBasicInfo = () => {
    if (!profile?.sections?.["Contact & Header"] && !profile?.sections?.["Basic Information"]) return null;
    return profile.sections["Basic Information"] || profile.sections["Contact & Header"] || "";
  };

  const getUserSkills = () => {
    const skills: string[] = [];
    
    const extractProfileSkills = (sectionText: string) => {
      sectionText.split('\n')
        .filter(line => line.startsWith('🔹'))
        .forEach(line => {
          const skill = line.replace('🔹', '').split('»').pop()?.trim().toLowerCase();
          if (skill && skill.length > 2) skills.push(skill);
        });
    };

    if (aiSource === 'profile' || aiSource === 'both') {
      if (profile?.sections) {
        if (profile.sections["Top Skills"]) extractProfileSkills(profile.sections["Top Skills"]);
        if (profile.sections["Other Skills"]) extractProfileSkills(profile.sections["Other Skills"]);
      }
    }
    
    if (aiSource === 'resume' || aiSource === 'both') {
      try {
        const savedResume = localStorage.getItem('parsedResume');
      if (savedResume) {
        const resumeData = JSON.parse(savedResume).parsed_data;
        const resumeSkillsSection = resumeData["SKILLS"] || resumeData["TECHNICAL SKILLS"] || [];
        resumeSkillsSection.forEach((line: string) => {
          line.split(',').forEach(s => {
            const skill = s.trim().toLowerCase();
            const cleanSkill = skill.replace(/^[-\•\*\»]\s*/, '');
            if (cleanSkill && cleanSkill.length > 2) skills.push(cleanSkill);
          });
        });
      }
    } catch (e) {}
    }
    
    return skills;
  };

  const getMatchScore = (job: Job, userSkills: string[]) => {
    if (userSkills.length === 0) return 0;
    const textToSearch = (job.title + " " + job.description + " " + (job.skills || "")).toLowerCase();
    let matchCount = 0;
    for (const skill of userSkills) {
      if (textToSearch.includes(skill)) {
        matchCount++;
      }
    }
    return matchCount;
  };

  const calculateMatch = (job: Job, userSkills: string[]) => {
    return getMatchScore(job, userSkills) >= 2;
  };

  const parseDaysAgo = (dateStr?: string) => {
    if (!dateStr) return 0;
    const parsedDate = new Date(dateStr);
    if (!isNaN(parsedDate.getTime())) {
      const diffTime = new Date().getTime() - parsedDate.getTime();
      return Math.floor(diffTime / (1000 * 60 * 60 * 24));
    }
    const lower = dateStr.toLowerCase();
    if (lower.includes('h ago') || lower.includes('hour') || lower.includes('min') || lower.includes('today')) return 0;
    if (lower.includes('yesterday')) return 1;
    if (lower.includes('d ago') || lower.includes('day')) {
      const match = lower.match(/(\d+)/);
      if (match) return parseInt(match[1]);
    }
    if (lower.includes('w ago') || lower.includes('week')) {
      const match = lower.match(/(\d+)/);
      if (match) return parseInt(match[1]) * 7;
    }
    if (lower.includes('mo ago') || lower.includes('month')) {
      const match = lower.match(/(\d+)/);
      if (match) return parseInt(match[1]) * 30;
    }
    return 0;
  };

  const activeSkills = getUserSkills();

  let filteredJobs = jobs.filter(job => {
    if (job.source_site === 'OnlineJobsPH' && !scrapeTargets.OnlineJobsPH) return false;
    if (job.source_site === 'JobStreet' && !scrapeTargets.JobStreet) return false;
    if (filterCompany && !job.company.toLowerCase().includes(filterCompany.toLowerCase())) return false;
    if (filterSalary && !(job.salary || "").toLowerCase().includes(filterSalary.toLowerCase())) return false;
    if (filterRemote !== 'all') {
      const locText = (job.location + " " + job.title).toLowerCase();
      const isRemote = locText.includes('remote') || locText.includes('wfh') || locText.includes('work from home') || locText.includes('anywhere');
      if (filterRemote === 'remote' && !isRemote) return false;
      if (filterRemote === 'onsite' && isRemote) return false;
    }
    if (filterDate !== 'any') {
      const days = parseDaysAgo(job.posted_date);
      if (filterDate === '24h' && days > 1) return false;
      if (filterDate === '7d' && days > 7) return false;
      if (filterDate === '30d' && days > 30) return false;
    }
    if (filterMatchScore > 0) {
      const score = getMatchScore(job, activeSkills);
      if (score < filterMatchScore) return false;
    }
    return true;
  });

  const sortedJobs = [...filteredJobs].sort((a, b) => {
    const aMatch = calculateMatch(a, activeSkills);
    const bMatch = calculateMatch(b, activeSkills);
    const dateA = parseDaysAgo(a.posted_date);
    const dateB = parseDaysAgo(b.posted_date);
    
    if (sortBy === 'match') {
      if (aMatch && !bMatch) return -1;
      if (!aMatch && bMatch) return 1;
      return dateA - dateB;
    } else {
      if (dateA !== dateB) return dateA - dateB;
      if (aMatch && !bMatch) return -1;
      if (!aMatch && bMatch) return 1;
      return 0;
    }
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [filterCompany, filterSalary, filterRemote, filterDate, filterMatchScore, sortBy, keyword, scrapeTargets]);

  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.ceil(sortedJobs.length / ITEMS_PER_PAGE);
  const paginatedJobs = sortedJobs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto">
      {/* LEFT COLUMN: Job Board */}
      <div className="lg:w-2/3 flex flex-col gap-6">
        
        {/* Scraper Card */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Job Search Engine</h2>
              <p className="text-slate-500 text-sm mt-1">Discover opportunities across multiple platforms instantly.</p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button 
                onClick={handleClearFeed}
                disabled={loadingJobs || jobs.length === 0}
                className="flex-1 sm:flex-none justify-center bg-white text-rose-600 border border-rose-200 px-4 py-2 rounded-xl hover:bg-rose-50 hover:border-rose-300 disabled:opacity-50 font-bold text-sm transition-all shadow-sm flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                Clear
              </button>
              <button 
                onClick={handleScrapeLatest}
                disabled={loadingJobs}
                className="flex-1 sm:flex-none justify-center bg-indigo-50 text-indigo-700 border border-indigo-100 px-4 py-2 rounded-xl hover:bg-indigo-100 disabled:opacity-50 font-bold text-sm transition-all shadow-sm flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                {loadingJobs ? 'Pulling...' : 'Latest'}
              </button>
            </div>
          </div>
          
          <div className="flex flex-col gap-4">
            <div className="relative flex group shadow-sm rounded-xl overflow-hidden ring-1 ring-slate-200 focus-within:ring-2 focus-within:ring-indigo-500 transition-shadow">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input 
                type="text" 
                className="w-full pl-11 pr-4 py-4 text-slate-700 bg-slate-50/50 focus:bg-white outline-none font-medium placeholder-slate-400 transition-colors"
                placeholder="Search by job title, skill, or keyword (e.g. React, Python)"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleScrape()}
              />
              <button 
                onClick={handleScrape}
                disabled={loadingJobs || !keyword}
                className="bg-indigo-600 text-white px-8 font-bold tracking-wide hover:bg-indigo-700 disabled:bg-slate-300 transition-colors"
              >
                {loadingJobs ? 'Searching...' : 'Search'}
              </button>
            </div>
            
            <div className="flex flex-wrap gap-4 px-1 items-center">
              <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Sources:</span>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer hover:text-indigo-600 transition-colors">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" 
                  checked={scrapeTargets.OnlineJobsPH}
                  onChange={(e) => setScrapeTargets({ ...scrapeTargets, OnlineJobsPH: e.target.checked })}
                />
                OnlineJobs.ph
              </label>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer hover:text-indigo-600 transition-colors">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" 
                  checked={scrapeTargets.JobStreet}
                  onChange={(e) => setScrapeTargets({ ...scrapeTargets, JobStreet: e.target.checked })}
                />
                JobStreet
              </label>
            </div>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-3 transition-all">
          <button 
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className="w-full flex justify-between items-center px-3 py-1 text-left focus:outline-none group"
          >
            <div className="flex items-center gap-3">
              <div className={`p-1.5 rounded-lg bg-indigo-50 text-indigo-600 transition-transform ${isFiltersOpen ? 'rotate-180' : ''}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
              </div>
              <h3 className="font-bold text-slate-700 text-sm">Smart Filters</h3>
            </div>
            <span className="text-indigo-700 font-bold text-xs uppercase tracking-wider bg-indigo-50 px-3 py-1.5 rounded-full ring-1 ring-indigo-100/50">
              {sortedJobs.length} results
            </span>
          </button>
          
          {isFiltersOpen && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 px-2 pb-2 mt-1 animate-in slide-in-from-top-2 duration-200">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Company" 
                  className="w-full border-0 bg-slate-100 text-sm font-medium rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
                  value={filterCompany}
                  onChange={(e) => setFilterCompany(e.target.value)}
                />
              </div>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Salary Keyword" 
                  className="w-full border-0 bg-slate-100 text-sm font-medium rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
                  value={filterSalary}
                  onChange={(e) => setFilterSalary(e.target.value)}
                />
              </div>
              <select 
                className="w-full border-0 bg-slate-100 text-sm font-medium text-slate-700 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer"
                value={filterRemote}
                onChange={(e) => setFilterRemote(e.target.value)}
              >
                <option value="all">Any Location</option>
                <option value="remote">Remote Only</option>
                <option value="onsite">On-Site / Hybrid</option>
              </select>
              <select 
                className="w-full border-0 bg-slate-100 text-sm font-medium text-slate-700 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              >
                <option value="any">Any Time</option>
                <option value="24h">Past 24 Hours</option>
                <option value="7d">Past 7 Days</option>
                <option value="30d">Past 30 Days</option>
              </select>
              <select 
                className="w-full border-0 bg-slate-100 text-sm font-medium text-slate-700 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer"
                value={filterMatchScore}
                onChange={(e) => setFilterMatchScore(Number(e.target.value))}
              >
                <option value={0}>All Matches</option>
                <option value={1}>1+ Skills</option>
                <option value={2}>Strong (2+)</option>
                <option value={3}>Great (3+)</option>
                <option value={4}>Perfect (4+)</option>
              </select>
            </div>
          )}
        </div>

        {/* Job Feed */}
        <div className="space-y-4 pb-12">
          {sortedJobs.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center">
              <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <h3 className="text-lg font-bold text-slate-800">No jobs found</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-sm">Try adjusting your filters or search for a new keyword to discover opportunities.</p>
            </div>
          ) : (
            paginatedJobs.map((job) => {
              const isMatch = calculateMatch(job, activeSkills);
              return (
                <div key={job.id} className={`group bg-white p-6 rounded-2xl border transition-all duration-200 hover:shadow-md hover:border-indigo-200 relative overflow-hidden ${isMatch ? 'border-emerald-200 shadow-sm' : 'border-slate-100'}`}>
                  {isMatch && (
                    <div className="absolute top-0 right-0">
                      <div className="bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider py-1 px-4 rounded-bl-xl shadow-sm flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        Strong Match
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-start mb-4">
                    <div className="pr-16">
                      <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-700 transition-colors mb-1 leading-tight">
                        <button onClick={() => { setSelectedJob(job); setCoverLetter(null); }} className="text-left focus:outline-none">
                          {job.title}
                        </button>
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm font-medium">
                        <span className="text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded-md">{job.company}</span>
                        <span className="text-slate-500 flex items-center gap-1">
                          <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                          {job.location}
                        </span>
                        {job.salary && (
                          <span className="text-emerald-700 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md">
                            <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            {job.salary}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-slate-600 text-sm line-clamp-3 leading-relaxed mb-5">{job.description}</p>
                  
                  <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="bg-slate-100 text-slate-600 text-xs px-2.5 py-1 rounded-md font-semibold tracking-wide">
                        {job.source_site}
                      </span>
                      {job.posted_date && <span className="text-xs text-slate-400 flex items-center gap-1"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>{job.posted_date}</span>}
                    </div>
                    
                    <div>
                      {job.status ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg ring-1 ring-emerald-200">
                            Saved
                          </span>
                          <button onClick={() => handleUnbookmark(job.id)} className="text-xs font-bold text-slate-400 hover:text-rose-500 transition-colors px-2 py-1">
                            Undo
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => handleBookmark(job.id)} className="text-sm font-bold text-indigo-600 hover:text-white hover:bg-indigo-600 px-4 py-1.5 rounded-lg ring-1 ring-indigo-200 transition-all bg-indigo-50/50 shadow-sm">
                          Save Job
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-8 px-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl disabled:opacity-50 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg> Previous
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = currentPage;
                  if (currentPage < 3) pageNum = i + 1;
                  else if (currentPage > totalPages - 2) pageNum = totalPages - 4 + i;
                  else pageNum = currentPage - 2 + i;
                  
                  if (pageNum < 1 || pageNum > totalPages) return null;
                  
                  return (
                    <button key={pageNum} onClick={() => setCurrentPage(pageNum)} className={`w-10 h-10 rounded-xl font-bold text-sm transition-all ${currentPage === pageNum ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}>
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl disabled:opacity-50 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm flex items-center gap-2">
                Next <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Profile Sidebar */}
      <div className="lg:w-1/3 flex flex-col gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 sticky top-24">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Your Identity</h2>
            <Link to="/information" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors">Manage</Link>
          </div>

          {loadingProfile ? (
            <div className="animate-pulse flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-slate-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                </div>
              </div>
              <div className="h-20 bg-slate-200 rounded-xl mt-2"></div>
            </div>
          ) : profile?.error || !profile?.name ? (
            <div className="text-center py-8 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm mb-3">
                <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </div>
              <p className="text-sm text-slate-600 mb-4 font-medium">Connect an account to enable AI-powered job matching.</p>
              <Link to="/integrations" className="inline-block bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-sm hover:shadow">
                Connect Account
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-4 bg-gradient-to-r from-slate-50 to-white p-4 rounded-xl border border-slate-100">
                {profile.profile_pic ? (
                  <img src={profile.profile_pic} alt="Profile" className="w-16 h-16 rounded-full object-cover shadow-sm ring-2 ring-white" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl shadow-sm ring-2 ring-white">
                    {profile.name?.charAt(0)}
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-lg text-slate-900 leading-tight">{profile.name}</h3>
                  <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 mt-1.5 bg-emerald-50 w-max px-2 py-0.5 rounded uppercase tracking-wider">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    Verified
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                  AI Match Source
                </label>
                <div className="flex rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                  <button onClick={() => setAiSource('profile')} className={`flex-1 py-1.5 text-xs font-bold transition-all ${aiSource === 'profile' ? 'bg-indigo-600 text-white shadow-inner' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>OJ.ph</button>
                  <button onClick={() => setAiSource('resume')} className={`flex-1 py-1.5 text-xs font-bold border-l border-r border-slate-200 transition-all ${aiSource === 'resume' ? 'bg-indigo-600 text-white border-indigo-600 shadow-inner' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>Resume</button>
                  <button onClick={() => setAiSource('both')} className={`flex-1 py-1.5 text-xs font-bold transition-all ${aiSource === 'both' ? 'bg-indigo-600 text-white shadow-inner' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>Both</button>
                </div>
              </div>


              {activeSkills.length > 0 && (
                <div className="mt-2">
                  <h4 className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-widest flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    Matching Skills ({activeSkills.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {activeSkills.slice(0, 12).map((skill, i) => (
                      <span key={i} className="bg-white border border-slate-200 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-semibold shadow-sm">
                        {skill}
                      </span>
                    ))}
                    {activeSkills.length > 12 && (
                      <span className="bg-slate-50 border border-slate-200 text-slate-500 px-2.5 py-1 rounded-lg text-xs font-bold">
                        +{activeSkills.length - 12} more
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              <div className="mt-4 pt-5 border-t border-slate-100 flex flex-col gap-3">
                 {(() => {
                  let resumeFile = null;
                  let latestRole = null;
                  try {
                    const saved = localStorage.getItem('parsedResume');
                    if (saved) {
                      const data = JSON.parse(saved);
                      resumeFile = data.filename || "Resume Attached";
                      
                      const experience = data.parsed_data?.EXPERIENCE || data.parsed_data?.["WORK EXPERIENCE"] || data.parsed_data?.["EXPERIENCE & PROJECTS"];
                      if (experience && Array.isArray(experience) && experience.length > 0) {
                        const firstLine = experience[0].split('\n')[0].replace(/[^a-zA-Z0-9 ]/g, "").trim();
                        if (firstLine.length > 3) latestRole = firstLine.substring(0, 35) + (firstLine.length > 35 ? "..." : "");
                      }
                    }
                  } catch(e) {}

                  if (resumeFile) {
                    return (
                      <Link to="/resume" className="group flex items-center justify-between p-4 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors border border-emerald-100 shadow-sm">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="bg-white p-2 rounded-lg shadow-sm text-emerald-600 shrink-0">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                          </div>
                          <div className="text-left min-w-0">
                            <p className="text-sm font-bold text-emerald-900 truncate">{resumeFile}</p>
                            <p className="text-xs text-emerald-600 mt-0.5 font-medium truncate">{latestRole || "Active for AI matching"}</p>
                          </div>
                        </div>
                        <svg className="w-4 h-4 text-emerald-400 group-hover:text-emerald-600 transition-colors shrink-0 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </Link>
                    );
                  }

                  return (
                    <Link to="/resume" className="group flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-indigo-50 transition-colors border border-transparent hover:border-indigo-100">
                      <div className="flex items-center gap-3">
                        <div className="bg-white p-2 rounded-lg shadow-sm group-hover:text-indigo-600 transition-colors text-slate-400 shrink-0">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-bold text-slate-800 group-hover:text-indigo-900 transition-colors">Upload Resume</p>
                          <p className="text-xs text-slate-500 mt-0.5">Improve matching algorithm</p>
                        </div>
                      </div>
                      <svg className="w-5 h-5 text-slate-300 group-hover:text-indigo-400 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </Link>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL OVERLAY */}
      {selectedJob && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 sm:p-8 border-b border-slate-100 flex justify-between items-start">
              <div className="flex flex-col gap-3 pr-8">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="bg-indigo-50 text-indigo-700 text-xs px-2.5 py-1 rounded-md font-bold uppercase tracking-wider">
                    {selectedJob.source_site}
                  </span>
                  {selectedJob.posted_date && <span className="text-sm font-medium text-slate-400 flex items-center gap-1"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>{selectedJob.posted_date}</span>}
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">{selectedJob.title}</h2>
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-slate-600 mt-1">
                  <span className="flex items-center gap-1.5 text-slate-800"><svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>{selectedJob.company}</span>
                  <span className="flex items-center gap-1.5"><svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>{selectedJob.location}</span>
                  {selectedJob.salary && <span className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2 rounded-md"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>{selectedJob.salary}</span>}
                </div>
              </div>
              <button 
                onClick={() => { setSelectedJob(null); setCoverLetter(null); }}
                className="absolute top-6 right-6 text-slate-400 hover:text-slate-800 p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 sm:p-8 overflow-y-auto flex-1">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-extrabold text-slate-800">About the Role</h3>
                <button 
                  onClick={() => handleExtractDescription(selectedJob.id)}
                  disabled={extractingJobId === selectedJob.id}
                  className="text-xs font-bold text-indigo-600 bg-white px-4 py-2 rounded-xl border border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300 transition-all disabled:opacity-50 flex items-center gap-2 shadow-sm"
                >
                  {extractingJobId === selectedJob.id ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Extracting full description...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                      Get Full Description
                    </>
                  )}
                </button>
              </div>
              <div className="prose max-w-none text-slate-700 whitespace-pre-wrap leading-relaxed font-medium">
                {selectedJob.description}
              </div>
              {/* Cover Letter Section */}
              <div className="mt-10 pt-6 border-t border-slate-100">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    AI Cover Letter Generator
                  </h3>
                  <button 
                    onClick={() => handleGenerateCoverLetter(selectedJob)}
                    disabled={isGeneratingCoverLetter}
                    className="text-sm font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2 rounded-xl shadow-sm hover:shadow-md transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {isGeneratingCoverLetter ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Generating...
                      </>
                    ) : "Generate with Gemini ✨"}
                  </button>
                </div>
                
                {coverLetter && (
                  <div className="mt-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 p-6 relative group animate-in slide-in-from-bottom-4 duration-300">
                    <button 
                      onClick={() => { navigator.clipboard.writeText(coverLetter); alert("Copied to clipboard!"); }}
                      className="absolute top-4 right-4 bg-white text-indigo-600 border border-indigo-200 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Copy
                    </button>
                    <textarea 
                      className="w-full h-64 bg-transparent border-0 focus:ring-0 text-slate-700 text-sm leading-relaxed resize-y font-medium"
                      value={coverLetter}
                      onChange={(e) => setCoverLetter(e.target.value)}
                    />
                  </div>
                )}
              </div>

              
              {selectedJob.skills && (
                <div className="mt-10 pt-6 border-t border-slate-100">
                  <h3 className="text-lg font-bold text-slate-800 mb-4">Required Skills</h3>
                  <div className="flex flex-wrap gap-2.5">
                    {selectedJob.skills.split(',').map((skill, index) => (
                      <span key={index} className="bg-white border border-slate-200 text-slate-700 px-3.5 py-1.5 rounded-xl text-sm font-semibold shadow-sm">
                        {skill.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Modal Footer */}
            <div className="p-6 sm:p-8 bg-slate-50 border-t border-slate-100 rounded-b-2xl flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="w-full sm:w-auto">
                {selectedJob.status ? (
                  <div className="flex gap-3 items-center w-full justify-between sm:justify-start">
                    <span className="text-sm font-bold text-indigo-700 bg-white px-4 py-2.5 rounded-xl border border-indigo-100 shadow-sm flex items-center gap-2">
                      <svg className="w-5 h-5 text-indigo-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                      Saved to Applications
                    </span>
                    <button onClick={() => handleUnbookmark(selectedJob.id)} className="text-sm font-bold text-rose-500 hover:text-rose-700 hover:bg-rose-50 px-4 py-2.5 rounded-xl transition-colors">
                      Undo
                    </button>
                  </div>
                ) : (
                  <button onClick={() => handleBookmark(selectedJob.id)} className="w-full sm:w-auto text-sm font-bold text-slate-700 bg-white hover:text-indigo-700 hover:border-indigo-300 px-6 py-2.5 rounded-xl border border-slate-200 transition-all shadow-sm flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                    Bookmark Job
                  </button>
                )}
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <button onClick={() => { setSelectedJob(null); setCoverLetter(null); }} className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm">
                  Close
                </button>
                <a href={selectedJob.url} target="_blank" rel="noreferrer" className="flex-1 sm:flex-none bg-indigo-600 text-white px-8 py-2.5 rounded-xl font-bold tracking-wide hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2">
                  Apply Now
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
