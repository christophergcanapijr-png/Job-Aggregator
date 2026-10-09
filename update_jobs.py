import os

file_path = "C:/Users/USER/Documents/JobAggregator/backend/app/api/jobs.py"
with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

code_scrape = """
    if "Indeed" in request.platforms:
        from app.services.scrapers.indeed import IndeedScraper
        account = db.query(ConnectedAccount).filter(ConnectedAccount.platform == "Indeed").first()
        if account:
            scraper = IndeedScraper(username=account.username, password=account.password)
        else:
            scraper = IndeedScraper()
        indeed_jobs = scraper.search_jobs(keyword=request.keyword)
        indeed_jobs.reverse()
        scraped_jobs.extend(indeed_jobs)

"""

code_extract = """
    elif job.source_site == "Indeed":
        from app.services.scrapers.indeed import IndeedScraper
        scraper = IndeedScraper()
        details = scraper.extract_job_details(job.url)
"""

text = text.replace("    saved_jobs = []", code_scrape + "    saved_jobs = []")
text = text.replace("    if details and \"description\" in details", code_extract + "    if details and \"description\" in details")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)

print("Updated jobs.py successfully.")
