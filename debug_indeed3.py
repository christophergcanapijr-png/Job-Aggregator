import time
import undetected_chromedriver as uc

def run():
    options = uc.ChromeOptions()
    # options.add_argument("--headless=new") # No headless
    driver = uc.Chrome(options=options)
    print("Fetching indeed...")
    driver.get("https://ph.indeed.com/jobs?q=developer&l=&sort=date")
    time.sleep(5)
    
    with open("indeed_debug.html", "w", encoding="utf-8") as f:
        f.write(driver.page_source)
        
    driver.quit()
    print("Done writing indeed_debug.html")

if __name__ == "__main__":
    run()
