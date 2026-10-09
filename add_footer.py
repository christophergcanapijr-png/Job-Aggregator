import os
import re

file_path = "frontend/src/App.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

old_footer = r"""      <footer className="bg-white border-t py-6 mt-auto">
        <div className="container mx-auto px-4 text-center text-slate-500 text-sm">
          &copy; \{new Date\(\)\.getFullYear\(\)\} JobAggregator\. All rights reserved\.
        </div>
      </footer>"""

new_footer = """      <footer className="bg-white border-t border-slate-100 py-8 mt-auto">
        <div className="container mx-auto px-4 flex flex-col items-center justify-center text-center gap-2">
          <div className="text-slate-500 text-sm font-medium">
            &copy; {new Date().getFullYear()} JobAggregator AI. All rights reserved.
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
            <span>Built with 💻 by</span>
            <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">Christopher Guzman Canapi Jr</span>
          </div>
        </div>
      </footer>"""

content = re.sub(old_footer, new_footer, content)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated footer")
