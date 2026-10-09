import os

file_path = "C:/Users/USER/Documents/JobAggregator/backend/app/api/accounts.py"
with open(file_path, 'a', encoding='utf-8') as f:
    f.write('''
@router.get("/profile/indeed")
def login_indeed(db: Session = Depends(get_db)):
    account = db.query(ConnectedAccount).filter(ConnectedAccount.platform == "Indeed").first()
    if not account:
        return {"error": "Account not connected"}
        
    from app.services.scrapers.indeed import IndeedScraper
    scraper = IndeedScraper()
    return scraper.interactive_login()
''')
print("Appended successfully.")
