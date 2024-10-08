from flask import Flask
from flask_cors import CORS
from flask_restx import Api
# Import error handling for MongoDB
from pymongo.errors import ServerSelectionTimeoutError
from .extensions import mongo


def create_app():
    app = Flask(__name__)
    CORS(app)
    app.config["MONGO_URI"] = "mongodb+srv://mehul213amb:mongoosemehulgoose@cluster0.emrth.mongodb.net/overlays?retryWrites=true&w=majority&appName=Cluster0"

    mongo.init_app(app)

    try:
        # Attempt to connect to the database
        with app.app_context():
            # A simple call to MongoDB to test connection
            mongo.cx.server_info()  # Raises error if MongoDB is not connected
            print("MongoDB connected successfully!")
    except ServerSelectionTimeoutError as err:
        # Handle the error if the connection fails
        print(f"Error: Could not connect to MongoDB. {err}")
        raise Exception("MongoDB connection failed") from err
    # Attach mongo instance to the app for later use in routes
    app.mongo = mongo

    api = Api(app, version='1.0', title='Overlay API',
              description='API for managing overlays', doc='/swagger/')

    from .routes import main  # Import your Namespace
    api.add_namespace(main, path="/api")

    return app
