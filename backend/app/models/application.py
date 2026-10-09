from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from datetime import datetime
from app.core.database import Base

class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"))
    status = Column(String, default="Applied") # E.g., Applied, Interviewing, Rejected, Offer
    applied_on = Column(DateTime, default=datetime.utcnow)
    notes = Column(Text, nullable=True)
