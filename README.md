# Job Aggregator

A complete web application to aggregate job postings from sites like OnlineJobPH, Indeed, and JobStreet, track applications, and extract data from resumes.

## Project Structure
- `backend/`: FastAPI backend for scraping, API endpoints, and database interactions.
- `frontend/`: React frontend for user interaction and dashboard visualization.
- `docker-compose.yml`: Local infrastructure including PostgreSQL DB.
- `init.ps1`: Setup script for Windows.

## Getting Started

1. Run the initialization script to set up virtual environments and install dependencies:
   ```powershell
   .\init.ps1
   ```
2. Run the Backend (SQLite database will be created automatically):
   ```powershell
   cd backend
   .\venv\Scripts\activate
   uvicorn app.main:app --reload
   ```
3. Run the Frontend:
   ```powershell
   cd frontend
   npm start
   ```
