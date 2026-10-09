from DrissionPage import ChromiumPage, ChromiumOptions

def test_indeed_drission():
    options = ChromiumOptions()
    options.headless(True)
    options.set_argument('--no-sandbox')
    
    page = ChromiumPage(options)
    url = "https://ph.indeed.com/jobs?q=developer&l=&sort=date"
    page.get(url)
    
    print("Title:", page.title)
    
    # wait for the job list
    try:
        page.wait.ele_displayed('#mosaic-jobResults', timeout=15)
        jobs = page.eles('.job_seen_beacon')
        print("Found jobs:", len(jobs))
        if jobs:
            print("First job title:", jobs[0].ele('.jobTitle').text)
    except Exception as e:
        print("Failed to find jobs:", e)
    
    page.quit()

if __name__ == "__main__":
    test_indeed_drission()
