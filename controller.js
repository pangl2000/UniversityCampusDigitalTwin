const express = require('express');
const WebSocket = require('ws');
const { exec } = require('child_process');
const cors = require('cors'); // Add the CORS middleware
const axios = require('axios');
const app = express();

app.use(cors({
    origin: '*',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// WebSocket Servers for dynamic and static models
let dynamicServer = new WebSocket.Server({ port: 8889 });
let staticServer = new WebSocket.Server({ port: 8890 });

// Port management to avoid conflicts
let portManager = {
    streamAvailablePorts: [8889, 8890, 8891, 8892, 8893, 8894, 8895, 8896, 8897, 8898, 8899, 8900, 8901, 8902, 8903, 8904, 8905, 8906, 8907, 8908],
    sfuAvailablePorts: [8909, 8910, 8911, 8912, 8913, 8914, 8915, 8916, 8917, 8918, 8919, 8920, 8921, 8922, 8923, 8924, 8925, 8926, 8927, 8928],
    httpAvailablePorts: [8080, 8081, 8082, 8083, 8084, 8085, 8086, 8087, 8088, 8089, 8090, 8091, 8092, 8093, 8094, 8095, 8096, 8097, 8098, 8099],
    httpsAvailablePorts: [8444, 8445, 8446, 8447, 8448, 8449, 8450, 8451, 8452, 8453, 8454, 8455, 8456, 8457, 8458, 8459, 8460, 8461, 8462, 8463],
    inUsePorts: {} // Track used ports by sessionId
};

// Function to allocate ports
function allocatePorts() {
    if (portManager.streamAvailablePorts.length === 0) {
        return null;
    }
    const streamPort = portManager.streamAvailablePorts.pop();
    const sfuPort = portManager.sfuAvailablePorts.pop();
    const httpPort = portManager.httpAvailablePorts.pop();
    const httpsPort = portManager.httpsAvailablePorts.pop();
    return { streamPort, sfuPort, httpPort, httpsPort };
}

// Function to free allocated ports
function freePorts(ports) {
    portManager.streamAvailablePorts.push(ports.streamPort);
    portManager.sfuAvailablePorts.push(ports.sfuPort);
    portManager.httpAvailablePorts.push(ports.httpPort);
    portManager.httpsAvailablePorts.push(ports.httpsPort);
}

// WebSocket handling for dynamic model
dynamicServer.on('connection', (ws) => {
    console.log('Client connected to Dynamic stream');
    // Handle dynamic stream connections
});

// WebSocket handling for static model
staticServer.on('connection', (ws) => {
    console.log('Client connected to Static stream');
    // Handle static stream connections
});

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

// Store to hold process IDs for each session
let processStore = {};

// API to start stream
app.get('/start-stream', (req, res) => {
    const { streamType, sessionId } = req.query;

    // Allocate ports for this session
    const ports = allocatePorts();
    if (!ports) {
        return res.status(500).send('No available ports.');
    }

    const { streamPort, sfuPort, httpPort, httpsPort } = ports;

    // Define matchmaking port
    let matchmakingPort = 9998;
    if (streamType === 'static') {
        matchmakingPort = 9999;
    }

    // Command to start the signalling server and capture the PID
    const startSignallingServerCommand = `PowerShell -Command "(Start-Process -FilePath 'powershell.exe' -ArgumentList '-File .\\PixelStreamingMultiple${streamType}\\Windows\\${streamType}Model\\Samples\\PixelStreaming\\WebServers\\SignallingWebServer\\platform_scripts\\cmd\\Start_SignallingServer.ps1 --StreamerPort ${streamPort} --HttpPort ${httpPort} --SFUPort ${sfuPort} --HttpsPort ${httpsPort} --MatchmakerPort ${matchmakingPort} --UseMatchmaker True --MatchmakerAddress localhost --PublicIp localhost'  -PassThru).Id"`;

    // Command to start the Unreal Engine executable and capture the PID
    const startExeCommand = `PowerShell -Command "(Start-Process -FilePath '.\\PixelStreamingMultiple${streamType}\\Windows\\${streamType}Model.exe' -ArgumentList '-AudioMixer -PixelStreamingIP=localhost -PixelStreamingPort=${streamPort} -RenderOffscreen' -PassThru).Id"`;

    // Execute the command to start the signalling server and capture its PID
    exec(startSignallingServerCommand, (error, stdout) => {
        if (error) {
            return res.status(500).send(`Error starting Signalling Server: ${error.message}`);
        }
        const signallingProcessId = stdout.trim();
        console.log(`Signalling Server started with PID: ${signallingProcessId}`);

        // Execute the command to start the Unreal Engine process and capture its PID
        exec(startExeCommand, (error, stdout) => {
            if (error) {
                return res.status(500).send(`Error starting Unreal Engine process: ${error.message}`);
            }
            const exeProcessId = stdout.trim();
            console.log(`Unreal Engine process started with PID: ${exeProcessId}`);

            // Store the PIDs and allocated ports in processStore (sessionId -> PIDs and ports)
            processStore[sessionId] = {
                signallingProcessId,
                exeProcessId,
                ports
            };

            res.send('Unreal Engine process started successfully.');
        });
    });
});

// API to stop stream
app.get('/stop-stream', (req, res) => {
    const { sessionId } = req.query;

    // Retrieve the process IDs and ports for the given sessionId
    const { signallingProcessId, exeProcessId, ports } = processStore[sessionId] || {};

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

            // Free the allocated ports
            freePorts(ports);

            // Remove the session from the process store
            delete processStore[sessionId];

            res.send('Unreal Engine and Signalling Server processes stopped successfully.');
        });
    });
});

// New API endpoint to fetch AP history from Flask
app.get('/get_historical_data', async (req, res) => {
    try {
        // Make a request to the Flask server (assume it's running on http://127.0.0.1:5000)
        const flaskResponse = await axios.get('http://127.0.0.1:5000/api/get_ap_history');
        res.json(flaskResponse.data); // Return the data to the frontend
    } catch (error) {
        console.error('Error fetching AP history from Flask:', error.message);
        res.status(500).json({ error: 'Failed to fetch AP history' });
    }
});

// Start the express server on port 8888
app.listen(8888, () => {
    console.log('Front-end server listening on port 8888');
});
