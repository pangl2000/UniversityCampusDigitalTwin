// Function to generate data to post
function generateData(lat, lon, lat_old, lon_old) {
    return {
        "id": "DigitalTwinData:Phone",
        "type": "Data",
        "lat": {
            "type": "Number",
            "value": lat  // Longitude
        },
        "lon": {
            "type": "Number",
            "value": lon  // Latitude
        },
        "lat_old": {
            "type": "Number",
            "value": lat_old
        },
        "lon_old": {
            "type": "Number",
            "value": lon_old
        }
    };
}

// Function to send an HTTP GET request to retrieve data
async function getData() {
    const url = 'http://150.140.186.118:1026/v2/entities/DigitalTwinData:Phone';
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

// Function to send data to the context broker via POST
async function postData(data) {
    const url = 'http://150.140.186.118:1026/v2/entities/';
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

// Function to send data to the context broker via PATCH
async function patchData(data) {
    const url = 'http://150.140.186.118:1026/v2/entities/DigitalTwinData:Phone/attrs';
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

// Function to upload data (POST or PATCH based on existence)
async function uploadData(position) {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;
    let lat_old = 0, lon_old = 0;
    
    const oldData = await getData();
    if (oldData !== null) {
        lat_old = oldData['lat']['value'];
        lon_old = oldData['lon']['value'];
    }

    const data = generateData(lat, lon, lat_old, lon_old);

    if (oldData === null) {
        await postData(data);
    } else {
        await patchData(data);
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
