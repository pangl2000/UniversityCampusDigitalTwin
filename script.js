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

// Function to generate a unique identifier for each session
function generateUniqueIdentifier() {
    return Date.now();  // Use a simple timestamp as a session ID
}

// Function to start the stream by sending a request to the server
function startStream(streamType, sessionId) {
    const query = new URLSearchParams({
        streamType,
        sessionId,
    }).toString();

    fetch(`http://localhost:8888/start-stream?${query}`)
        .then(response => response.text())
        .then(result => console.log(result))
        .catch(error => console.error('Error starting stream:', error));
}

// Function to stop the stream by sending a request to the server
function stopStream(sessionId) {
    fetch(`http://localhost:8888/stop-stream?sessionId=${sessionId}`)
        .then(response => response.text())
        .then(result => console.log(result))
        .catch(error => console.error('Error stopping stream:', error));
}

// Function to handle page switching with sliding transitions
function switchPage(fromPage, toPage, streamType = null, direction = 'left') {
    let sessionId = generateUniqueIdentifier();  // Generate a session ID

    // Store sessionId as a data attribute on the toPage
    toPage.setAttribute('data-session-id', sessionId);

    let outTransform, inTransform;

    if (direction === 'left') {
        outTransform = 'translateX(-100%)'; // Slide out to the left
        inTransform = 'translateX(100%)';   // Slide in from the right
    } else {
        outTransform = 'translateX(100%)';  // Slide out to the right
        inTransform = 'translateX(-100%)';  // Slide in from the left
    }

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
                startStream(streamType, sessionId);
            }
        }, 500); // Matches CSS transition duration
    }, 50); // Small delay to trigger transition
}

// Function to return to the overview and stop the stream
function backToOverview(fromPage) {
    if (fromPage.id === "static-page" || fromPage.id === "dynamic-page") {
        const sessionId = fromPage.getAttribute('data-session-id');  // Get the sessionId from the page's data attribute

        if (sessionId) {
            stopStream(sessionId);  // Stop the stream using session ID
        }
    }
    switchPage(fromPage, overviewPage, null, 'right');
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
const apNames = ["R0_EST-AP_0.1", "R0_EST-AP_0.2", "R0_EST-AP_0.3", "R0_EST-AP_0.4", "R0_AMF-AP_0.3"];

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
            responsive: false,
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
async function fetchAPHistory() {
    const fetchStatus = document.getElementById('fetch-status');

    fetchStatus.textContent = 'Waiting for data to be retrieved...';

    try {
        const response = await fetch(`http://127.0.0.1:8888/get_historical_data`);
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();

        console.log("Fetched history data for APs:", data);

        window.apData = data;

        fetchStatus.textContent = 'Data retrieved, you can proceed to select Access Point.';

    } catch (error) {
        console.error('Error fetching AP history:', error);

        fetchStatus.textContent = 'Error fetching data. Please try again.';
    }
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
                plotSpots(datetimes, apHistory, selectedAP);
            } else {
                console.error(`No data available for selected AP: ${selectedAP}`);
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    handleAPChange();
});
