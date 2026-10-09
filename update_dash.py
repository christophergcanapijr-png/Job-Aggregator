import os

file_path = "C:/Users/USER/Documents/JobAggregator/frontend/src/Dashboard.tsx"
with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace(
    "const [scrapeTargets, setScrapeTargets] = useState({ OnlineJobsPH: true, JobStreet: false });",
    "const [scrapeTargets, setScrapeTargets] = useState({ OnlineJobsPH: true, JobStreet: false, Indeed: false });"
)

checkbox_target = """                JobStreet
              </label>
            </div>
          </div>"""

checkbox_replacement = """                JobStreet
              </label>
            </div>
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" 
                  checked={scrapeTargets.Indeed}
                  onChange={(e) => setScrapeTargets({ ...scrapeTargets, Indeed: e.target.checked })}
                />
                Indeed
              </label>
            </div>
          </div>"""

text = text.replace(checkbox_target, checkbox_replacement)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)

print("Updated Dashboard.tsx successfully.")
