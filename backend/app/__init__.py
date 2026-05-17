import os

from flask import Flask
from dotenv import load_dotenv

from .api.v1 import api_v1
from .config import build_database_uri, get_config
from .extensions import db, jwt, migrate


_dotenv_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".env"))
load_dotenv(_dotenv_path)


def create_app() -> Flask:
    app = Flask(__name__)
    app.config.from_object(get_config())
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", app.config.get("SECRET_KEY", "change-me"))
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", app.config["SECRET_KEY"])
    app.config["SQLALCHEMY_DATABASE_URI"] = build_database_uri()

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)

    app.register_blueprint(api_v1, url_prefix="/api/v1")

    return app
