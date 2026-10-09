import os
import re

file_path = "frontend/src/Dashboard.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add states
state_injection = """
  const [coverLetter, setCoverLetter] = useState<string | null>(null);
  const [isGeneratingCoverLetter, setIsGeneratingCoverLetter] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState(localStorage.getItem('geminiApiKey') || '');
"""
content = re.sub(r'const \[extractingJobId, setExtractingJobId\] = useState<number \| null>\(null\);', 
                 r'const [extractingJobId, setExtractingJobId] = useState<number | null>(null);\n' + state_injection, 
                 content)

# 2. Add function
func_injection = """
  const handleGenerateCoverLetter = async (job: Job) => {
    let keyToUse = geminiApiKey;
    if (!keyToUse) {
      const key = prompt("Please enter your Gemini API Key to generate a cover letter:");
      if (!key) return;
      setGeminiApiKey(key);
      localStorage.setItem('geminiApiKey', key);
      keyToUse = key;
    }

    setIsGeneratingCoverLetter(true);
    setCoverLetter(null);
    try {
      // Get resume data from local storage
      const savedResume = localStorage.getItem('parsedResume');
      let resumeData = {};
      if (savedResume) {
        resumeData = JSON.parse(savedResume).parsed_data || {};
      }
      
      // If no resume, use profile data
      if (Object.keys(resumeData).length === 0 && profile?.sections) {
        resumeData = profile.sections;
      }

      if (Object.keys(resumeData).length === 0) {
        alert("Please upload a resume or connect your profile first!");
        setIsGeneratingCoverLetter(false);
        return;
      }

      const response = await axios.post('http://localhost:8000/api/generate-cover-letter', {
        job_title: job.title,
        job_company: job.company,
        job_description: job.description || "No description provided",
        resume_data: resumeData,
        api_key: keyToUse
      });
      
      setCoverLetter(response.data.cover_letter);
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
"""
content = re.sub(r'const getBasicInfo = \(\) => \{', func_injection + '\n  const getBasicInfo = () => {', content)

# 3. Add UI in Modal
ui_injection = """
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
"""
content = re.sub(r'(\s*)\{selectedJob\.skills && \(', ui_injection + r'\1{selectedJob.skills && (', content)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Injected Gemini UI into Dashboard.tsx!")
