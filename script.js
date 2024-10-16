// Page elements
const homePage = document.getElementById('home-page');
const overviewPage = document.getElementById('overview-page');
const staticPage = document.getElementById('static-page');
const dynamicPage = document.getElementById('dynamic-page');
const wifiPage = document.getElementById('wifi-page');

// Buttons
const enterOverviewButton = document.getElementById('enter-overview');
const exploreStaticButton = document.getElementById('explore-static');
const exploreDynamicButton = document.getElementById('explore-dynamic');
const viewWifiButton = document.getElementById('view-wifi');
const backToOverviewButtons = document.querySelectorAll('.back-to-overview');

// Ports management
let streamAvailablePorts = [8889,
                            8890,
                            8891,
                            8892,
                            8893,
                            8894,
                            8895,
                            8896,
                            8897,
                            8898,
                            8899,
                            8900,
                            8901,
                            8902,
                            8903,
                            8904,
                            8905,
                            8906,
                            8907,
                            8908]
let streamInUsePorts = [];   
let sfuAvailablePorts = [8909,
                        8910,
                        8911,
                        8912,
                        8913,
                        8914,
                        8915,
                        8916,
                        8917,
                        8918,
                        8919,
                        8920,
                        8921,
                        8922,
                        8923,
                        8924,
                        8925,
                        8926,
                        8927,
                        8928];
let sfuInUsePorts = []; 
let httpAvailablePorts = [8080,
                            8081,
                            8082,
                            8083,
                            8084,
                            8085,
                            8086,
                            8087,
                            8088,
                            8089,
                            8090,
                            8091,
                            8092,
                            8093,
                            8094,
                            8095,
                            8096,
                            8097,
                            8098,
                            8099];
let httpInUsePorts = [];
let httpsAvailablePorts = [8444,
                            8445,
                            8446,
                            8447,
                            8448,
                            8449,
                            8450,
                            8451,
                            8452,
                            8453,
                            8454,
                            8455,
                            8456,
                            8457,
                            8458,
                            8459,
                            8460,
                            8461,
                            8462,
                            8463];
let httpsInUsePorts = [];

let availablePorts = [8889, 8890]; // List of available ports
let inUsePorts = {}; // Track currently in-use ports, { pageId: port }

// Function to allocate a port
function allocatePort() {
    if (streamAvailablePorts.length === 0) {
        console.log("No available ports.");
        return null;
    }
    const streamPort = streamAvailablePorts.pop(); // Get a free port
    const sfuPort = sfuAvailablePorts.pop(); // Get a free port
    const httpPort = httpAvailablePorts.pop(); // Get a free port
    const httpsPort = httpsAvailablePorts.pop(); // Get a free port
    return [streamPort, sfuPort, httpPort, httpsPort];
}

// Function to free a port
function freePort(streamPort, sfuPort, httpPort, httpsPort) {
    streamAvailablePorts.push(streamPort);
    sfuAvailablePorts.push(sfuPort);
    httpAvailablePorts.push(httpPort);
    httpsAvailablePorts.push(httpsPort);
    console.log(`Ports ${streamPort}, ${sfuPort}, ${httpPort}, ${httpsPort} freed`);
}

function generateUniqueIdentifier() {
    return Date.now();  // Simple unique identifier (or use a UUID library)
}

function startStream(streamPort, sfuPort, httpPort, httpsPort, streamType, sessionId) {
    const query = new URLSearchParams({
        streamPort,
        sfuPort,
        httpPort,
        httpsPort,
        streamType,
        sessionId,
    }).toString();

    fetch(`http://localhost:8888/start-stream?${query}`)
        .then(response => response.text())
        .then(result => console.log(result))
        .catch(error => console.error('Error starting stream:', error));
}

function stopStream(sessionId) {
    fetch(`http://localhost:8888/stop-stream?sessionId=${sessionId}`)
        .then(response => response.text())
        .then(result => console.log(result))
        .catch(error => console.error('Error stopping stream:', error));
}

