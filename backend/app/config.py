from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///var/lib/component-storage/app.db"
    API_PREFIX: str = "/api"

    class Config:
        env_file = "/etc/component-storage/.env"
        extra = "ignore"


settings = Settings()
