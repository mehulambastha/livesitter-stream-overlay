from flask import Blueprint, send_from_directory, send_file, jsonify, request
import subprocess

main = Blueprint('main', __name__)

# api end point for sreaming

output_path = '/home/mehul/Documents/rtsp/'


@main.route('/api/start-stream', methods=['POST'])
def start_stream():

    rtsp_url = request.json.get('rtsp_url')
    if not rtsp_url:
        return jsonify({'error': 'RTSP URL REQUIRED'}), 400

    fileName = "output.m3u8"
    # output fpr hls start_stream
    ffmpeg_command = f'ffmpeg -i {
        rtsp_url} -c:v copy -hls_time 2 -hls_list_size 5 -f hls {output_path+fileName}'

    subprocess.Popen(ffmpeg_command, shell=True)

    return jsonify(
        {'message':  'Stream Started', 'hls url': '/api/stream.m3u8'}
    )


@main.route('/api/stream/<path:filename>')
def stream(filename):
    return send_from_directory(output_path, filename)


@main.route('/api/data', methods=['GET'])
def get_data():
    return jsonify({'message': 'API Response'})
