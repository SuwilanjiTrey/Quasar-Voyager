import os
import subprocess
from threading import Thread
import time
import requests
import sys
from flask_cors import CORS

from flask import Flask, render_template, redirect, request , jsonify
import webbrowser

app = Flask(__name__)

CORS(app)  # Enable CORS for all routes

@app.route('/exit', methods=['OPTIONS', 'POST'])
def exit():
    if request.method == 'POST':
        # Handle the POST request to shut down the server
        shutdown_server()
        return 'Server shutting down...'
    else:
        # Respond to the OPTIONS request with appropriate CORS headers
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'POST')
        return response

def shutdown_server():
     # Send a request to the Flask server to trigger the shutdown endpoint
    requests.post('http://localhost:5000/shutdown')
    print('Server shutting down...')
    # For demonstration purposes, you can just exit the script
    os._exit(0)


# Status variables
build_status = "Idle"
server_url = 'http://localhost:8080'
redirecting = False
server_active = True  # Flag to control server activity

@app.route('/')
def index():
    global build_status, server_url, redirecting
    if redirecting:
        return redirect(server_url)
    return render_template('status.html', build_status=build_status, server_url=server_url)

@app.route('/shutdown', methods=['POST'])
def shutdown():
    global server_active
    server_active = False
    return 'Server is now dormant...'

@app.route('/activate', methods=['POST'])
def activate():
    global server_active
    server_active = True
    return 'Server is now active...'



def run_build_processes(build_path):
    global build_status, server_url, redirecting, server_active
    os.chdir(build_path)
    gradle_run_command = "gradle run"
    py_command = "python thumb.py"
    node_command = "nodemon app.js"

    try:
        # Step 1: Run Python script
        build_status = "Running Python script..."
        py_process = subprocess.Popen(py_command, shell=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, universal_newlines=True)
        for line in iter(py_process.stdout.readline, ''):
            print(line.strip())
        py_process.stdout.close()
        py_process.wait()

        # Step 2: Run Node.js server
        build_status = "Starting Node.js server..."
        node_process = subprocess.Popen(node_command, shell=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, universal_newlines=True)
        Thread(target=monitor_node_output, args=(node_process,)).start()

        # Step 3: Run Gradle server and check for ":app:run" task
        build_status = "Starting Gradle server..."
        gradle_run_process = subprocess.Popen(gradle_run_command, shell=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, universal_newlines=True)
        for line in iter(gradle_run_process.stdout.readline, ''):
            print(line.strip())
            if "> Task :app:run" in line:  # Specific server start confirmation message
                build_status = "Gradle server starting..."
                server_url = 'http://localhost:8080'
                break
        gradle_run_process.stdout.close()

        # Step 4: Periodically check if the Kotlin server is online
        def check_server_and_stop_flask():
            global build_status, redirecting, server_active
            while True:
                if not server_active:
                    break
                try:
                    response = requests.get(server_url)
                    if response.status_code == 200:
                        build_status = "Kotlin server is online. Redirecting..."
                        #print(f"{server_url} is online. Reloading to {server_url} and stopping Flask server...")
                        redirecting = True
                        #shutdown_flask()
                        #break
                except requests.ConnectionError:
                    pass
                time.sleep(5)  # Check every 5 seconds

        Thread(target=check_server_and_stop_flask).start()

        gradle_run_process.wait()

    except Exception as ex:
        build_status = f"Error during process execution: {ex}"

def monitor_node_output(process):
    global build_status
    try:
        for line in iter(process.stdout.readline, ''):
            print(line.strip())
            if "server now running on port 3000" in line:
                build_status = "Node.js server now running on port 3000"
        process.stdout.close()
    except Exception as e:
        print(f"Error reading Node.js output: {e}")

def build_project():
    build_path = select_build_directory()
    if build_path:
        build_status = "Build process started..."
        webbrowser.open('http://localhost:5000')
        Thread(target=run_build_processes, args=(build_path,)).start()

def select_build_directory():
    current_directory = os.path.dirname(os.path.abspath(__file__))
    build_directory = os.path.join(current_directory, "Quasar app/app")
    return build_directory

def shutdown_flask():
    requests.post('http://localhost:5000/shutdown')



# Start the build process
build_project()

# Start the Flask server
Thread(target=lambda: app.run(debug=False, use_reloader=False)).start()
