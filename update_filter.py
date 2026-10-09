import os

file_path = "C:/Users/USER/Documents/JobAggregator/frontend/src/Dashboard.tsx"
with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

target = """  // Apply Smart Filters
  let filteredJobs = jobs.filter(job => {"""

replacement = """  // Apply Smart Filters
  let filteredJobs = jobs.filter(job => {
    // 0. Source Site Filter
    if (job.source_site === 'OnlineJobsPH' && !scrapeTargets.OnlineJobsPH) return false;
    if (job.source_site === 'JobStreet' && !scrapeTargets.JobStreet) return false;
    if (job.source_site === 'Indeed' && !scrapeTargets.Indeed) return false;"""

text = text.replace(target, replacement)

# We also need to add scrapeTargets to the useEffect dependency array for pagination to reset!
target_deps = """  }, [filterCompany, filterSalary, filterRemote, filterDate, filterMatchScore, keyword]);"""
replacement_deps = """  }, [filterCompany, filterSalary, filterRemote, filterDate, filterMatchScore, keyword, scrapeTargets]);"""

text = text.replace(target_deps, replacement_deps)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)

print("Updated Dashboard.tsx successfully.")
