import os
import re

from flask import Flask, jsonify
from flask_cors import CORS

from api_blueprint import api_bp

app = Flask(__name__)

# app_env = os.environ.get("APP_ENV", "local").lower()
app_env = os.environ.get("APP_ENV", "production").lower()
is_production = app_env == "production"


def _build_cors_origins():
    """
    Build the list of allowed CORS origins / regexes.

    - Always allow localhost dev URLs.
    - Allow any explicit origins from FRONTEND_ORIGINS (comma-separated).
    - Always allow Vercel preview + production subdomains (*.vercel.app),
      because Vercel previews get a unique URL per deploy.
    - As a last resort, if FRONTEND_ORIGINS is empty AND no rules match,
      fall back to '*' so the API still works.
    """
    origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        re.compile(r"^https://([a-z0-9-]+\.)*vercel\.app$"),
    ]

    raw = os.environ.get("FRONTEND_ORIGINS", "").strip()
    explicit = [o.strip() for o in raw.split(",") if o.strip()]
    origins.extend(explicit)

    single = os.environ.get("FRONTEND_ORIGIN", "").strip()
    if single and single not in origins:
        origins.append(single)

    return origins


_CORS_ORIGINS = _build_cors_origins()
print(f"[app] CORS allowed origins: {_CORS_ORIGINS}", flush=True)


CORS(
    app,
    resources={r"/api/*": {"origins": _CORS_ORIGINS}},
    supports_credentials=False,
    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
    max_age=86400,
)

app.register_blueprint(api_bp, url_prefix='/api')


@app.route('/')
def index():
    return jsonify({'message': 'Backend running fine!'})


@app.route('/healthz')
def healthz():
    return jsonify({'status': 'ok'}), 200


if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    host = "0.0.0.0" if is_production else "127.0.0.1"
    app.run(host=host, port=port, debug=not is_production)
