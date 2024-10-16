const express = require('express');
const WebSocket = require('ws');
const { exec } = require('child_process');
const cors = require('cors'); // Add the CORS middleware
const app = express();

// Enable CORS for requests from http://127.0.0.1:3000
app.use(cors({
    origin: 'http://127.0.0.1:3000'
}));

// WebSocket Servers
let dynamicServer = new WebSocket.Server({ port: 8889 });
let staticServer = new WebSocket.Server({ port: 8890 });

// API endpoint to handle model redirection
app.get('/', (req, res) => {
    let project = req.query.project;
    if (project === 'DynamicModel') {
        res.redirect('http://localhost:80');
    } else if (project === 'StaticModel') {
        res.redirect('http://localhost:81');
    } else {
        res.send('Unknown project');
    }
});

// Existing WebSocket handling for dynamic model
dynamicServer.on('connection', (ws) => {
    console.log('Client connected to Dynamic stream');
    // Handle dynamic stream connections here
});

// Existing WebSocket handling for static model
staticServer.on('connection', (ws) => {
    console.log('Client connected to Static stream');
    // Handle static stream connections here
});

let processStore = {};  // Store to hold process IDs for each session

app.get('/start-stream', (req, res) => {
    const { streamPort, sfuPort, httpPort, httpsPort, streamType, sessionId } = req.query;

    // Define matchmaking port
    let matchmakingPort = 9998;
    if (streamType === 'static') {
        matchmakingPort = 9999;
    }

    // Command to start the signalling server and capture the PID
    const startSignallingServerCommand = `PowerShell -Command "(Start-Process -FilePath 'powershell.exe' -ArgumentList '-File .\\PixelStreamingMultiple${streamType}\\Windows\\${streamType}Model\\Samples\\PixelStreaming\\WebServers\\SignallingWebServer\\platform_scripts\\cmd\\Start_SignallingServer.ps1 --StreamerPort ${streamPort} --HttpPort ${httpPort} --SFUPort ${sfuPort} --HttpsPort ${httpsPort} --MatchmakerPort ${matchmakingPort} --UseMatchmaker True --MatchmakerAddress localhost --PublicIp localhost' -PassThru).Id"`;

    // Command to start the Unreal Engine executable and capture the PID
    const startExeCommand = `PowerShell -Command "(Start-Process -FilePath '.\\PixelStreamingMultiple${streamType}\\Windows\\${streamType}Model.exe' -ArgumentList '-AudioMixer -PixelStreamingIP=localhost -PixelStreamingPort=${streamPort} -RenderOffscreen' -PassThru).Id"`;

    // Execute the command to start the signalling server and capture its PID
    exec(startSignallingServerCommand, (error, stdout, stderr) => {
        if (error) {
            return res.status(500).send(`Error starting Signalling Server: ${error.message}`);
        }
        const signallingProcessId = stdout.trim();  // Captured PID of signalling server
        console.log(`Signalling Server started with PID: ${signallingProcessId}`);

        // Execute the command to start the Unreal Engine process and capture its PID
        exec(startExeCommand, (error, stdout, stderr) => {
            if (error) {
                return res.status(500).send(`Error starting Unreal Engine process: ${error.message}`);
            }
            const exeProcessId = stdout.trim();  // Captured PID of Unreal Engine process
            console.log(`Unreal Engine process started with PID: ${exeProcessId}`);

            // Store the PIDs in memory (sessionId -> PIDs)
            processStore[sessionId] = {
                signallingProcessId,
                exeProcessId
            };

            res.send('Unreal Engine process started successfully.');
        });
    });
});

app.get('/stop-stream', (req, res) => {
    const { sessionId } = req.query;

    // Retrieve the process IDs for the given sessionId
    const { signallingProcessId, exeProcessId } = processStore[sessionId] || {};

    if (!signallingProcessId || !exeProcessId) {
        return res.status(404).send(`No processes found for session ID: ${sessionId}`);
    }

    // Command to stop the Unreal Engine process and any child processes using taskkill
    const stopExeCommand = `taskkill /PID ${exeProcessId} /T /F`;

    // Command to stop the signalling server and any child processes using taskkill
    const stopSignallingServerCommand = `taskkill /PID ${signallingProcessId} /T /F`;

    // Execute the command to stop the Unreal Engine process first
    exec(stopExeCommand, (error) => {
        if (error) {
            return res.status(500).send(`Error stopping Unreal Engine process: ${error.message}`);
        }
        console.log(`Unreal Engine process with PID ${exeProcessId} and its child processes stopped`);

        // Execute the command to stop the signalling server process after Unreal Engine process is stopped
        exec(stopSignallingServerCommand, (error) => {
            if (error) {
                return res.status(500).send(`Error stopping Signalling Server: ${error.message}`);
            }
            console.log(`Signalling Server process with PID ${signallingProcessId} and its child processes stopped`);

            // Remove the session from the process store
            delete processStore[sessionId];

            res.send('Unreal Engine and Signalling Server processes stopped successfully.');
        });
    });
});

// Start the express server on port 8888
app.listen(8888, () => {
    console.log('Front-end server listening on port 8888');
});
