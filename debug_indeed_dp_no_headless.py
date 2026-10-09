from DrissionPage import ChromiumPage, ChromiumOptions
import time

def test_indeed_drission_no_headless():
    options = ChromiumOptions()
    options.headless(False) # No headless
    options.set_argument('--no-sandbox')
    
    page = ChromiumPage(options)
    url = "https://ph.indeed.com/jobs?q=developer&l=&sort=date"
    page.get(url)
    
    time.sleep(10)
    print("Title:", page.title)
    
    try:
        jobs = page.eles('.job_seen_beacon')
        print("Found jobs:", len(jobs))
        if jobs:
            print("First job title:", jobs[0].ele('.jobTitle').text)
    except Exception as e:
        print("Failed to find jobs:", e)
    
    page.quit()

if __name__ == "__main__":
    test_indeed_drission_no_headless()
