@echo off

echo Starting Docker Desktop (if not already running)...

:: Step 0: Start Docker Desktop if not running
:wait_for_docker
docker info >nul 2>&1
if errorlevel 1 (
    echo Docker is not running. Attempting to start Docker Desktop...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    echo Waiting for Docker to start...
    timeout /t 5 /nobreak
    goto wait_for_docker
)

echo Docker is running. Proceeding with the script...

:: Step 1: Run contextBrokerDataHandler.py in ./backendCodes/ hidden
powershell -Command "Start-Process 'python' 'apiForSqlData.py' -WorkingDirectory './backendCodes' "

:: Step 2: Start Docker containers using docker-compose
echo Starting Docker containers...
cd ./externalDB
docker-compose up -d
cd ..

:: Step 2.5: Wait for Docker containers to be running (adjust for your specific service names if needed)
echo Waiting for Docker containers to be up and running...
:check_containers
docker-compose -f ./externalDB/docker-compose.yml ps | find /i "Up"
if %errorlevel% neq 0 (
    echo Containers not ready yet. Checking again in 5 seconds...
    timeout /t 5 /nobreak
    goto check_containers
)

echo All containers are running. Proceeding...

:: Step 3: Run contextBrokerDataHandler.py in ./backendCodes/ hidden
powershell -Command "Start-Process 'python' 'contextBrokerDataHandler.py' -WorkingDirectory './backendCodes' "

:: Step 4: Run 1a_RunDynamicMatchmakerServer.bat hidden
powershell -Command "Start-Process 'cmd' '/c call 1a_RunDynamicMatchmakerServer.bat' -WorkingDirectory '.' "

:: Step 5: Run 2a_RunStaticMatchmakerServer.bat hidden
powershell -Command "Start-Process 'cmd' '/c call 2a_RunStaticMatchmakerServer.bat' -WorkingDirectory '.' "

:: Step 5.5: Delay for 5 seconds
timeout /t 5 /nobreak

:: Step 6: Run node controller.js hidden
powershell -Command "Start-Process 'node' 'controller.js' "

:: Step 7: Run http-server on port 3000 hidden (use full path to avoid conflict)
powershell -Command "Start-Process 'http-server.cmd' '-p 3000' "

:: Step 8: Open http://127.0.0.1:3000 in the default browser (no need to hide browser)
start "" http://127.0.0.1:3000

:: Step 9: Delay for 10 seconds
timeout /t 5 /nobreak

:: Step 10: Run dataHandler.py in ./backendCodes/ hidden
powershell -Command "Start-Process 'python' 'dataHandler.py' -WorkingDirectory './backendCodes' "
