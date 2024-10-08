from werkzeug.utils import secure_filename
import os
from flask import Blueprint, send_from_directory, send_file, jsonify, request, current_app
import subprocess
from flask_restx import Namespace, Resource, fields
from .extensions import mongo
import logging
import json
output_path = '/home/mehul/Documents/rtsp/'

# Define the API namespace
main = Namespace('overlays', description='Overlay related operations')


def allowed_file(filename):
    # Define a set of allowed file extensions
    allowed_extensions = {'png', 'jpg', 'jpeg', 'gif'}
    # Check if the filename has an extension and if it's in the allowed list
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions


# Define the data model for Swagger documentation
overlay_parameters_model = main.model('OverlayParameters', {
    'id': fields.Integer(required=True, description='Parameter ID'),
    'width': fields.Float(required=True, description='Width of the overlay'),
    'height': fields.Float(required=True, description='Height of the overlay'),
    'x': fields.Float(required=True, description='X coordinate of the overlay'),
    'y': fields.Float(required=True, description='Y coordinate of the overlay'),
})

overlay_model = main.model('Overlay', {
    'uuid': fields.String(required=True, description='UUID of the overlay'),
    'type': fields.String(required=True, description='Type of the overlay'),
    'name': fields.String(required=True, description='Name of the overlay'),
    'imageSrc': fields.String(required=False, description='URL of the image for preview in frontend'),
    # Use Raw for file data
    'imageFile': fields.Raw(required=False, description='Actual image file to be uploaded'),
    'content': fields.String(required=False, description='Content of the overlay (if applicable)'),
    'parameters': fields.Nested(overlay_parameters_model, description='Parameters of the overlay'),
})


# Collection

# GET all overlays


@main.route('/overlays')
class OverlayList(Resource):
    @main.doc('list_overlays')
    @main.marshal_list_with(overlay_model)
    def get(self):
        """List all overlays"""
        logging.info(current_app)
        overlays_collection = mongo.db.overlays  # Use mongo directly
        overlays = list(overlays_collection.find())
        for overlay in overlays:
            overlay['_id'] = str(overlay['_id'])  # Convert ObjectId to string
        return overlays, 200

    @main.doc('create_overlay')
    @main.expect([overlay_model])  # Expect a list of overlays
    def post(self):
        """Create or update overlays (bulk creation or update)"""
        overlays_collection = current_app.mongo.db.overlays
        data = request.form.getlist('overlays')
        files = request.files.getlist('imageFiles')

        if not isinstance(data, list):
            return {"error": "Data should be a list of overlays"}, 400

        inserted_ids = []
        modified_ids = []

        for i, overlay_str in enumerate(data):
            overlay = json.loads(overlay_str)
            # Get corresponding image file if exists
            image_file = files[i] if i < len(files) else None
            existing_overlay = overlays_collection.find_one(
                {"uuid": overlay['uuid']})

            # Check if overlay already exists
            if existing_overlay:
                # Compare incoming data with existing data to check for modifications
                modified = False

                # Check if image is modified or needs to be handled
                if image_file and allowed_file(image_file.filename):
                    filename = secure_filename(image_file.filename)
                    filepath = os.path.join("/home/mehul/Videos/", filename)
                    image_file.save(filepath)
                    overlay['content'] = filepath
                    if overlay['content'] != existing_overlay.get('content'):
                        modified = True  # Image has been changed

            # Compare other fields for modification
                for key in overlay:
                    if overlay[key] != existing_overlay.get(key):
                        modified = True

                if modified:
                    # Update the existing overlay if modified
                    overlays_collection.update_one(
                        {"uuid": overlay['uuid']},
                        {"$set": overlay}
                    )
                    modified_ids.append(overlay['uuid'])

            else:
                # Handle image upload for new overlays
                if image_file and allowed_file(image_file.filename):
                    filename = secure_filename(image_file.filename)
                    filepath = os.path.join("/home/mehul/Videos", filename)
                    image_file.save(filepath)
                    overlay['content'] = filepath

                # Insert the new overlay if it doesn't exist
                result = overlays_collection.insert_one(overlay)
                inserted_ids.append(str(result.inserted_id))

        return {
            "inserted_ids": inserted_ids,
            "modified_ids": modified_ids
        }, 201

# PUT - :update an overlay


@main.route('/overlays/<string:overlay_id>')
@main.response(404, 'Overlay not found')
@main.param('overlay_id', 'The overlay identifier')
class Overlay(Resource):
    @main.doc('get_overlay')
    @main.marshal_with(overlay_model)
    def get(self, overlay_id):
        """Get a single overlay"""
        overlays_collection = mongo.db.overlays
        overlay = overlays_collection.find_one({"id": overlay_id})
        if not overlay:
            main.abort(404, "Overlay not found")
        overlay['_id'] = str(overlay['_id'])
        return overlay

    @main.doc('update_overlay')
    @main.expect(overlay_model)
    def put(self, overlay_id):
        """Update an existing overlay"""
        overlays_collection = mongo.db.overlays
        data = request.json
        result = overlays_collection.update_one(
            {"id": overlay_id}, {"$set": data})
        if result.matched_count == 0:
            return {"error": "Overlay not found"}, 404
        return {"message": "Overlay updated successfully"}, 200

    @main.doc('delete_overlay')
    @main.response(200, 'Overlay deleted successfully')
    @main.response(404, 'Overlay not found')
    def delete(self, overlay_id):
        """Delete an overlay by its UUID."""
        overlays_collection = current_app.mongo.db.overlays

        # Find and delete the overlay by ID
        result = overlays_collection.delete_one({"uuid": overlay_id})
        if result.deleted_count == 1:
            return {"message": f"Overlay {overlay_id} deleted successfully."}, 200
        else:
            return {"error": "Overlay not found."}, 404


rtsp_model = main.model('RTSPModel', {
    'rtsp_url': fields.String(required=True, description='RTSP stream URL'),
})

# POST /api/start-stream route


@main.route('/start-stream')
class StartStream(Resource):
    @main.doc('start_stream')
    @main.expect(rtsp_model)
    def post(self):
        """Start an RTSP stream"""
        rtsp_url = request.json.get('rtsp_url')
        if not rtsp_url:
            return jsonify({'error': 'RTSP URL REQUIRED'}), 400

        fileName = "output.m3u8"
        output_path = '/home/mehul/Documents/rtsp/'
        # Run ffmpeg to start the stream
        ffmpeg_command = f'ffmpeg -i {
            rtsp_url} -c:v copy -hls_time 2 -hls_list_size 5 -f hls {output_path+fileName}'
        subprocess.Popen(ffmpeg_command, shell=True)

        return {'message': 'Stream Started', 'hls_url': '/api/stream/output.m3u8'}, 200


# GET /api/stream/<filename> route
@main.route('/stream/<path:filename>')
@main.param('filename', 'The HLS stream file name')
class Stream(Resource):
    @main.doc('get_stream')
    def get(self, filename):
        """Serve HLS stream files"""
        output_path = '/home/mehul/Documents/rtsp/'
        return send_from_directory(output_path, filename)


# GET /api/data route
@main.route('/data')
class GetData(Resource):
    @main.doc('get_data')
    def get(self):
        """Get API response"""
        return {'message': 'API Response'}, 200
