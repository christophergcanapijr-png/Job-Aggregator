import time
import re
from typing import List, Dict, Any
from bs4 import BeautifulSoup
from .base import BaseScraper
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

class OnlineJobsPHScraper(BaseScraper):
    BASE_URL = "https://www.onlinejobs.ph"

    def __init__(self, username: str = None, password: str = None):
        self.username = username
        self.password = password
        self.is_logged_in = False
        self.driver = None

    def _init_driver(self):
        if not self.driver:
            options = webdriver.ChromeOptions()
            options.add_argument("--headless=new") # Run entirely in the background
            options.add_argument("--disable-blink-features=AutomationControlled")
            options.add_experimental_option("excludeSwitches", ["enable-automation"])
            options.add_experimental_option('useAutomationExtension', False)
            self.driver = webdriver.Chrome(options=options)

    def _login(self):
        """Attempts to log in to OnlineJobs.ph using Selenium and Cookies."""
        if not self.username or not self.password:
            return
            
        self._init_driver()
        
        import pickle
        import os
        cookie_file = "ojph_cookies.pkl"
        
        # Try loading cookies first to avoid suspicious re-logins
        try:
            self.driver.get(self.BASE_URL)
            if os.path.exists(cookie_file):
                with open(cookie_file, "rb") as f:
                    cookies = pickle.load(f)
                    for cookie in cookies:
                        self.driver.add_cookie(cookie)
                        
                # Refresh page with cookies loaded to check if session is active
                self.driver.get(f"{self.BASE_URL}/jobseekers/dashboard")
                time.sleep(2)
                
                if "login" not in self.driver.current_url.lower():
                    self.is_logged_in = True
                    print("Successfully restored session from cookies!")
                    return
        except Exception as e:
            print("Failed to load cookies:", e)
            
        # If cookies failed or don't exist, do a fresh login
        login_url = f"{self.BASE_URL}/login"
        
        try:
            self.driver.get(login_url)
            
            # Wait for email input to be present
            email_input = WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.NAME, "info[email]"))
            )
            password_input = self.driver.find_element(By.NAME, "info[password]")
            
            # Enter credentials
            email_input.clear()
            email_input.send_keys(self.username)
            password_input.clear()
            password_input.send_keys(self.password)
            
            # Submit form
            password_input.submit()
            
            # Wait for login to complete
            time.sleep(4)
            
            page_source = self.driver.page_source
            if "Logout" in page_source or "Dashboard" in page_source or "dashboard" in self.driver.current_url:
                self.is_logged_in = True
                print("Successfully logged into OnlineJobs.ph!")
                
                # Save the new cookies for future scrapes
                with open(cookie_file, "wb") as f:
                    pickle.dump(self.driver.get_cookies(), f)
                    print("Cookies saved!")
            else:
                print("Failed to log in. Please check credentials or solve Captcha in browser.")
        except Exception as e:
            print(f"Login error with Selenium: {e}")

    def get_my_profile(self) -> Dict[str, Any]:
        """Fetches the logged-in user's profile details using Selenium."""
        self._login()
        
        if not self.is_logged_in:
            if self.driver:
                self.driver.quit()
            return {"error": "Not logged in or blocked by Cloudflare."}
            
        try:
            # Step 1: Visit the dashboard to find the actual profile link or ID
            self.driver.get(f"{self.BASE_URL}/jobseekers/dashboard")
            time.sleep(2) # Let JS load
            dash_text = self.driver.page_source
            
            profile_url = None
            jobseeker_id = None
            
            # Use regex to find the jobseeker ID anywhere in the HTML (V1)
            match = re.search(r'jobseekers/(?:info|rate-your-skills|profile)/(\d+)', dash_text)
            if match:
                jobseeker_id = match.group(1)
            else:
                # Next.js state on V2 dashboard
                match_json = re.search(r'\"contextId\"\\?:\s*(\d+)', dash_text)
                if match_json:
                    jobseeker_id = match_json.group(1)
                else:
                    match_json2 = re.search(r'\"userId\"\\?:\s*\\?\"(\d+)', dash_text)
                    if match_json2:
                        jobseeker_id = match_json2.group(1)

            if jobseeker_id:
                profile_url = f"https://v2.onlinejobs.ph/jobseekers/info/{jobseeker_id}"
            else:
                # Try v2 dashboard just in case
                self.driver.get("https://v2.onlinejobs.ph/jobseekers")
                time.sleep(4)
                dash_text_v2 = self.driver.page_source
                match_v2 = re.search(r'\"contextId\"\\?:\s*(\d+)', dash_text_v2) or re.search(r'\"userId\"\\?:\s*\\?\"(\d+)', dash_text_v2)
                if match_v2:
                    jobseeker_id = match_v2.group(1)
                    profile_url = f"https://v2.onlinejobs.ph/jobseekers/info/{jobseeker_id}"
                else:
                    profile_url = f"{self.BASE_URL}/jobseekers/jobseeker_edit"
                    
            print(f"Extracted Profile URL: {profile_url}")
            
            # Visit the final profile URL
            self.driver.get(profile_url)
            time.sleep(3) # Let profile data render (especially if React/Vue)
            
            # Wait for data to render fully
            time.sleep(5)
            
            # Extract the raw text from the body
            body = self.driver.find_element(By.TAG_NAME, "body")
            raw_text = body.text
            
            # Find the profile picture using BeautifulSoup
            soup = BeautifulSoup(self.driver.page_source, "html.parser")
            profile_pic_url = None
            for img in soup.find_all("img"):
                src = img.get("src", "")
                # OnlineJobs.ph usually hosts profile pics on media.onlinejobs.ph and they aren't logos
                if src and "logo" not in src.lower() and not src.endswith(".svg"):
                    profile_pic_url = src
                    break
            
            # We will chunk the text into sections based on known OnlineJobs.ph headers
            known_headers = [
                "Overview", 
                "Member Since", 
                "Profile Description", 
                "Employer Reviews", 
                "Top Skills", 
                "Other Skills",
                "Portfolio",
                "Education",
                "Skill Summary",
                "Basic Information",
                "Tests Taken",
                "EMPLOYERS", # Start of footer usually
                "Footer"
            ]
            
            sections = {}
            current_section = "Header Info"
            sections[current_section] = []
            
            for line in raw_text.split('\n'):
                line = line.strip()
                if not line:
                    continue
                
                # Filter out junk lines
                if line in ["Update Skills", "Open menu"]:
                    continue
                
                # Check if this line is a known header (exact match or starts with)
                is_header = False
                for h in known_headers:
                    if line.upper() == h.upper() or line == h:
                        current_section = h
                        sections[current_section] = []
                        is_header = True
                        break
                
                if not is_header:
                    # Minor cleanup for overview text (join small broken lines)
                    if current_section == "Overview" and len(line) < 20:
                        if len(sections[current_section]) > 0:
                            sections[current_section][-1] += f" {line}"
                        else:
                            sections[current_section].append(line)
                    else:
                        sections[current_section].append(line)
                    
            # Clean up and format sections
            formatted_sections = {}
            for k, v in sections.items():
                if k in ["Member Since", "EMPLOYERS", "Footer"]:
                    continue # Remove these tabs completely
                if not v:
                    continue
                    
                if k in ["Top Skills", "Other Skills"]:
                    # Pass 1: Collapse '»'
                    temp = []
                    i = 0
                    while i < len(v):
                        if v[i] == "»":
                            if temp and i + 1 < len(v):
                                prev = temp.pop()
                                temp.append(f"{prev} » {v[i+1]}")
                                i += 2
                                continue
                        else:
                            temp.append(v[i])
                        i += 1
                        
                    # Pass 2: Identify Titles vs Experience vs Descriptions
                    skills_data = []
                    i = 0
                    while i < len(temp):
                        if i + 1 < len(temp) and temp[i+1].startswith("Experience:"):
                            skills_data.append({"title": temp[i], "experience": temp[i+1], "desc": []})
                            i += 2
                        else:
                            if skills_data:
                                skills_data[-1]["desc"].append(temp[i])
                            else:
                                skills_data.append({"title": temp[i], "experience": "", "desc": []})
                            i += 1
                            
                    # Pass 3: Format beautifully
                    final_skills = []
                    for s in skills_data:
                        block = f"🔹 {s['title']}"
                        if s['experience']:
                            # If it has descriptions, use ├─ for experience and └─ for the last description
                            if s['desc']:
                                block += f"\n   ├─ {s['experience']}"
                                for j, d in enumerate(s['desc']):
                                    prefix = "   └─" if j == len(s['desc']) - 1 else "   ├─"
                                    block += f"\n{prefix} {d}"
                            else:
                                block += f"\n   └─ {s['experience']}"
                        else:
                            for d in s['desc']:
                                block += f"\n   └─ {d}"
                        final_skills.append(block)
                            
                    formatted_sections[k] = "\n\n".join(final_skills)
                    
                elif k in ["Basic Information", "Tests Taken"]:
                    # Format as Key: Value table pairs
                    info_lines = []
                    i = 0
                    while i < len(v):
                        if i + 1 < len(v):
                            info_lines.append(f"• {v[i]}: {v[i+1]}")
                            i += 2
                        else:
                            info_lines.append(f"• {v[i]}")
                            i += 1
                    formatted_sections[k] = "\n".join(info_lines)
                    
                else:
                    formatted_sections[k] = "\n".join(v)
            
            # Extract name and clean up Header Info (Remove 'ID PROOF' and numbers)
            header_lines = sections.get("Header Info", [])
            header_lines = [l for l in header_lines if not (l.strip().isdigit() or "ID PROOF" in l.upper())]
            
            name = header_lines[0] if len(header_lines) > 0 else "Unknown Name"
            if "Header Info" in formatted_sections:
                formatted_sections["Header Info"] = "\n".join(header_lines)
            
            self.driver.quit()
            
            return {
                "name": name,
                "profile_pic": profile_pic_url,
                "sections": formatted_sections
            }
        except Exception as e:
            if self.driver:
                self.driver.quit()
            print(f"Error fetching profile via Selenium: {e}")
            return {"error": str(e)}

    def search_jobs(self, keyword: str, location: str = "") -> List[Dict[str, Any]]:
        self._login()
        if not self.driver:
            self._init_driver()
            
        jobs = []
        try:
            # The user requested up to 9 pages (offset 0 to 270, step 30)
            for offset in range(0, 271, 30):
                if offset == 0:
                    url = f"{self.BASE_URL}/jobseekers/jobsearch?jobkeyword={keyword}"
                else:
                    url = f"{self.BASE_URL}/jobseekers/jobsearch/{offset}?jobkeyword={keyword}"
                
                self.driver.get(url)
                time.sleep(3) # Wait for page load
                soup = BeautifulSoup(self.driver.page_source, "html.parser")
                
                job_cards = soup.find_all("div", class_="jobpost-cat-box")
                if not job_cards:
                    break # No more results found, stop paginating
                
                for card in job_cards:
                    title_elem = card.find("h4")
                    if not title_elem:
                        continue
                        
                    # Remove badges from the title text, but save the Job Type
                    job_type = ""
                    badge = title_elem.find("span", class_="badge")
                    if badge:
                        job_type = badge.get_text(strip=True)
                        badge.decompose()
                        
                    title = title_elem.get_text(strip=True)
                    
                    # The link is usually in the "See More" a-tag inside the desc div
                    job_url = ""
                    desc_div = card.find("div", class_="desc")
                    if desc_div:
                        link_elem = desc_div.find("a")
                        if link_elem and link_elem.has_attr("href"):
                            job_url = link_elem["href"]
                            # Remove "See More" from the description text
                            link_elem.decompose()
                            
                    if job_url and not job_url.startswith("http"):
                        job_url = self.BASE_URL + job_url
                    
                    description = desc_div.get_text(strip=True) if desc_div else ""
                    
                    # Extract Posted Date
                    posted_date = ""
                    date_em = card.find("em")
                    if date_em and "Posted on" in date_em.get_text():
                        posted_date = date_em.get_text(strip=True).replace("Posted on", "").strip()
                        
                    # Extract Salary
                    salary = ""
                    salary_dd = card.find("dd", class_="col")
                    if salary_dd:
                        salary = salary_dd.get_text(strip=True)
                        
                    # Extract Tags
                    skills = ""
                    tag_div = card.find("div", class_="job-tag")
                    if tag_div:
                        skill_tags = [a.get_text(strip=True) for a in tag_div.find_all("a", class_="badge")]
                        skills = ", ".join(skill_tags)
                    
                    jobs.append({
                        "title": title,
                        "company": "Confidential Employer",
                        "location": "Remote / Philippines",
                        "description": description,
                        "url": job_url,
                        "source_site": "OnlineJobsPH",
                        "salary": salary,
                        "posted_date": posted_date,
                        "job_type": job_type,
                        "skills": skills
                    })
                
            self.driver.quit()
            return jobs
            
        except Exception as e:
            if self.driver:
                self.driver.quit()
            print(f"Error scraping OnlineJobsPH with Selenium: {e}")
            return jobs

    def extract_job_details(self, job_url: str) -> Dict[str, Any]:
        if not self.driver:
            self._init_driver()
            
        try:
            self.driver.get(job_url)
            time.sleep(3)
            soup = BeautifulSoup(self.driver.page_source, "html.parser")
            
            desc_elem = soup.find(id="job-description") or soup.find(class_="job-description")
            if desc_elem:
                return {"description": desc_elem.get_text(separator="\n", strip=True)}
                
            return {}
        except Exception as e:
            print(f"Error extracting OnlineJobsPH details: {e}")
            return {}
        finally:
            if self.driver:
                self.driver.quit()
                self.driver = None
