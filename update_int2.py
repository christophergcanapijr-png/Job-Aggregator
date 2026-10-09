import os

file_path = "C:/Users/USER/Documents/JobAggregator/frontend/src/Integrations.tsx"
with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# Replace the password label logic
text = text.replace(
    "Password {formData.platform === 'JobStreet' && <span className=\"text-gray-400 font-normal\">(Not required for OTP)</span>}</label>",
    "Password {(formData.platform === 'JobStreet' || formData.platform === 'Indeed') && <span className=\"text-gray-400 font-normal\">(Not required for OTP)</span>}</label>"
)

# Replace the handleRefresh logic
target_refresh = """        alert('JobStreet cookies saved securely! Headless scraping is now enabled.');
      }
    } catch (error) {"""

replacement_refresh = """        alert('JobStreet cookies saved securely! Headless scraping is now enabled.');
      } else if (platform === 'Indeed') {
        alert(`A browser window will pop up. Please click "Sign In" on Indeed and log in using your email OTP. The system will automatically detect when you finish.`);
        await axios.get('http://localhost:8000/api/profile/indeed', { timeout: 90000 });
        alert('Indeed cookies saved securely! Search is now authenticated.');
      }
    } catch (error) {"""

text = text.replace(target_refresh, replacement_refresh)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)

print("Updated Integrations.tsx successfully.")