// Function to handle page switching with dynamic server management
function switchPage(fromPage, toPage, streamType = null) {
    let sessionId = generateUniqueIdentifier();  // Generate a unique identifier for this user/session

    // Store sessionId as a data attribute on the current page (fromPage)
    toPage.setAttribute('data-session-id', sessionId);

    let outTransform = 'translateX(-100%)'; // Slide out to the left
    let inTransform = 'translateX(100%)';   // Slide in from the right

    fromPage.style.transform = outTransform;
    fromPage.style.opacity = 0; // Fade out

    toPage.style.display = 'block';
    toPage.style.transform = inTransform;
    toPage.style.opacity = 0; // Initially invisible

    setTimeout(() => {
        toPage.style.transform = 'translateX(0)';
        toPage.style.opacity = 1;

        setTimeout(() => {
            toPage.classList.add('active');
            fromPage.classList.remove('active');
            fromPage.style.display = 'none'; // Hide the old page

            // Start Unreal server for dynamic/static streams
            if (streamType) {
                const [streamPort, sfuPort, httpPort, httpsPort] = allocatePort();
                if (streamPort && sfuPort && httpPort && httpsPort) {
                    startStream(streamPort, sfuPort, httpPort, httpsPort, streamType, sessionId);
                    streamInUsePorts[sessionId] = streamPort; // Store the port in use for this page
                    sfuInUsePorts[sessionId] = sfuPort; // Store the port in use for this page
                    httpInUsePorts[sessionId] = httpPort; // Store the port in use for this page
                    httpsInUsePorts[sessionId] = httpsPort; // Store the port in use for this page
                } else {
                    console.error('No available ports for streaming');
                }
            }
        }, 500); // Matches CSS transition duration
    }, 50); // Small delay to trigger transition
}

// Function to return to the overview and stop server
function backToOverview(fromPage) {
    if (fromPage.id === 'static-page' || fromPage.id ==='dynamic-page') {
        const sessionId = fromPage.getAttribute('data-session-id');  // Get the sessionId from the page's data attribute

        const streamPort = streamInUsePorts[sessionId];
        const sfuPort = sfuInUsePorts[sessionId];
        const httpPort = httpInUsePorts[sessionId];
        const httpsPort = httpsInUsePorts[sessionId];
        if (streamPort && sfuPort && httpPort && httpsPort) {
            stopStream(sessionId);
            freePort(streamPort, sfuPort, httpPort, httpsPort);
            delete streamInUsePorts[sessionId];
            delete sfuInUsePorts[sessionId];
            delete httpInUsePorts[sessionId];
            delete httpsInUsePorts[sessionId];
        }
    }
    switchPage(fromPage, overviewPage);
}

// Event listeners for navigation
enterOverviewButton.addEventListener('click', () => {
    homePage.classList.add('zoom-in');
    setTimeout(() => {
        homePage.classList.remove('active');
        homePage.style.display = 'none';
        overviewPage.style.display = 'block';
        overviewPage.style.opacity = 1;
        overviewPage.style.transform = 'translateX(0)';
        overviewPage.classList.add('active');
    }, 500);  // Matches the zoom-in animation duration
});

// From Overview to Static Model Stream
exploreStaticButton.addEventListener('click', () => {
    switchPage(overviewPage, staticPage, 'static');
});

// From Overview to Dynamic Model Stream
exploreDynamicButton.addEventListener('click', () => {
    switchPage(overviewPage, dynamicPage, 'dynamic');
});

// From Overview to WiFi Data
viewWifiButton.addEventListener('click', () => {
    switchPage(overviewPage, wifiPage);

    // Initiate fetching AP history when navigating to WiFi page
    fetchAPHistory().then(() => {
        populateDropdown(); // Populate dropdown after data is fetched
        handleAPChange(); // Set up event listener for dropdown change after fetching data
    });
});

