import os
import re

file_path = "frontend/src/Dashboard.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add state
content = re.sub(r'const \[filterMatchScore, setFilterMatchScore\] = useState\(0\);', r'const [filterMatchScore, setFilterMatchScore] = useState(0);\n  const [sortBy, setSortBy] = useState("latest");', content)

# 2. Update sorting logic
old_sort_logic = r"""  const sortedJobs = \[\.\.\.filteredJobs\]\.sort\(\(a, b\) => \{
    const aMatch = calculateMatch\(a, activeSkills\);
    const bMatch = calculateMatch\(b, activeSkills\);
    if \(aMatch && !bMatch\) return -1;
    if \(!aMatch && bMatch\) return 1;
    return 0;
  \}\);"""

new_sort_logic = """  const sortedJobs = [...filteredJobs].sort((a, b) => {
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
  });"""

content = re.sub(old_sort_logic, new_sort_logic, content)

# 3. Add to dependencies of useEffect for setCurrentPage
content = re.sub(r'\[filterCompany, filterSalary, filterRemote, filterDate, filterMatchScore, keyword, scrapeTargets\]', r'[filterCompany, filterSalary, filterRemote, filterDate, filterMatchScore, sortBy, keyword, scrapeTargets]', content)

# 4. Add UI for Sort By next to results count
old_ui = r"""              </div>
              <span className="text-indigo-700 font-bold text-xs uppercase tracking-wider bg-indigo-50 px-3 py-1.5 rounded-full ring-1 ring-indigo-100/50">
                \{sortedJobs\.length\} results
              </span>
            </button>"""

new_ui = """              </div>
              <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                <div className="flex bg-slate-100/80 rounded-lg p-1">
                  <button onClick={() => setSortBy('latest')} className={`px-3 py-1 text-[11px] uppercase tracking-wider font-bold rounded-md transition-all ${sortBy === 'latest' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>Latest</button>
                  <button onClick={() => setSortBy('match')} className={`px-3 py-1 text-[11px] uppercase tracking-wider font-bold rounded-md transition-all ${sortBy === 'match' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>Top Match</button>
                </div>
                <span className="text-indigo-700 font-bold text-xs uppercase tracking-wider bg-indigo-50 px-3 py-1.5 rounded-full ring-1 ring-indigo-100/50">
                  {sortedJobs.length} results
                </span>
              </div>
            </button>"""

content = re.sub(old_ui, new_ui, content)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Added sorting logic and UI")
