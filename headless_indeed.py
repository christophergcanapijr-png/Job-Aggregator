import os
file_path = 'C:/Users/USER/Documents/JobAggregator/backend/app/services/scrapers/indeed.py'
with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('def search_jobs(self, keyword: str, location: str = "") -> List[Dict[str, Any]]:\n        self._init_driver(headless=False)', 
                    'def search_jobs(self, keyword: str, location: str = "") -> List[Dict[str, Any]]:\n        self._init_driver(headless=True)')

text = text.replace('def extract_job_details(self, job_url: str) -> Dict[str, Any]:\n        self._init_driver(headless=False)', 
                    'def extract_job_details(self, job_url: str) -> Dict[str, Any]:\n        self._init_driver(headless=True)')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)
print("Updated to headless.")
