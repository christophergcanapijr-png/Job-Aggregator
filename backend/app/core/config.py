from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Job Aggregator"
    DATABASE_URL: str = "sqlite:///./jobaggregator.db"
    
    class Config:
        env_file = ".env"

settings = Settings()
