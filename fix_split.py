import os

file_path = "frontend/src/Dashboard.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("split('\n')", "split('\\n')")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Fixed newline in split")
