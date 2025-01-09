
#!/usr/bin/python3
""" Flask Application """
from models import storage
from api.v1.views import app_views
from api.v1.views.extensions import limiter
from datetime import timedelta
from os import getenv
from flask import Flask, render_template, make_response, jsonify, request
from flask_cors import CORS
from flasgger import Swagger
from flasgger.utils import swag_from
from flask_jwt_extended import JWTManager, verify_jwt_in_request
from dotenv import load_dotenv
from pathlib import Path
env_path = Path('/CarBnR_v4/.env')  # Update the path accordingly
load_dotenv(dotenv_path=env_path)

app = Flask(__name__)
limiter.init_app(app)
app.config['JSONIFY_PRETTYPRINT_REGULAR'] = True
app.register_blueprint(app_views)
cors = CORS(app, resources={r"/api/v1/*": {"origins": "*"}})
app.config['JWT_SECRET_KEY'] = getenv('JWT_SECRET_KEY')
app.config["JWT_COOKIE_CSRF_PROTECT"] = True  # Ensures CSRF tokens are issued and validated
app.config["JWT_TOKEN_LOCATION"] = ["cookies"]  # Use cookies for tokens
app.config["JWT_ACCESS_CSRF_HEADER_NAME"] = "X-CSRF-TOKEN"  # CSRF header name
app.config['JWT_REFRESH_TOKEN_EXPIRES'] = timedelta(days=30)  # 30 days
jwt = JWTManager(app)


@app.before_request
def authenticate_all_requests():
    if request.endpoint in ['app_views.login', 'app_views.post_user']:
        return
    try:
        verify_jwt_in_request(locations=["cookies"])
    except Exception as e:
        return jsonify({'error': 'Unauthorized access', 'message': str(e)}), 401


@app.teardown_appcontext
def close_db(error):
    """ Close Storage """
    storage.close()


@app.errorhandler(404)
def not_found(error):
    """ 404 Error
    ---
    responses:
      404:
        description: a resource was not found
    """
    return make_response(jsonify({'error': "Not found"}), 404)


app.config['SWAGGER'] = {
    'title': 'CarBnR Restful API',
    'uiversion': 3
}

Swagger(app)


if __name__ == "__main__":
    """ Main Function """
    host = getenv('CARBNR_API_HOST')
    port = getenv('CARBNR_API_PORT')
    if not host:
        host = '0.0.0.0'
    if not port:
        port = '5001'
    app.run(host=host, port=port, threaded=True)
