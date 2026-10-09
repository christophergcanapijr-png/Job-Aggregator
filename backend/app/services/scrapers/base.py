from abc import ABC, abstractmethod
from typing import List, Dict, Any

class BaseScraper(ABC):
    @abstractmethod
    def search_jobs(self, keyword: str, location: str) -> List[Dict[str, Any]]:
        """Search for jobs on the target site."""
        pass

    @abstractmethod
    def extract_job_details(self, job_url: str) -> Dict[str, Any]:
        """Extract detailed information from a specific job posting."""
        pass
