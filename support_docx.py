import os
import re

file_path = "frontend/src/ResumeParser.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Fix accept attribute
content = content.replace('accept=".pdf"', 'accept=".pdf,.docx"')

# Fix API endpoint
content = content.replace('/api/resume/upload', '/api/resume/parse')

# Fix text description
content = content.replace('Upload your PDF resume', 'Upload your PDF or DOCX resume')

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated resume parser to support DOCX and fixed API endpoint")
