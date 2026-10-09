from sqlalchemy import Column, Integer, String, DateTime, Text
from datetime import datetime
from app.core.database import Base

class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    company = Column(String, index=True)
    location = Column(String)
    description = Column(Text)
    url = Column(String, unique=True, index=True)
    source_site = Column(String) # E.g., OnlineJobPH, Indeed, JobStreet
    salary = Column(String, nullable=True)
    posted_date = Column(String, nullable=True)
    job_type = Column(String, nullable=True) # Full Time, Part Time, etc.
    skills = Column(String, nullable=True) # Comma separated list
    status = Column(String, nullable=True) # bookmarked, applied, interviewed, success, no reply, rejected
    created_at = Column(DateTime, default=datetime.utcnow)
