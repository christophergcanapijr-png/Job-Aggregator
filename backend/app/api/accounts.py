from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.connected_account import ConnectedAccount
from pydantic import BaseModel

router = APIRouter()

class AccountCreate(BaseModel):
    platform: str
    username: str
    password: str

class AccountResponse(BaseModel):
    id: int
    platform: str
    username: str

    class Config:
        from_attributes = True

@router.post("/accounts", response_model=AccountResponse)
def connect_account(account: AccountCreate, db: Session = Depends(get_db)):
    # Check if we already have an account for this platform
    existing = db.query(ConnectedAccount).filter(ConnectedAccount.platform == account.platform).first()
    if existing:
        existing.username = account.username
        existing.password = account.password
        db.commit()
        db.refresh(existing)
        return existing
        
    new_account = ConnectedAccount(
        platform=account.platform,
        username=account.username,
        password=account.password
    )
    db.add(new_account)
    db.commit()
    db.refresh(new_account)
    return new_account

@router.get("/accounts", response_model=List[AccountResponse])
def get_accounts(db: Session = Depends(get_db)):
    return db.query(ConnectedAccount).all()

@router.get("/profile/onlinejobsph")
def get_onlinejobsph_profile(refresh: bool = False, db: Session = Depends(get_db)):
    account = db.query(ConnectedAccount).filter(ConnectedAccount.platform == "OnlineJobsPH").first()
    if not account:
        return {"error": "Account not connected"}
        
    # Return cached data if available and we're not forcing a refresh
    if not refresh and account.profile_data:
        return account.profile_data
        
    # Otherwise, scrape the profile via Selenium
    from app.services.scrapers.onlinejobsph import OnlineJobsPHScraper
    scraper = OnlineJobsPHScraper(username=account.username, password=account.password)
    profile_result = scraper.get_my_profile()
    
    # Cache it in the database
    if "error" not in profile_result:
        account.profile_data = profile_result
        db.commit()
        
    return profile_result

@router.get("/profile/jobstreet")
def login_jobstreet(db: Session = Depends(get_db)):
    account = db.query(ConnectedAccount).filter(ConnectedAccount.platform == "JobStreet").first()
    if not account:
        return {"error": "Account not connected"}
        
    from app.services.scrapers.jobstreet import JobStreetScraper
    scraper = JobStreetScraper()
    return scraper.interactive_login()

@router.delete("/accounts/{platform}")
def delete_account(platform: str, db: Session = Depends(get_db)):
    account = db.query(ConnectedAccount).filter(ConnectedAccount.platform == platform).first()
    if account:
        db.delete(account)
        db.commit()
        return {"status": "deleted"}
    return {"status": "not found"}

