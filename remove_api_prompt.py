import os
import re

file_path = "frontend/src/Dashboard.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace the prompt logic
old_logic = r"""  const handleGenerateCoverLetter = async \(job: Job\) => \{
    let keyToUse = geminiApiKey;
    if \(!keyToUse\) \{
      const key = prompt\("Please enter your Gemini API Key to generate a cover letter:"\);
      if \(!key\) return;
      setGeminiApiKey\(key\);
      localStorage.setItem\('geminiApiKey', key\);
      keyToUse = key;
    \}

    setIsGeneratingCoverLetter\(true\);"""

new_logic = """  const handleGenerateCoverLetter = async (job: Job) => {
    setIsGeneratingCoverLetter(true);"""

content = re.sub(old_logic, new_logic, content, flags=re.DOTALL)

# Remove the api_key sending
content = re.sub(r'api_key: keyToUse\n\s*\}\);', '}\);', content)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Removed API key prompt from frontend.")
