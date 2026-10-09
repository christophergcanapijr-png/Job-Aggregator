from typing import List, Dict, Any
from bs4 import BeautifulSoup
from .base import BaseScraper
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
import pickle
import os

class JobStreetScraper(BaseScraper):
    BASE_URL = "https://ph.jobstreet.com"

    def __init__(self, username: str = None, password: str = None):
        self.username = username
        self.password = password
        self.is_logged_in = False
        self.driver = None

    def _init_driver(self, headless: bool = True):
        if not self.driver:
            options = webdriver.ChromeOptions()
            if headless:
                options.add_argument("--headless=new")
            options.add_argument("--disable-blink-features=AutomationControlled")
            options.add_experimental_option("excludeSwitches", ["enable-automation"])
            options.add_experimental_option('useAutomationExtension', False)
            self.driver = webdriver.Chrome(options=options)

    def interactive_login(self):
        """Launches a visible browser so the user can manually sign in via OTP. Saves cookies."""
        self._init_driver(headless=False)
        
        # Load the homepage instead of a hardcoded 404 login URL
        self.driver.get("https://www.jobstreet.com.ph/")
        
        # Wait up to 90 seconds for the user to navigate to the login page AND finish logging in
        try:
            # First, wait for them to click "Log in" and be redirected to the SEEK auth domain
            WebDriverWait(self.driver, 30).until(
                lambda d: "login.seek.com" in d.current_url.lower()
            )
            # Next, wait for them to finish the OTP flow and be redirected back to JobStreet
            WebDriverWait(self.driver, 60).until(
                lambda d: "login.seek.com" not in d.current_url.lower()
            )
            # Add a small buffer to let cookies fully set after the redirect
            time.sleep(3)
        except:
            # If timeout occurs, we just save whatever cookies we have (in case they logged in faster/slower)
            pass 
            
        # Save cookies
        cookies = self.driver.get_cookies()
        with open("jobstreet_cookies.pkl", "wb") as f:
            pickle.dump(cookies, f)
            
        self.driver.quit()
        return {"status": "success", "message": "Cookies saved"}

    def _load_cookies(self):
        cookies_file = "jobstreet_cookies.pkl"
        if os.path.exists(cookies_file):
            self.driver.get("https://ph.jobstreet.com") # Must be on domain
            with open(cookies_file, "rb") as f:
                cookies = pickle.load(f)
                for cookie in cookies:
                    self.driver.add_cookie(cookie)
            return True
        return False

    def search_jobs(self, keyword: str, location: str = "") -> List[Dict[str, Any]]:
        # JobStreet Cloudflare detects headless Chrome TLS fingerprints even with valid cookies
        # We must run this visibly so Cloudflare lets it through or the user can click the checkbox
        self._init_driver(headless=False)
        self._load_cookies()
        
        if keyword:
            formatted_keyword = keyword.replace(" ", "-").lower()
            url = f"{self.BASE_URL}/{formatted_keyword}-jobs?sortmode=ListedDate"
        else:
            url = f"{self.BASE_URL}/jobs?sortmode=ListedDate"
            
        print(f"Scraping JobStreet URL: {url}")
        
        try:
            self.driver.get(url)
            
            # Wait up to 30 seconds for Cloudflare to clear and jobs to load
            try:
                WebDriverWait(self.driver, 30).until(
                    lambda d: len(d.find_elements(By.TAG_NAME, "article")) > 0
                )
            except:
                print("Timeout waiting for JobStreet articles (might be stuck on Cloudflare)")
            
            soup = BeautifulSoup(self.driver.page_source, "html.parser")
            
            jobs = []
            # JobStreet uses standard article tags for job cards
            job_cards = soup.find_all("article")
            
            for card in job_cards:
                title_elem = card.find("h3")
                if not title_elem:
                    continue
                    
                title = title_elem.get_text(strip=True)
                
                link_elem = card.find("a")
                job_url = link_elem["href"] if link_elem and link_elem.has_attr("href") else ""
                if job_url and not job_url.startswith("http"):
                    job_url = self.BASE_URL + job_url
                
                company_elem = card.find("a", {"data-automation": "jobCompany"})
                company = company_elem.get_text(strip=True) if company_elem else "JobStreet Employer"
                
                loc_elem = card.find("span", {"data-automation": "jobLocation"})
                location_text = loc_elem.get_text(strip=True) if loc_elem else "Philippines"
                
                desc_elem = card.find("span", {"data-automation": "jobShortDescription"})
                description = desc_elem.get_text(strip=True) if desc_elem else ""
                
                salary_elem = card.find("span", {"data-automation": "jobSalary"})
                salary = salary_elem.get_text(strip=True) if salary_elem else None
                
                date_elem = card.find("span", {"data-automation": "jobListingDate"})
                posted_date = date_elem.get_text(strip=True) if date_elem else None
                
                jobs.append({
                    "title": title,
                    "company": company,
                    "location": location_text,
                    "description": description,
                    "url": job_url,
                    "source_site": "JobStreet",
                    "salary": salary,
                    "posted_date": posted_date,
                    "job_type": None,
                    "skills": None
                })
                
            self.driver.quit()
            return jobs
            
        except Exception as e:
            if self.driver:
                self.driver.quit()
            print(f"Error scraping JobStreet with Selenium: {e}")
            return []

    def get_my_profile(self) -> Dict[str, Any]:
        return {"error": "Profile parsing not supported yet for JobStreet"}
        
    def extract_job_details(self, job_url: str) -> Dict[str, Any]:
        self._init_driver(headless=False)
        self._load_cookies()
        try:
            self.driver.get(job_url)
            time.sleep(4)
            soup = BeautifulSoup(self.driver.page_source, "html.parser")
            
            # JobStreet description is usually inside a div with data-automation="jobAdDetails" or "jobDescription"
            desc_elem = soup.find("div", {"data-automation": "jobAdDetails"}) or soup.find("div", {"data-automation": "jobDescription"})
            if desc_elem:
                return {"description": desc_elem.get_text(separator="\n", strip=True)}
                
            return {}
        except Exception as e:
            print(f"Error extracting JobStreet details: {e}")
            return {}
        finally:
            if self.driver:
                self.driver.quit()
                self.driver = None
