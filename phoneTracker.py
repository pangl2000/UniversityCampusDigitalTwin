import requests
import json
from pyproj import Proj
from geopy.geocoders import Nominatim
from time import sleep

# API key for Google Maps Elevation API
apiKey = 'AIzaSyCLAWIkU-GBgvdeIo7vMlgASFZQEp55RZo'
originLatitude = 38.285720
originLongitude = 21.789350

# Function to get elevation from Google Maps API
def get_elevation(lat, lng):
    url = f"https://maps.googleapis.com/maps/api/elevation/json?locations={lat},{lng}&key={apiKey}"
    try:
        response = requests.get(url)
        data = response.json()
        if data['results'] and len(data['results']) > 0:
            return data['results'][0]['elevation']
        else:
            return None
    except Exception as error:
        print(f"Error fetching elevation data: {error}")
        return None

# Function to convert latitude and longitude to UTM coordinates
def latlon_to_utm(latitude, longitude):
    utm_projection = Proj(proj='utm', zone=34, ellps='WGS84', units='m', no_defs=True)
    utmX, utmY = utm_projection(longitude, latitude)
    return {'utmX': utmX, 'utmY': utmY}

# Function to calculate fixed Unreal Engine units
def fixed_uengine_units(lat, lon):
    origin = latlon_to_utm(originLatitude, originLongitude)
    real = latlon_to_utm(lat, lon)
    fixedX = real['utmX'] - origin['utmX']
    fixedY = origin['utmY'] - real['utmY']
    return {'fixedX': fixedX, 'fixedY': fixedY}

# Function to generate data to post
def generate_data(x, y, z, x_old, y_old, z_old):
    return {
        "id": "DigitalTwinUser:PhoneManny",
        "type": "User",
        "x": {"type": "Number", "value": x},  # Longitude
        "y": {"type": "Number", "value": y},  # Latitude
        "z": {"type": "Number", "value": z},  # Altitude
        "x_old": {"type": "Number", "value": x_old},
        "y_old": {"type": "Number", "value": y_old},
        "z_old": {"type": "Number", "value": z_old},
        "area": {"type": "Text", "value": "Unknown"}
    }

# Function to send an HTTP GET request to retrieve data
def get_data():
    url = 'http://150.140.186.118:1026/v2/entities/DigitalTwinUser:PhoneManny'
    try:
        response = requests.get(url, headers={'Content-Type': 'application/json'})
        if response.ok:
            return response.json()
        else:
            print(f"Failed to retrieve data: {response.status_code}")
            return None
    except Exception as error:
        print(f"Error: {error}")
        return None

# Function to send data to the context broker via POST
def post_data(data):
    url = 'http://150.140.186.118:1026/v2/entities/'
    try:
        response = requests.post(url, headers={'Content-Type': 'application/json'}, data=json.dumps(data))
        if response.ok:
            print(f"Data posted successfully at {time.strftime('%H:%M:%S')}")
        else:
            print(f"Failed to post data at {time.strftime('%H:%M:%S')}")
    except Exception as error:
        print(f"Error: {error}")

# Function to send data to the context broker via PATCH
def patch_data(data):
    url = 'http://150.140.186.118:1026/v2/entities/DigitalTwinUser:PhoneManny/attrs'
    try:
        response = requests.patch(url, headers={'Content-Type': 'application/json'}, data=json.dumps(data))
        if response.ok:
            print(f"Data patched successfully at {time.strftime('%H:%M:%S')}")
        else:
            print(f"Failed to patch data at {time.strftime('%H:%M:%S')}")
    except Exception as error:
        print(f"Error: {error}")

# Function to upload data (POST or PATCH based on existence)
def upload_data(lat, lon):
    alt = get_elevation(lat, lon)
    fixed_units = fixed_uengine_units(lat, lon)
    x_old, y_old, z_old = 0, 0, 0
    
    old_data = get_data()
    if old_data is not None:
        x_old = old_data['x']['value']
        y_old = old_data['y']['value']
        z_old = old_data['z']['value']

    data = generate_data(fixed_units['fixedX'], fixed_units['fixedY'], alt, x_old, y_old, z_old)

    if old_data is None:
        post_data(data)
    else:
        patch_data(data)

# Function to get the current location using Geopy and post data
def get_location_and_post_data():
    geolocator = Nominatim(user_agent="geoapiExercises")
    location = geolocator.geocode("Your Location Address")
    if location is not None:
        lat, lon = location.latitude, location.longitude
        upload_data(lat, lon)
    else:
        print("Location not found")

# Continuously get location and post data every 5 seconds
while True:
    get_location_and_post_data()
    sleep(5)
