@echo off

echo Starting Docker Desktop (if not already running)...

:: Step 1: Run contextBrokerDataHandler.py in ./backendCodes/ hidden
powershell -Command "Start-Process 'python' 'apiForSqlData.py' -WorkingDirectory './backendCodes' -WindowStyle Hidden"

:: Step 2: Check if the Docker image for your service is already built
powershell -Command "Start-Process 'docker-compose' 'up' -WorkingDirectory './externalDB' -WindowStyle Hidden"

:: Step 3: Run contextBrokerDataHandler.py in ./backendCodes/ hidden
powershell -Command "Start-Process 'python' 'contextBrokerDataHandler.py' -WorkingDirectory './backendCodes' -WindowStyle Hidden"

:: Step 4: Run 1a_RunDynamicMatchmakerServer.bat hidden
powershell -Command "Start-Process 'cmd' '/c call 1a_RunDynamicMatchmakerServer.bat' -WorkingDirectory '.' -WindowStyle Hidden"

:: Step 5: Run 2a_RunStaticMatchmakerServer.bat hidden
powershell -Command "Start-Process 'cmd' '/c call 2a_RunStaticMatchmakerServer.bat' -WorkingDirectory '.' -WindowStyle Hidden"

:: Step 6: Run node controller.js hidden
powershell -Command "Start-Process 'node' 'controller.js' -WindowStyle Hidden"

:: Step 7: Run http-server on port 3000 hidden (use full path to avoid conflict)
powershell -Command "Start-Process 'http-server.cmd' '-p 3000' -WindowStyle Hidden"

:: Step 8: Open http://127.0.0.1:3000 in the default browser (no need to hide browser)
start "" http://127.0.0.1:3000

:: Step 9: Delay for 10 seconds
timeout /t 10 /nobreak

:: Step 10: Run dataHandler.py in ./backendCodes/ hidden
powershell -Command "Start-Process 'python' 'dataHandler.py' -WorkingDirectory './backendCodes' -WindowStyle Hidden"

