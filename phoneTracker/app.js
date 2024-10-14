// script.js

async function getElevation(lat, lng) {
    try {
        const response = await fetch(`/getElevation?lat=${lat}&lng=${lng}`);
        const data = await response.json();
        if (data.results && data.results.length > 0) {
            return data.results[0].elevation;
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error fetching elevation data:', error);
        return null;
    }
}

async function getData() {
    const url = '/getData'; // Proxying through the Express server
    const statusElement = document.getElementById('status');

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            return data;
        } else {
            statusElement.innerHTML = `Failed to retrieve data: ${response.statusText}`;
            return null;
        }
    } catch (error) {
        statusElement.innerHTML = `Error: ${error.message}`;
        return null;
    }
}

async function postData(data) {
    const url = '/postData'; // Proxying through the Express server
    const statusElement = document.getElementById('status');
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            statusElement.innerHTML = `Data posted successfully at ${new Date().toLocaleTimeString()}`;
        } else {
            statusElement.innerHTML = `Failed to post data at ${new Date().toLocaleTimeString()}`;
        }
    } catch (error) {
        statusElement.innerHTML = `Error: ${error.message}`;
    }
}

async function patchData(data) {
    const url = '/patchData'; // Proxying through the Express server
    const statusElement = document.getElementById('status');
    
    try {
        const response = await fetch(url, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            statusElement.innerHTML = `Data patched successfully at ${new Date().toLocaleTimeString()}`;
        } else {
            statusElement.innerHTML = `Failed to patch data at ${new Date().toLocaleTimeString()}`;
        }
    } catch (error) {
        statusElement.innerHTML = `Error: ${error.message}`;
    }
}

// Function to convert latitude and longitude to UTM coordinates
function latlonToUtm(latitude, longitude) {
    const utmProjection = "+proj=utm +zone=34 +ellps=WGS84 +units=m +no_defs";
    const [utmX, utmY] = proj4(utmProjection, [longitude, latitude]);
    return { utmX, utmY };
}

// Function to calculate fixed Unreal Engine units
function fixedUEngineUnits(lat, lon) {
    const originLatitude = 38.285720;
    const originLongitude = 21.789350;
    const origin = latlonToUtm(originLatitude, originLongitude);
    const real = latlonToUtm(lat, lon);
    const fixedX = real.utmX - origin.utmX;
    const fixedY = origin.utmY - real.utmY;
    return { fixedX, fixedY };
}

// Function to generate data to post or patch
function generateData(x, y, z, x_old, y_old, z_old) {
    return {
        "id": "DigitalTwinUser:PhoneManny",
        "type": "User",
        "x": {
            "type": "Number",
            "value": x  // Longitude
        },
        "y": {
            "type": "Number",
            "value": y  // Latitude
        },
        "z": {
            "type": "Number",
            "value": z  // Altitude
        },
        "x_old": {
            "type": "Number",
            "value": x_old
        },
        "y_old": {
            "type": "Number",
            "value": y_old
        },
        "z_old": {
            "type": "Number",
            "value": z_old
        },
        "area": {
            "type": "Text",
            "value": "Unknown"
        }
    };
}

// Upload data to the server (POST or PATCH based on existence of old data)
async function uploadData(position) {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;
    const alt = await getElevation(lat, lon); // Fetch elevation using the proxy
    const { fixedX, fixedY } = fixedUEngineUnits(lat, lon);

    let x_old = 0, y_old = 0, z_old = 0;
    const oldData = await getData(); // Fetch existing data from the server

    if (oldData !== null) {
        x_old = oldData['x']['value'];
        y_old = oldData['y']['value'];
        z_old = oldData['z']['value'];
    }

    const data = generateData(fixedX, fixedY, alt, x_old, y_old, z_old);

    if (oldData === null) {
        await postData(data); // Post new data if no old data exists
    } else {
        await patchData(data); // Patch the existing data
    }
}

// Function to get the current position and post it
function getLocationAndPostData() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(uploadData, showError);
    } else {
        document.getElementById('status').innerHTML = "Geolocation is not supported by this browser.";
    }
}

// Error handling for geolocation
function showError(error) {
    let statusElement = document.getElementById('status');
    switch(error.code) {
        case error.PERMISSION_DENIED:
            statusElement.innerHTML = "User denied the request for Geolocation.";
            break;
        case error.POSITION_UNAVAILABLE:
            statusElement.innerHTML = "Location information is unavailable.";
            break;
        case error.TIMEOUT:
            statusElement.innerHTML = "The request to get user location timed out.";
            break;
        case error.UNKNOWN_ERROR:
            statusElement.innerHTML = "An unknown error occurred.";
            break;
    }
}

// Call getLocationAndPostData every 5 seconds
setInterval(getLocationAndPostData, 5000);
