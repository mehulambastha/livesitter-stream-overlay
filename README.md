# Livesitter Task: RTSP-to-HLS Streaming Web App (React + Flask)

This project is a web application built using React for the frontend and Flask for the backend. The primary feature of the app is to convert RTSP streams to HLS format using ffmpeg, allowing for real-time video streaming. The frontend allows users to manage video overlays, including text and image overlays, which are stored in a MongoDB database.
Table of Contents

1. Overview
2. Project Setup
3. Environment Variables
4. Client (React) Setup
4. Backend (Flask) Setup
5. Functionalities
6. RTSP and HLS Streaming
7. Scaling the Application
8. Screenshots

Overview

This project allows users to enter an RTSP stream URL and convert it into an HLS stream using Flask and ffmpeg. Additionally, users can create overlays (text or image) that are rendered on the video, and these overlays are stored and managed via MongoDB.

The app is structured in two parts:

    Client (React): The user-facing part of the application where overlays can be added and RTSP streams are managed.
    Backend (Flask): Handles the RTSP stream conversion, overlay CRUD operations, and communicates with MongoDB for data storage.

Project Setup
Prerequisites

    Node.js (for React frontend)
    Python 3.10 or higher (for Flask backend)
    MongoDB (or MongoDB Atlas)
    ffmpeg installed for RTSP to HLS conversion

Clone the repository

```bash

git clone https://github.com/your_username/your_project.git
cd your_project
```

Environment Variables

Both the React and Flask parts of the project rely on environment variables for configuration. You will find .env.example files in the root of each project (client and server). Copy these files and create actual .env files with appropriate values.

```bash

cp .env.example .env
```

Client Environment Variables (client/.env)

    REACT_APP_BACKEND_URL - The URL where the Flask backend is hosted.
    REACT_APP_API_KEY - If your project requires any API keys for external services.
    

Backend Environment Variables (server/.env)

    
    MONGO_URI - The connection string for your MongoDB instance.
    SECRET_KEY - A secret key for Flask session management.
    FFMPEG_PATH - The path to the ffmpeg binary on your system (if not globally installed).
  

Ensure all variables are set properly before running the application.
Client (React) Setup

### Navigate to the client/ directory.
Install dependencies:

```bash

cd client
npm install
```

### Start the development server:

```bash

npm run start
```

Your React app should now be running at http://localhost:3000.

## Backend (Flask) Setup

### Navigate to the server/ directory.
Create a Python virtual environment to isolate dependencies:

```bash

cd server
python3 -m venv venv
source venv/bin/activate
```

### Install the dependencies listed in requirements.txt:

```bash

pip install -r requirements.txt
```

Make sure ffmpeg is installed on your system, and that you have provided the correct MongoDB URI in your .env file.

### Start the Flask app:

``` bash

python3 run.py
```

The Flask app should now be running at http://localhost:5000.
Functionalities
1. RTSP to HLS Stream Conversion

    Users can input an RTSP URL via the frontend.
    The backend uses ffmpeg to convert the RTSP stream into HLS format.
    The Flask API serves the HLS files, allowing them to be played in the React app using ReactPlayer.

2. Overlay Management

    Users can create, edit, and delete text or image overlays.
    Overlays are stored in MongoDB with fields like uuid, type, name, content, and parameters (such as width, height, x, and y coordinates).
    Text overlays allow users to input dynamic text, while image overlays let users upload image files.

3. MongoDB Integration

    The backend connects to MongoDB to store overlay data.
    The React app fetches this overlay data and displays it in real time on the video stream.

4. REST API

    The backend exposes several API routes to interact with overlays, manage RTSP streams, and serve HLS video files.
    Example: POST /api/overlays to create new overlays, GET /api/overlays to fetch all overlays.

RTSP and HLS Streaming

RTSP (Real-Time Streaming Protocol) is a network protocol designed for video streaming. However, most browsers do not natively support RTSP streams. To solve this, we convert RTSP streams into HLS (HTTP Live Streaming) format using ffmpeg. HLS is widely supported by modern browsers, making it easier to stream live video.

The conversion is handled by the following command in the Flask backend:

```python

ffmpeg_command = f'ffmpeg -i {rtsp_url} -c:v copy -hls_time 2 -hls_list_size 5 -f hls {output_path+fileName}'
subprocess.Popen(ffmpeg_command, shell=True)
```
This command converts the RTSP stream into HLS segments, which are then served to the frontend.
Scaling the Application
Deploying on EC2 (Debian 12)

To scale this application and deploy it in the cloud, I'm thinking of using an Amazon EC2 instance. Here's a brief walk-through for deployment:

Launch an EC2 instance:
    Choose Debian 12 as the AMI.
    Select an appropriate instance type (e.g., t2.micro for low-traffic environments).
    Set up security groups to allow traffic on ports 3000 (React) and 5000 (Flask).

Install necessary packages on your EC2 instance:

    ```bash

    sudo apt update
    sudo apt install -y python3 python3-pip nodejs npm mongodb ffmpeg
    ```

Clone this project onto the EC2 instance:

```bash

  git clone https://github.com/mehulambastha/livesitter-stream-overlay.git
```

Set up the environment:

Copy the .env files and update them with the appropriate configuration for the EC2 environment.

Start the React and Flask apps:

  For Flask, activate the virtual environment and start the Flask server.
  For React, build the production version of your app:

```bash

  cd client
  npm install
  npm run build
```

Serving the React app:

I am profcient in using  reverse proxy like Nginx to serve the production build of appm and will do so for this also.

### Handling MongoDB:

can either install MongoDB on your EC2 instance or connect to MongoDB Atlas for a cloud-based database.

### Configure and Start Services:

I will then use systemd to manage the Flask application.
