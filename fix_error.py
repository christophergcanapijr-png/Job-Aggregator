import os
import re

file_path = "frontend/src/Dashboard.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace the alert logic to use error.message correctly
old_alert = r"""        alert\(error\.response\?\.data\?\.detail \|\| "Failed to generate cover letter\. Check your API key\."\);"""
new_alert = """        alert(error.message || "Failed to generate cover letter. Check your API key.");"""

content = re.sub(old_alert, new_alert, content)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated error handling in frontend")
