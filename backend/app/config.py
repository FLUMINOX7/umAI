import os


def build_database_uri() -> str:
    database_url = os.getenv("DATABASE_URL")
    if database_url:
        return database_url

    postgres_host = os.getenv("POSTGRES_HOST")
    postgres_name = os.getenv("POSTGRES_DB")
    postgres_user = os.getenv("POSTGRES_USER")
    postgres_password = os.getenv("POSTGRES_PASSWORD")
    postgres_port = os.getenv("POSTGRES_PORT", "5432")

    if all([postgres_host, postgres_name, postgres_user, postgres_password]):
        return (
            f"postgresql+psycopg://{postgres_user}:{postgres_password}"
            f"@{postgres_host}:{postgres_port}/{postgres_name}"
        )

    return "sqlite:///umai.db"


class BaseConfig:
    SECRET_KEY = os.getenv("SECRET_KEY", "change-me")
    SQLALCHEMY_TRACK_MODIFICATIONS = False


def get_config() -> type[BaseConfig]:
    return BaseConfig
