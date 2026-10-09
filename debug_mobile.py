import requests
from bs4 import BeautifulSoup

def test_mobile():
    url = "https://ph.indeed.com/jobs?q=python&l=&sort=date"
    headers = {
        "User-Agent": "Mozilla/5.0 (Linux; Android 10; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.162 Mobile Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Referer": "https://ph.indeed.com/",
    }
    resp = requests.get(url, headers=headers)
    print("Status:", resp.status_code)
    print("Title:", BeautifulSoup(resp.text, 'html.parser').title.string if BeautifulSoup(resp.text, 'html.parser').title else None)
    
if __name__ == "__main__":
    test_mobile()
