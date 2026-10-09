import os

file_path = "C:/Users/USER/Documents/JobAggregator/backend/app/services/scrapers/indeed.py"
with open(file_path, 'a', encoding='utf-8') as f:
    f.write('''
    def interactive_login(self):
        self._init_driver(headless=False)
        self.driver.get("https://ph.indeed.com/")
        try:
            WebDriverWait(self.driver, 30).until(
                lambda d: "auth.indeed.com" in d.current_url.lower() or "secure.indeed.com" in d.current_url.lower() or "signin" in d.current_url.lower()
            )
            WebDriverWait(self.driver, 60).until(
                lambda d: "auth.indeed.com" not in d.current_url.lower() and "secure.indeed.com" not in d.current_url.lower() and "signin" not in d.current_url.lower()
            )
            time.sleep(3)
        except:
            time.sleep(10)
        
        self._save_cookies()
        if self.driver:
            self.driver.quit()
            self.driver = None
            
        return {"status": "success"}
''')
print("Appended successfully.")
