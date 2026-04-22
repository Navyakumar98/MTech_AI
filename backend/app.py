from flask import Flask, jsonify
from flask_cors import CORS

from api_blueprint import api_bp

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"])

app.register_blueprint(api_bp, url_prefix='/api')


@app.route('/')
def index():
    return jsonify({'message': 'Backend running fine!'})


if __name__ == '__main__':
    app.run(debug=True)
