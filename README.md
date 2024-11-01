# Project Setup Guide

This guide will walk you through downloading the necessary files, installing dependencies, and running the project. Additionally, instructions for using phone location tracking are provided.

## 📥 Download

1. **Download all files** from this GitHub repository.<br>
_GitHub files are structured like this:<br>
`UniversityCampusDigitalTwin-master.zip/UniversityCampusDigitalTwin-master/UniversityCampusDigitalTwin-master/`_

2. **Download large files** from this google drive [link](https://drive.google.com/file/d/1jXK93D8Bur9EWruAC-QHEaEi-mES3-gF/view?usp=sharing) and extract the files.
   
3. **Place all downloaded folders** in the project's root directory.<br>
_Extract `UniversityCampusDigitalTwin-master.zip`. To avoid any issues extract `PixelStreamingMultiple.zip` directly to: <br>
`UniversityCampusDigitalTwin-master/UniversityCampusDigitalTwin-master/`._<br></br> 
_**Note**: Make sure you have installed [Docker Desktop](https://www.docker.com/products/docker-desktop/) - [node.js](https://nodejs.org/en) - [python 3.11+](https://www.python.org/downloads/)_.

## 🛠 Installation

To install the required packages, follow these steps:

1. Open a terminal or command prompt and run the following commands to install python dependencies:

    ```bash
    pip install Flask
    pip install pymongo
    pip install bson
    pip install Flask-RESTful
    pip install aiohttp
    pip install schedule
    pip install requests
    pip install pyproj
    pip install shapely==1.8.5
    ```

2. Open cmd in `UniversityCampusDigitalTwin-master/UniversityCampusDigitalTwin-master/` and install these dependencies using npm install:

   ```bash
   npm init -y
   npm install express ws cors axios
   npm install -g http-server
   ```
   
3. Setup Matchmaker and Signalling Web Servers.<br>
   3.1. Run matchmakerSetup.bat<br>
   3.2. Once Matchmaker Servers are ready exit terminals<br>
   3.3. Run signallingSetup.bat<br>
   3.4. Once Signalling Web Servers are ready exit terminals

## 🚀 Run the Project

1. **To start the project**, simply run the `run_project.bat` file.
2. **To stop the project**, run the `terminate_all.bat` file.

## 📱 Phone Location Tracking (Optional)

If you want to use your phone's location in the project, follow these steps:

1. Create a **Replit** account.
2. Copy the `phoneTracker` folder into your Replit account.
3. Access your Replit account from your phone's browser.
4. Run the code to start tracking your phone's location.
