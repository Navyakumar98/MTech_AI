import os

from flask import Flask, jsonify
from flask_cors import CORS

from api_blueprint import api_bp

app = Flask(__name__)

app_env = os.environ.get("APP_ENV", "local").lower()
is_production = app_env == "production"

# Local: allow localhost UI by default.
# Production: allow explicit origins from env (FRONTEND_ORIGINS, comma-separated).
if is_production:
    frontend_origins = os.environ.get("FRONTEND_ORIGINS", "").strip()
    cors_origins = [origin.strip() for origin in frontend_origins.split(",") if origin.strip()]
    if not cors_origins:
        cors_origins = ["*"]
else:
    cors_origins = [os.environ.get("FRONTEND_ORIGIN", "http://localhost:3000")]

CORS(app, origins=cors_origins)

app.register_blueprint(api_bp, url_prefix='/api')


@app.route('/')
def index():
    return jsonify({'message': 'Backend running fine!'})


if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    host = "0.0.0.0" if is_production else "127.0.0.1"
    app.run(host=host, port=port, debug=not is_production)
