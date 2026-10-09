import os
import re

file_path = "frontend/src/Dashboard.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

old_link_block = r"""                   <Link to="/resume" className="group flex items-center justify-between p-4 bg-slate-50 rounded-xl \nhover:bg-indigo-50 transition-colors border border-transparent hover:border-indigo-100">.*?</Link>"""
old_link_block = r"""<Link to="/resume" className="group flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-indigo-50 transition-colors border border-transparent hover:border-indigo-100">[\s\S]*?</Link>"""

new_link_block = """{(() => {
                  let resumeFile = null;
                  let latestRole = null;
                  try {
                    const saved = localStorage.getItem('parsedResume');
                    if (saved) {
                      const data = JSON.parse(saved);
                      resumeFile = data.filename || "Resume Attached";
                      
                      const experience = data.parsed_data?.EXPERIENCE || data.parsed_data?.["WORK EXPERIENCE"] || data.parsed_data?.["EXPERIENCE & PROJECTS"];
                      if (experience && Array.isArray(experience) && experience.length > 0) {
                        const firstLine = experience[0].split('\\n')[0].replace(/[^a-zA-Z0-9 ]/g, "").trim();
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
                })()}"""

content = re.sub(old_link_block, new_link_block, content)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated resume UI in Identity sidebar")
