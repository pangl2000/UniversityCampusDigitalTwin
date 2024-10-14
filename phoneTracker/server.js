// server.js

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();

// Use the port provided by Replit or default to 8080
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors({
    origin: '*',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(bodyParser.json()); // For parsing JSON bodies

// Serve static files (index.html and app.js) from the root directory
app.use(express.static(path.join(__dirname)));

// Serve the index.html file on the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Proxy route for Google Maps Elevation API
app.get('/getElevation', async (req, res) => {
    const { lat, lng } = req.query; // Extract lat and lng from query parameters
    const apiKey = 'AIzaSyCLAWIkU-GBgvdeIo7vMlgASFZQEp55RZo'; // Your Google Maps API key
    const url = `https://maps.googleapis.com/maps/api/elevation/json?locations=${lat},${lng}&key=${apiKey}`;
    try {
        const response = await axios.get(url);
        res.json(response.data); // Return the response data to the client
    } catch (error) {
        console.error('Error fetching elevation data:', error);
        res.status(500).json({ error: 'Failed to fetch elevation data' });
    }
});

// Proxy route for getting data from the context broker
app.get('/getData', async (req, res) => {
    const url = 'http://150.140.186.118:1026/v2/entities/DigitalTwinUser:PhoneManny';
    try {
        const response = await axios.get(url);
        res.json(response.data); // Return the response data to the client
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'Failed to fetch data' });
    }
});

// Proxy route for POSTing data to the context broker
app.post('/postData', async (req, res) => {
    const url = 'http://150.140.186.118:1026/v2/entities/';
    const data = req.body; // The data to post

    try {
        const response = await axios.post(url, data, {
            headers: {
                'Content-Type': 'application/json',
            },
        });
        res.status(200).json({ message: 'Data posted successfully', data: response.data });
    } catch (error) {
        console.error('Error posting data:', error);
        res.status(500).json({ error: 'Failed to post data' });
    }
});

// Proxy route for PATCHing data to the context broker
app.patch('/patchData', async (req, res) => {
    const url = 'http://150.140.186.118:1026/v2/entities/DigitalTwinUser:PhoneManny/attrs';
    const data = req.body; // The data to patch

    delete data.id;
    
    try {
        const response = await axios.patch(url, data, {
            headers: {
                'Content-Type': 'application/json',
            },
        });
        res.status(200).json({ message: 'Data patched successfully', data: response.data });
    } catch (error) {
        console.error('Error patching data:', error);
        res.status(500).json({ error: 'Failed to patch data' });
    }
});

// Start the server, binding to 0.0.0.0 and the dynamic port provided by Replit
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
