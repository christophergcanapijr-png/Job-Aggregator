import os
import re

file_path = "frontend/src/Dashboard.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace the setSelectedJob calls in the job list to also clear the cover letter
old_logic = r"""<button onClick=\(\(\) => setSelectedJob\(job\)\) className="text-left focus:outline-none">"""
new_logic = """<button onClick={() => { setSelectedJob(job); setCoverLetter(null); }} className="text-left focus:outline-none">"""

content = re.sub(old_logic, new_logic, content)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated setSelectedJob to clear cover letter")