// Back to overview from other pages
backToOverviewButtons.forEach(button => {
    button.addEventListener('click', (event) => {
        const currentPage = event.target.closest('.page');
        backToOverview(currentPage);
    });
});

// The list of AP names provided
const apNames = ["R0_EST-AP_0.1",
                "R0_EST-AP_0.2", 
                "R0_EST-AP_0.3", 
                "R0_EST-AP_0.4", 
                "R0_AMF-AP_0.3"];

// Function to populate the dropdown menu with AP names
function populateDropdown() {
    const apSelector = document.getElementById('ap-selector');
    apSelector.innerHTML = ''; // Clear any previous options

    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select an AP';
    apSelector.appendChild(defaultOption);

    apNames.forEach(apName => {
        const option = document.createElement('option');
        option.value = apName;
        option.textContent = apName;
        apSelector.appendChild(option);
    });

    console.log('Dropdown populated with AP names:', apNames); // Debugging
}

// Function to plot the selected AP's data based on aps_history and aps_datetimes
function plotSpots(aps_datetimes, aps_history, apName) {
    if (!(apName in aps_history)) {
        console.error(`No data available for AP: ${apName}`);
        return;
    }

    const apHistoryData = aps_history[apName];
    if (!apHistoryData || !aps_datetimes || aps_datetimes.length !== apHistoryData.length) {
        console.error('Data mismatch or missing data for the selected AP.');
        return;
    }

    const momentDatetimes = aps_datetimes.map(dt => moment(dt));

    const wifiGraphsContainer = document.getElementById('wifi-graphs-container');
    wifiGraphsContainer.innerHTML = '';  // Clear existing content

    // Create a canvas element for the plot with specific dimensions
    const canvas = document.createElement('canvas');
    canvas.width = 1152;
    canvas.height = 648;
    wifiGraphsContainer.appendChild(canvas);

    new Chart(canvas, {
        type: 'line',
        data: {
            labels: momentDatetimes,
            datasets: [{
                label: apName,
                data: apHistoryData,
                borderColor: 'rgba(97, 226, 101, 1)',
                borderWidth: 2,
                fill: false,
            }]
        },
        options: {
            responsive: false, // Turn off responsiveness to fix the canvas size
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'hour',
                        tooltipFormat: 'YYYY-MM-DD HH:mm',
                    },
                    title: {
                        display: true,
                        text: 'Datetime'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Crowd Size'
                    },
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                title: {
                    display: true,
                    text: `Crowd Size for ${apName}`
                }
            }
        }
    });
}

// Function to fetch AP history
function fetchAPHistory() {
    const fetchStatus = document.getElementById('fetch-status');

    // Set the status text to indicate data is being retrieved
    fetchStatus.textContent = 'Waiting for data to be retrieved...';

    return fetch(`http://127.0.0.1:5000/api/get_ap_history`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log("Fetched history data for APs:", data); // Debugging

            // Store the data globally for use in the dropdown change event
            window.apData = data;

            // Update the status text once data is retrieved
            fetchStatus.textContent = 'Data retrieved, you can proceed to select Access Point.';
        })
        .catch(error => {
            console.error('Error fetching AP history:', error);

            // If there was an error, update the status message
            fetchStatus.textContent = 'Error fetching data. Please try again.';
        });
}

// Function to handle the change event on the dropdown
function handleAPChange() {
    const apSelector = document.getElementById('ap-selector');
    apSelector.addEventListener('change', () => {
        const selectedAP = apSelector.value;

        if (selectedAP && window.apData) {
            const datetimes = window.apData.aps_datetimes;
            const apHistory = window.apData.aps_history;

            if (datetimes && apHistory) {
                // Plot the data for the selected AP
                plotSpots(datetimes, apHistory, selectedAP);
            } else {
                console.error(`No data available for selected AP: ${selectedAP}`);
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    handleAPChange();  // Set up the event listener for dropdown change
});
