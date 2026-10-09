import os

file_path = "C:/Users/USER/Documents/JobAggregator/backend/app/services/scrapers/indeed.py"
with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

code = """
    def __init__(self, username="", password=""):
        self.username = username
        self.password = password
        self.driver = None

    def _init_driver(self, headless: bool = True):
        from selenium import webdriver
        if not hasattr(self, 'driver') or not self.driver:
            options = webdriver.ChromeOptions()
            if headless:
                options.add_argument("--headless=new")
            options.add_argument("--disable-blink-features=AutomationControlled")
            options.add_experimental_option("excludeSwitches", ["enable-automation"])
            options.add_experimental_option('useAutomationExtension', False)
            self.driver = webdriver.Chrome(options=options)
            
    def _save_cookies(self):
        import pickle
        if self.driver:
            with open('indeed_cookies.pkl', 'wb') as f:
                pickle.dump(self.driver.get_cookies(), f)

    def _load_cookies(self):
        import pickle, os
        if os.path.exists('indeed_cookies.pkl') and self.driver:
            self.driver.get("https://ph.indeed.com/")
            with open('indeed_cookies.pkl', 'rb') as f:
                cookies = pickle.load(f)
                for cookie in cookies:
                    try:
                        self.driver.add_cookie(cookie)
                    except:
                        pass
"""

text = text.replace('class IndeedScraper(BaseScraper):\n    BASE_URL = "https://ph.indeed.com"', 
    'class IndeedScraper(BaseScraper):\n    BASE_URL = "https://ph.indeed.com"' + code)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)

print("Added missing methods successfully.")
