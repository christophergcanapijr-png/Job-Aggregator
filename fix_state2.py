import os
import re

file_path = "frontend/src/Dashboard.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Fix the regex
old_logic = r"""<button onClick=\{\(\) => setSelectedJob\(job\)\} className="text-left focus:outline-none">"""
new_logic = """<button onClick={() => { setSelectedJob(job); setCoverLetter(null); }} className="text-left focus:outline-none">"""

content = re.sub(old_logic, new_logic, content)

# Also fix the close modal buttons
old_close = r"""onClick=\{\(\) => setSelectedJob\(null\)\}"""
new_close = """onClick={() => { setSelectedJob(null); setCoverLetter(null); }}"""
content = re.sub(old_close, new_close, content)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Actually updated setSelectedJob")
