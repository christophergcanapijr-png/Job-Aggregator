import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface ParsedResume {
  filename: string;
  parsed_data: Record<string, string[]>;
}

const ResumeParser: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ParsedResume | null>(() => {
    const saved = localStorage.getItem('parsedResume');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return null; }
    }
    return null;
  });
  const [isEditingSkills, setIsEditingSkills] = useState(false);
  const [editableSkills, setEditableSkills] = useState<string>('');

  useEffect(() => {
    if (result && result.parsed_data) {
      const skillsKey = Object.keys(result.parsed_data).find(k => k.toLowerCase().includes('skill'));
      if (skillsKey) {
        setEditableSkills(result.parsed_data[skillsKey].join('\\n'));
      }
    }
  }, [result]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://localhost:8000/api/resume/parse', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult(response.data);
      localStorage.setItem('parsedResume', JSON.stringify(response.data));
      setFile(null);
    } catch (error) {
      console.error('Error uploading resume', error);
      alert('Failed to parse resume.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSaveSkills = () => {
    if (!result) return;
    const skillsKey = Object.keys(result.parsed_data).find(k => k.toLowerCase().includes('skill')) || 'SKILLS';
    
    const updatedResult = { ...result };
    if (!updatedResult.parsed_data[skillsKey]) updatedResult.parsed_data[skillsKey] = [];
    
    updatedResult.parsed_data[skillsKey] = editableSkills.split('\\n').filter(s => s.trim().length > 0);
    
    setResult(updatedResult);
    localStorage.setItem('parsedResume', JSON.stringify(updatedResult));
    setIsEditingSkills(false);
  };

  const handleClear = () => {
    if (!window.confirm("Are you sure you want to delete your parsed resume?")) return;
    setResult(null);
    localStorage.removeItem('parsedResume');
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8 pb-12">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Resume Management</h2>
        <p className="text-slate-500 mt-2 font-medium">Upload your PDF or DOCX resume to power the AI match engine and cover letter generator.</p>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <form onSubmit={handleUpload} className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1 w-full relative">
            <input 
              type="file" 
              accept=".pdf,.docx" 
              onChange={handleFileChange} 
              className="w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-colors border border-slate-200 rounded-xl bg-slate-50 p-1"
            />
          </div>
          <button 
            type="submit" 
            disabled={!file || loading}
            className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-white shadow-sm transition-all ${!file || loading ? 'bg-slate-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
          >
            {loading ? 'Parsing...' : (result ? 'Replace Resume' : 'Upload & Parse')}
          </button>
        </form>
      </div>

      {result && (
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Currently Active: <span className="text-indigo-600 font-extrabold">{result.filename}</span>
            </h3>
            <button onClick={handleClear} className="text-sm font-bold text-rose-500 hover:text-rose-700 transition-colors">Remove</button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(result.parsed_data).map(([section, lines], idx) => {
              const isSkills = section.toLowerCase().includes('skill');
              
              if (isSkills) {
                return (
                  <div key={idx} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:col-span-2">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-sm font-extrabold text-slate-400 uppercase tracking-widest">{section}</h4>
                      {isEditingSkills ? (
                        <button onClick={handleSaveSkills} className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1 rounded-lg text-xs font-bold transition-colors shadow-sm">Save Skills</button>
                      ) : (
                        <button onClick={() => setIsEditingSkills(true)} className="text-indigo-600 hover:text-indigo-800 text-sm font-bold flex items-center gap-1 transition-colors">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          Edit manually
                        </button>
                      )}
                    </div>
                    
                    {isEditingSkills ? (
                      <textarea 
                        className="w-full h-48 p-4 border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium text-slate-700 bg-slate-50"
                        value={editableSkills}
                        onChange={(e) => setEditableSkills(e.target.value)}
                        placeholder="One skill per line..."
                      />
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {lines.map((line, i) => {
                          const cleanLine = line.replace(/[^a-zA-Z0-9 ]/g, "").trim();
                          if (!cleanLine) return null;
                          return (
                            <span key={i} className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg text-sm font-bold border border-indigo-100">
                              {cleanLine}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <div key={idx} className={`bg-white rounded-2xl shadow-sm border border-slate-100 p-6 ${section.toLowerCase().includes('experience') ? 'md:col-span-2' : ''}`}>
                  <h4 className="text-sm font-extrabold text-slate-400 uppercase tracking-widest mb-4">{section}</h4>
                  <ul className="space-y-3">
                    {lines.map((line, i) => (
                      <li key={i} className="text-sm font-medium text-slate-700 leading-relaxed pl-4 relative before:content-[''] before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:bg-indigo-300 before:rounded-full">
                        {line}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeParser;
