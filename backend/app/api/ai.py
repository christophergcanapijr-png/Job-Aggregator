from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, Dict, Any
import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

class CoverLetterRequest(BaseModel):
    job_title: str
    job_company: str
    job_description: str
    resume_data: Dict[str, Any]
    api_key: Optional[str] = None  # Allow passing API key from frontend if not set in backend env

class CoverLetterResponse(BaseModel):
    cover_letter: str

@router.post("/generate-cover-letter", response_model=CoverLetterResponse)
def generate_cover_letter(request: CoverLetterRequest):
    api_key = os.environ.get("GEMINI_API_KEY", "")
    
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-3.5-flash-lite')

        # Format resume data for the prompt
        resume_text = ""
        for section, content in request.resume_data.items():
            if isinstance(content, list):
                content_str = "\n".join(content)
                resume_text += f"\n--- {section} ---\n{content_str}\n"
            else:
                resume_text += f"\n--- {section} ---\n{content}\n"

        prompt = f"""
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
"""

        response = model.generate_content(prompt)
        
        if not response.text:
            raise HTTPException(status_code=500, detail="Gemini returned an empty response.")
            
        return CoverLetterResponse(cover_letter=response.text)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-cover-letter-stream")
def generate_cover_letter_stream(request: CoverLetterRequest):
    api_key = os.environ.get("GEMINI_API_KEY", "")
    
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-3.5-flash-lite')

        # Format resume data for the prompt
        resume_text = ""
        for section, content_data in request.resume_data.items():
            if isinstance(content_data, list):
                content_str = "\n".join(content_data)
                resume_text += f"\n--- {section} ---\n{content_str}\n"
            else:
                resume_text += f"\n--- {section} ---\n{content_data}\n"

        prompt = f"""
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
"""

        response = model.generate_content(prompt, stream=True)
        
        def generate():
            for chunk in response:
                if chunk.text:
                    yield chunk.text
                    
        return StreamingResponse(generate(), media_type="text/plain")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
