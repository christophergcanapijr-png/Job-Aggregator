import pickle
from curl_cffi import requests
from bs4 import BeautifulSoup

def test_indeed_cookies():
    url = "https://ph.indeed.com/jobs?q=developer&l=&sort=date"
    session = requests.Session(impersonate="chrome116")
    
    try:
        with open("backend/indeed_cookies.pkl", "rb") as f:
            cookies = pickle.load(f)
            for c in cookies:
                session.cookies.set(c['name'], c['value'], domain=c['domain'])
    except Exception as e:
        print("Could not load cookies:", e)
        
    response = session.get(url)
    print("Status:", response.status_code)
    
    soup = BeautifulSoup(response.text, "html.parser")
    jobs = soup.find_all("div", class_="job_seen_beacon")
    print("Found jobs:", len(jobs))

if __name__ == "__main__":
    test_indeed_cookies()
