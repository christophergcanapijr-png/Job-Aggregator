import os
import re

# 1. backend/app/api/accounts.py
file_path = "backend/app/api/accounts.py"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Removing login_indeed route
content = re.sub(r'@router\.get\("/profile/indeed"\).*?return scraper\.interactive_login\(\)\n', '', content, flags=re.DOTALL)
with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

# 2. backend/app/api/jobs.py
file_path = "backend/app/api/jobs.py"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace indeed mentions in jobs.py (assuming I've mostly done it via tool, but let's be sure)
content = re.sub(r'\s*if "Indeed" in request\.platforms:.*?scraped_jobs\.extend\(indeed_jobs\)', '', content, flags=re.DOTALL)
content = re.sub(r'\s*elif job\.source_site == "Indeed":.*?details = scraper\.extract_job_details\(job\.url\)', '', content, flags=re.DOTALL)
with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

# 3. frontend/src/Dashboard.tsx
file_path = "frontend/src/Dashboard.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("Indeed: false", "")
content = content.replace(", Indeed: false }", " }")
content = content.replace(", Indeed: true }", " }")
content = re.sub(r'if \(job.source_site === \'Indeed\'.*?;', '', content)
content = re.sub(r'<label className="inline-flex.*?Indeed.*?</label>', '', content, flags=re.DOTALL)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

# 4. frontend/src/Integrations.tsx
file_path = "frontend/src/Integrations.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

content = re.sub(r"\{\s*id:\s*'Indeed'.*?\},", "", content, flags=re.DOTALL)
content = re.sub(r"\} else if \(platform === 'Indeed'\) \{.*?\n\s*\} else \{", "} else {", content, flags=re.DOTALL)
content = content.replace("|| formData.platform === 'Indeed'", "")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

# 5. Delete backend/app/services/scrapers/indeed.py
if os.path.exists("backend/app/services/scrapers/indeed.py"):
    os.remove("backend/app/services/scrapers/indeed.py")

print("Indeed removal complete!")
