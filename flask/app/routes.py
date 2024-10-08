from flask import Blueprint, send_from_directory, send_file, jsonify, request, current_app
import subprocess
from flask_restx import Namespace, Resource, fields
import uuid
from .extensions import mongo
import logging
output_path = '/home/mehul/Documents/rtsp/'

# Define the API namespace
main = Namespace('overlays', description='Overlay related operations')

# Define the data model for Swagger documentation
overlay_parameters_model = main.model('OverlayParameters', {
    'id': fields.Integer(required=True, description='Parameter ID'),
    'width': fields.Float(required=True, description='Width of the overlay'),
    'height': fields.Float(required=True, description='Height of the overlay'),
    'x': fields.Float(required=True, description='X coordinate of the overlay'),
    'y': fields.Float(required=True, description='Y coordinate of the overlay'),
})

overlay_model = main.model('Overlay', {
    'id': fields.String(description='UUID of the overlay'),
    'type': fields.String(required=True, description='Type of the overlay'),
    'name': fields.String(required=True, description='Name of the overlay'),
    'content': fields.String(required=True, description='Content of the overlay'),
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
        """Create new overlays (bulk creation)"""
        overlays_collection = current_app.mongo.db.overlays
        data = request.json  # This is a list of overlays

        if not isinstance(data, list):
            return {"error": "Data should be a list of overlays"}, 400

        inserted_ids = []

        for overlay in data:
            existing_overlay = overlays_collection.find_one(
                {"id": overlay["id"]})

            if existing_overlay:
                # Compare existing overlay with the incoming one
                if existing_overlay != overlay:
                    # Update the existing overlay if there are changes
                    overlays_collection.update_one(
                        {"id": overlay["id"]}, {"$set": overlay})
            else:
                # Generate a new UUID for the overlay if it doesn't exist
                overlay['id'] = str(uuid.uuid4())
                overlays_collection.insert_one(overlay)  # Insert new overlay
                # Keep track of inserted IDs
                inserted_ids.append(overlay['id'])

        return {"inserted_ids": inserted_ids}, 201

# PUT - update an overlay


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
        result = overlays_collection.delete_one({"id": overlay_id})
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

        return jsonify({'message': 'Stream Started', 'hls_url': '/api/stream/output.m3u8'}), 200


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
        return jsonify({'message': 'API Response'}), 200
