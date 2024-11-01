// Page elements
const homePage = document.getElementById('home-page');
const overviewPage = document.getElementById('overview-page');
const staticPage = document.getElementById('static-page');
const dynamicPage = document.getElementById('dynamic-page');
const wifiPage = document.getElementById('wifi-page');
const contentContainer = document.getElementById('content-container');

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

    fetch(`http://${window.location.hostname}:8888/start-stream?${query}`)
        .then(response => response.text())
        .then(result => console.log(result))
        .catch(error => console.error('Error starting stream:', error));
}

// Function to stop the stream by sending a request to the server
function stopStream(sessionId) {
    fetch(`http://${window.location.hostname}:8888/stop-stream?sessionId=${sessionId}`)
        .then(response => response.text())
        .then(result => console.log(result))
        .catch(error => console.error('Error stopping stream:', error));
}

// Function to handle page switching with sliding transitions
function switchPage(fromPage, toPage, streamType = null, direction = 'left') {
    let sessionId = generateUniqueIdentifier();

    toPage.setAttribute('data-session-id', sessionId);

    let outTransform, inTransform;

    if (direction === 'left') {
        outTransform = 'translateX(-100%)';
        inTransform = 'translateX(100%)';
    } else {
        outTransform = 'translateX(100%)';
        inTransform = 'translateX(-100%)';
    }

    fromPage.style.transform = outTransform;
    fromPage.style.opacity = 0;

    toPage.style.display = 'block';
    toPage.style.transform = inTransform;
    toPage.style.opacity = 0;

    setTimeout(() => {
        toPage.style.transform = 'translateX(0)';
        toPage.style.opacity = 1;

        setTimeout(() => {
            toPage.classList.add('active');
            fromPage.classList.remove('active');
            fromPage.style.display = 'none';

            if (streamType) {
                startStream(streamType, sessionId);
            }
        }, 500);
    }, 50);
}

// Function to return to the overview and stop the stream
function backToOverview(fromPage) {
    if (fromPage.id === "static-page" || fromPage.id === "dynamic-page") {
        const sessionId = fromPage.getAttribute('data-session-id');

        if (sessionId) {
            stopStream(sessionId);
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
    }, 500);
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
});

// Back to overview from other pages
backToOverviewButtons.forEach(button => {
    button.addEventListener('click', (event) => {
        const currentPage = event.target.closest('.page');
        backToOverview(currentPage);
    });
});

// Elements for WiFi options
const viewDropdownButton = document.getElementById('view-dropdown');
const viewGrafanaButton = document.getElementById('view-grafana');

// List of Grafana dashboard options
const grafanaDashboards = {
    "Waiting Area": "http://iot.patras5g.eu:2222/d/ce15blg19l9fka/estia-people-traffic-data?orgId=1&from=1729502553676&to=1729675353677&viewPanel=4",
    "Restaurant": "http://iot.patras5g.eu:2222/d/ce15blg19l9fka/estia-people-traffic-data?orgId=1&from=1729502567765&to=1729675367765&viewPanel=2",
    "Combined (Waiting Area + Restaurant)": "http://iot.patras5g.eu:2222/d/ce15blg19l9fka/estia-people-traffic-data?orgId=1&from=1729502579739&to=1729675379739&viewPanel=1"
};

// Event listener for the dropdown button
viewDropdownButton.addEventListener('click', () => {
    contentContainer.innerHTML = '';

    const fetchStatus = document.createElement('p');
    fetchStatus.id = 'fetch-status';
    fetchStatus.textContent = 'Waiting for data to be retrieved...';
    contentContainer.appendChild(fetchStatus);

    const label = document.createElement('label');
    label.setAttribute('for', 'ap-selector');
    label.textContent = 'Choose an Access Point:';
    contentContainer.appendChild(label);

    const apSelector = document.createElement('select');
    apSelector.id = 'ap-selector';
    contentContainer.appendChild(apSelector);

    const graphContainer = document.createElement('div');
    graphContainer.id = 'wifi-graphs-container';
    contentContainer.appendChild(graphContainer);

    fetchAPHistory().then(() => {
        populateDropdown();
        handleAPChange();
    });
});

// Event listener for the Grafana button
viewGrafanaButton.addEventListener('click', () => {
    contentContainer.innerHTML = '';

    const grafanaLabel = document.createElement('label');
    grafanaLabel.setAttribute('for', 'grafana-selector');
    grafanaLabel.textContent = 'Select a Grafana Dashboard:';
    contentContainer.appendChild(grafanaLabel);

    const grafanaSelector = document.createElement('select');
    grafanaSelector.id = 'grafana-selector';
    contentContainer.appendChild(grafanaSelector);

    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select a dashboard';
    grafanaSelector.appendChild(defaultOption);

    // Populate the dropdown with dashboard options
    Object.keys(grafanaDashboards).forEach(key => {
        const option = document.createElement('option');
        option.value = grafanaDashboards[key];
        option.textContent = key;
        grafanaSelector.appendChild(option);
    });

    const grafanaContainer = document.createElement('div');
    grafanaContainer.id = 'grafana-iframe-container';
    contentContainer.appendChild(grafanaContainer);

    // Event listener for changing Grafana dashboard selection
    grafanaSelector.addEventListener('change', () => {
        const selectedUrl = grafanaSelector.value;

        if (selectedUrl) {
            grafanaContainer.innerHTML = '';
            const grafanaIframe = document.createElement('iframe');
            grafanaIframe.src = selectedUrl;
            grafanaIframe.width = '100%';
            grafanaIframe.height = '600px';
            grafanaIframe.style.border = 'none';
            grafanaContainer.appendChild(grafanaIframe);
        }
    });
});

// The list of AP names provided
const apNames = ["R0_EST-AP_0.1", "R0_EST-AP_0.2", "R0_EST-AP_0.3", "R0_EST-AP_0.4", "R0_AMF-AP_0.3"];

// Function to populate the dropdown menu with AP names
function populateDropdown() {
    const apSelector = document.getElementById('ap-selector');
    apSelector.innerHTML = '';

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

    console.log('Dropdown populated with AP names:', apNames);
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
    wifiGraphsContainer.innerHTML = '';

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
        const apiUrl = `http://${window.location.hostname}:8888/get_historical_data`;
        
        const response = await fetch(apiUrl);
        
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
