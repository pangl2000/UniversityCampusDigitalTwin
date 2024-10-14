const express = require('express');
const axios = require('axios');
const app = express();
const port = 3000;  // You can change the port as needed

// Allow JSON in request bodies
app.use(express.json());

// Proxy route to handle requests
app.get('/api/elevation', async (req, res) => {
    const { lat, lng } = req.query;

    // Replace this with your actual API key and target URL
    const apiKey = 'YOUR_GOOGLE_API_KEY';  // Put your Google Maps API key here
    const targetUrl = `https://maps.googleapis.com/maps/api/elevation/json?locations=${lat},${lng}&key=${apiKey}`;

    try {
        // Make the request to the external API (Google Maps Elevation API in this case)
        const response = await axios.get(targetUrl);
        
        // Forward the response from the API back to the client
        res.json(response.data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching data from Google Maps API' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
