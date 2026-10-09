import os
import re

file_path = "frontend/src/Dashboard.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

old_logic = r"""      const response = await axios\.post\('http://localhost:8000/api/generate-cover-letter', \{
        job_title: job\.title,
        job_company: job\.company,
        job_description: job\.description \|\| "No description provided",
        resume_data: resumeData,
      \}\);
      
      setCoverLetter\(response\.data\.cover_letter\);"""

new_logic = """      const response = await fetch('http://localhost:8000/api/generate-cover-letter-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_title: job.title,
          job_company: job.company,
          job_description: job.description || "No description provided",
          resume_data: resumeData,
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to generate cover letter");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader");
      
      const decoder = new TextDecoder("utf-8");
      let currentLetter = "";
      setCoverLetter("");
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        currentLetter += chunk;
        setCoverLetter(currentLetter);
      }"""

content = re.sub(old_logic, new_logic, content)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated frontend to stream!")
