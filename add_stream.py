import os
import re

file_path = "backend/app/api/ai.py"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Add StreamingResponse to imports
if "from fastapi.responses import StreamingResponse" not in content:
    content = content.replace("from fastapi import APIRouter, HTTPException, Depends", "from fastapi import APIRouter, HTTPException, Depends\nfrom fastapi.responses import StreamingResponse")

streaming_endpoint = """
@router.post("/generate-cover-letter-stream")
def generate_cover_letter_stream(request: CoverLetterRequest):
    api_key = os.environ.get("GEMINI_API_KEY", "")
    
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-3.8-flash')

        # Format resume data for the prompt
        resume_text = ""
        for section, content_data in request.resume_data.items():
            if isinstance(content_data, list):
                content_str = "\\n".join(content_data)
                resume_text += f"\\n--- {section} ---\\n{content_str}\\n"
            else:
                resume_text += f"\\n--- {section} ---\\n{content_data}\\n"

        prompt = f\"\"\"
You are an expert career coach and professional copywriter.
Please write a highly tailored, compelling, and professional application/cover letter for the following job.

JOB DETAILS:
Title: {request.job_title}
Company: {request.job_company}
Description: 
{request.job_description}

MY RESUME/PROFILE:
{resume_text}

INSTRUCTIONS:
1. Write a professional, engaging cover letter that clearly connects my experience from my resume to the specific requirements in the job description.
2. Keep it concise (about 3-4 paragraphs) but impactful. Do not just summarize my resume; explain WHY I am a great fit for THIS specific role.
3. Use a confident but humble tone.
4. If there are gaps in the resume for specific job requirements, focus on my transferable skills and enthusiasm to learn.
5. Format the letter with placeholders like [Your Name], [Your Contact Info] if that information is missing from the resume.
6. Return ONLY the final letter text. Do not include any meta-commentary or introductory text.
\"\"\"

        response = model.generate_content(prompt, stream=True)
        
        def generate():
            for chunk in response:
                if chunk.text:
                    yield chunk.text
                    
        return StreamingResponse(generate(), media_type="text/plain")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
"""

content = content + "\n" + streaming_endpoint

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Added streaming endpoint.")
