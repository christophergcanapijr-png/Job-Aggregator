import os
import re

file_path = "backend/app/api/ai.py"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

new_prompt = r"""        prompt = f\"\"\"
You are an expert career coach and professional copywriter.
Please write an EXTREMELY SHORT, highly tailored, and punchy cover letter for the following job.

JOB DETAILS:
Title: {request.job_title}
Company: {request.job_company}
Description: 
{request.job_description}

MY RESUME/PROFILE:
{resume_text}

INSTRUCTIONS:
1. Write a very short and direct cover letter based heavily on the job description and my resume.
2. Structure it EXACTLY like this template, but tailor the actual skills/experiences based on my resume and what the job needs:

Hi,

My name is [Your Name], and I'm applying for the {request.job_title} position.

[1-2 sentences highlighting your strongest matching experience, e.g., "I have experience building backend systems with Python and JavaScript..."]

[1-2 sentences highlighting your strongest matching soft skills/traits, e.g., "My background includes building custom web applications from scratch..."]

You can review my portfolio here: [Link to Portfolio/Resume]

[1 concluding sentence reaffirming fit and availability].

Looking forward to discussing further.

Best regards,
[Your Name]

3. Do NOT make it long. Keep it to an absolute MAXIMUM of 150 words.
4. Return ONLY the final letter text. Do not include any meta-commentary or introductory text.
\"\"\""""

# Replace the prompt in both places
content = re.sub(r'        prompt = f"""\nYou are an expert career coach.*?Return ONLY the final letter text\. Do not include any meta-commentary or introductory text\.\n"""', new_prompt, content, flags=re.DOTALL)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated prompt in ai.py")
