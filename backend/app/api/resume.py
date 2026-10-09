from fastapi import APIRouter, UploadFile, File, HTTPException
import io
import re

router = APIRouter()

def parse_resume_text(text: str) -> dict:
    """Chunks raw resume text into logical sections based on common headers."""
    # Common resume section headers
    known_headers = [
        "SUMMARY", "OBJECTIVE", "PROFESSIONAL SUMMARY", "PROFILE",
        "EXPERIENCE", "WORK EXPERIENCE", "PROFESSIONAL EXPERIENCE", "EMPLOYMENT HISTORY",
        "EDUCATION", "ACADEMIC BACKGROUND",
        "SKILLS", "TECHNICAL SKILLS", "CORE COMPETENCIES",
        "PROJECTS", "PERSONAL PROJECTS",
        "CERTIFICATIONS", "LICENSES",
        "AWARDS", "HONORS",
        "LANGUAGES", "INTERESTS"
    ]
    
    sections = {}
    current_section = "Contact & Header"
    sections[current_section] = []
    
    lines = text.split("\n")
    
    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue
            
        # Check if line is a known header (all caps or exact match)
        is_header = False
        upper_line = stripped.upper()
        
        # Exact match or colon at the end
        if upper_line in known_headers or upper_line.replace(":", "") in known_headers:
            current_section = stripped.title()
            sections[current_section] = []
            is_header = True
            
        if not is_header:
            sections[current_section].append(stripped)
            
    # Format the extracted sections
    formatted = {}
    for k, v in sections.items():
        if v:
            formatted[k] = v
            
    return formatted

@router.post("/resume/parse")
async def parse_resume(file: UploadFile = File(...)):
    if not file.filename.endswith((".pdf", ".docx")):
        raise HTTPException(status_code=400, detail="Only .pdf and .docx files are supported")
        
    try:
        content = await file.read()
        extracted_text = ""
        
        if file.filename.endswith(".pdf"):
            import pdfplumber
            with pdfplumber.open(io.BytesIO(content)) as pdf:
                for page in pdf.pages:
                    extracted_text += page.extract_text() + "\n"
                    
        elif file.filename.endswith(".docx"):
            from docx import Document
            doc = Document(io.BytesIO(content))
            for para in doc.paragraphs:
                extracted_text += para.text + "\n"
                
        # Parse text into structured table
        parsed_data = parse_resume_text(extracted_text)
        
        return {
            "filename": file.filename,
            "parsed_data": parsed_data,
            "raw_text": extracted_text
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error parsing file: {str(e)}")
