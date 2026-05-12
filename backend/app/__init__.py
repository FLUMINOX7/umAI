from flask import Flask

from .api.v1 import api_v1
from .config import build_database_uri, get_config
from .extensions import db, migrate


def create_app() -> Flask:
    app = Flask(__name__)
    app.config.from_object(get_config())
    app.config["SQLALCHEMY_DATABASE_URI"] = build_database_uri()

    db.init_app(app)
    migrate.init_app(app, db)

    app.register_blueprint(api_v1, url_prefix="/api/v1")

    return app
