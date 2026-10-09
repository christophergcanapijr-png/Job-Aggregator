from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import engine, Base
from app.api import jobs, accounts, resume, ai
from app.models.connected_account import ConnectedAccount

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Job Aggregator API", description="API for Job Aggregator and Tracking App")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(jobs.router, prefix="/api")
app.include_router(accounts.router, prefix="/api")
app.include_router(resume.router, prefix="/api")
app.include_router(ai.router, prefix="/api")
@app.get("/")
def read_root():
    return {"message": "Welcome to Job Aggregator API"}

@app.get("/health")
def health_check():
    return {"status": "ok"}
