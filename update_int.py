import os

file_path = "C:/Users/USER/Documents/JobAggregator/frontend/src/Integrations.tsx"
with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

target = "const platformsList = ["
replacement = "const platformsList = [\n  { id: 'Indeed', name: 'Indeed', color: 'blue' },"

text = text.replace(target, replacement)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)

print("Updated Integrations.tsx successfully.")
