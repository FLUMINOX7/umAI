import os

from flask import Flask
from flask import jsonify, send_file
from dotenv import load_dotenv

from .api import api_bp
from .config import build_database_uri, get_config
from .extensions import db, jwt, migrate


_dotenv_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".env"))
load_dotenv(_dotenv_path)


def create_app() -> Flask:
    app = Flask(__name__)
    app.config.from_object(get_config())
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", app.config.get("SECRET_KEY", "change-me"))
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", app.config["SECRET_KEY"])

    # users, conversations et messages
    app.config["SQLALCHEMY_DATABASE_URI"] = build_database_uri()

    # documents et doc_chunks
    app.config["SQLALCHEMY_BINDS"] = {
        "docs": build_documents_database_uri()
    }

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)

    try:
        from flask_swagger_ui import get_swaggerui_blueprint

        swaggerui_blueprint = get_swaggerui_blueprint(
            "/apidocs",
            "/openapi.json",
            config={"app_name": "umAI API"},
        )
        app.register_blueprint(swaggerui_blueprint, url_prefix="/apidocs")
    except Exception:
        pass

    @app.get("/openapi.json")
    def openapi_spec():
        spec_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "openapi.json"))
        return send_file(spec_path, mimetype="application/json")

    app.register_blueprint(api_bp, url_prefix="/api")

    return app
