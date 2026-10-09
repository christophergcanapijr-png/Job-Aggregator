import requests
import xml.etree.ElementTree as ET

def test_indeed_rss():
    url = "https://ph.indeed.com/rss?q=developer&l=&sort=date"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36"
    }
    response = requests.get(url, headers=headers)
    print("Status:", response.status_code)
    
    if response.status_code == 200:
        with open("indeed_rss.xml", "w", encoding="utf-8") as f:
            f.write(response.text)
        
        try:
            root = ET.fromstring(response.content)
            items = root.findall('.//item')
            print("Found items:", len(items))
            if items:
                print("First title:", items[0].find('title').text)
                print("First link:", items[0].find('link').text)
        except Exception as e:
            print("Error parsing XML:", e)

if __name__ == "__main__":
    test_indeed_rss()
