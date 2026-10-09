from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.job import Job
from app.models.connected_account import ConnectedAccount
from app.services.scrapers.onlinejobsph import OnlineJobsPHScraper
from pydantic import BaseModel
from datetime import datetime

from typing import List, Optional

router = APIRouter()

class JobResponse(BaseModel):
    id: int
    title: str
    company: str
    location: str
    description: str
    url: str
    source_site: str
    salary: Optional[str] = None
    posted_date: Optional[str] = None
    job_type: Optional[str] = None
    skills: Optional[str] = None
    status: Optional[str] = None

    class Config:
        from_attributes = True

class SearchRequest(BaseModel):
    keyword: str
    platforms: List[str] = ["OnlineJobsPH"]

class JobStatusUpdate(BaseModel):
    status: Optional[str]

@router.put("/jobs/{job_id}/status", response_model=JobResponse)
def update_job_status(job_id: int, request: JobStatusUpdate, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    job.status = request.status
    db.commit()
    db.refresh(job)
    return job

@router.post("/scrape", response_model=List[JobResponse])
def scrape_jobs(request: SearchRequest, db: Session = Depends(get_db)):
    scraped_jobs = []
    
    if "OnlineJobsPH" in request.platforms:
        account = db.query(ConnectedAccount).filter(ConnectedAccount.platform == "OnlineJobsPH").first()
        if account:
            scraper = OnlineJobsPHScraper(username=account.username, password=account.password)
        else:
            scraper = OnlineJobsPHScraper()
        oj_jobs = scraper.search_jobs(keyword=request.keyword)
        oj_jobs.reverse()
        scraped_jobs.extend(oj_jobs)
        
    if "JobStreet" in request.platforms:
        from app.services.scrapers.jobstreet import JobStreetScraper
        account = db.query(ConnectedAccount).filter(ConnectedAccount.platform == "JobStreet").first()
        if account:
            scraper = JobStreetScraper(username=account.username, password=account.password)
        else:
            scraper = JobStreetScraper()
        js_jobs = scraper.search_jobs(keyword=request.keyword)
        js_jobs.reverse()
        scraped_jobs.extend(js_jobs)


    saved_jobs = []
    for job_data in scraped_jobs:
        if not job_data.get("url"):
            continue
            
        # Check if job already exists by URL
        existing_job = db.query(Job).filter(Job.url == job_data["url"]).first()
        if not existing_job:
            new_job = Job(
                title=job_data["title"],
                company=job_data["company"],
                location=job_data["location"],
                description=job_data["description"],
                url=job_data["url"],
                source_site=job_data["source_site"],
                salary=job_data.get("salary"),
                posted_date=job_data.get("posted_date"),
                job_type=job_data.get("job_type"),
                skills=job_data.get("skills"),
                created_at=datetime.utcnow()
            )
            db.add(new_job)
            db.commit()
            db.refresh(new_job)
            saved_jobs.append(new_job)
        else:
            saved_jobs.append(existing_job)
            
    return saved_jobs

@router.get("/jobs", response_model=List[JobResponse])
def get_jobs(db: Session = Depends(get_db)):
    return db.query(Job).order_by(Job.created_at.desc()).all()

@router.delete("/jobs")
def clear_unbookmarked_jobs(db: Session = Depends(get_db)):
    # Delete all jobs that haven't been saved to applications
    db.query(Job).filter(Job.status == None).delete()
    db.commit()
    return {"status": "cleared"}

@router.post("/jobs/{job_id}/extract", response_model=JobResponse)
def extract_full_description(job_id: int, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    details = {}
    if job.source_site == "JobStreet":
        from app.services.scrapers.jobstreet import JobStreetScraper
        scraper = JobStreetScraper()
        details = scraper.extract_job_details(job.url)
    elif job.source_site == "OnlineJobsPH":
        from app.services.scrapers.onlinejobsph import OnlineJobsPHScraper
        scraper = OnlineJobsPHScraper()
        details = scraper.extract_job_details(job.url)
        

    if details and "description" in details and details["description"]:
        job.description = details["description"]
        db.commit()
        db.refresh(job)
        
    return job
