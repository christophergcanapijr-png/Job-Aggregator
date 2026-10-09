import os
import re

file_path = "frontend/src/Dashboard.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add state
state_injection = """  const [aiSource, setAiSource] = useState<'profile' | 'resume' | 'both'>('both');"""
content = re.sub(r'(const \[loadingProfile, setLoadingProfile\] = useState\(true\);)', r'\1\n' + state_injection, content)

# 2. Update getUserSkills
old_get_skills = r"""    if \(profile\?\.sections\) \{
      if \(profile\.sections\["Top Skills"\]\) extractProfileSkills\(profile\.sections\["Top Skills"\]\);
      if \(profile\.sections\["Other Skills"\]\) extractProfileSkills\(profile\.sections\["Other Skills"\]\);
    \}
    
    try \{
      const savedResume = localStorage\.getItem\('parsedResume'\);"""

new_get_skills = """    if (aiSource === 'profile' || aiSource === 'both') {
      if (profile?.sections) {
        if (profile.sections["Top Skills"]) extractProfileSkills(profile.sections["Top Skills"]);
        if (profile.sections["Other Skills"]) extractProfileSkills(profile.sections["Other Skills"]);
      }
    }
    
    if (aiSource === 'resume' || aiSource === 'both') {
      try {
        const savedResume = localStorage.getItem('parsedResume');"""

content = re.sub(old_get_skills, new_get_skills, content)
content = re.sub(r'\} catch \(e\) \{\}', r'} catch (e) {}\n    }', content, count=1) # close the if block for resume

# 3. Update handleGenerateCoverLetter logic
old_cover_logic = r"""      // Get resume data from local storage
      const savedResume = localStorage\.getItem\('parsedResume'\);
      let resumeData = \{\};
      if \(savedResume\) \{
        resumeData = JSON\.parse\(savedResume\)\.parsed_data \|\| \{\};
      \}
      
      // If no resume, use profile data
      if \(Object\.keys\(resumeData\)\.length === 0 && profile\?\.sections\) \{
        resumeData = profile\.sections;
      \}

      if \(Object\.keys\(resumeData\)\.length === 0\) \{"""

new_cover_logic = """      const savedResume = localStorage.getItem('parsedResume');
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

      if (Object.keys(resumeData).length === 0) {"""
content = re.sub(old_cover_logic, new_cover_logic, content)

# 4. Add UI in Identity sidebar
ui_injection = """
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
"""
# Insert after the Verified badge block
content = re.sub(r'(<div className="flex items-center gap-1 text-xs font-bold text-emerald-600 mt-1\.5 bg-emerald-50 w-max px-2 py-0\.5 rounded uppercase tracking-wider">\s*<svg.*?</svg>\s*Verified\s*</div>\s*</div>\s*</div>)', r'\1' + ui_injection, content)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Added AI Source option")
