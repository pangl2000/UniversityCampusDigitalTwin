@echo off
echo Terminating processes...

:: Step 1: Stop Docker Compose containers (pause them for future runs)
echo Stopping Docker Compose containers...
powershell -Command "Start-Process 'docker-compose' 'stop' -WorkingDirectory './externalDB' -WindowStyle Hidden"

:: Step 2: Terminate PowerShell processes running your custom scripts
taskkill /F /IM powershell.exe

:: Step 3: Terminate Python scripts
taskkill /F /IM python.exe

:: Step 4: Terminate Node.js (used for controller.js)
taskkill /F /IM node.exe

:: Step 5: Terminate http-server
taskkill /F /IM http-server.exe

:: Step 6: Get the PID(s) of StaticModel.exe and terminate them
for /F "tokens=2" %%A in ('tasklist ^| findstr StaticModel.exe') do (
    echo Terminating StaticModel.exe with PID %%A
    taskkill /PID %%A /F /T
)

:: Step 7: Get the PID(s) of DynamicModel.exe and terminate them
for /F "tokens=2" %%B in ('tasklist ^| findstr DynamicModel.exe') do (
    echo Terminating DynamicModel.exe with PID %%B
    taskkill /PID %%B /F /T
)

:: Step 8: Terminate Batch Scripts (Dynamic and Static Matchmaker Servers)
taskkill /F /IM cmd.exe

echo All processes have been terminated.
echo.
echo Press any key to close the window or check the output.
pause
