import requests

def get_elevation(lat, lng):
    # Replace 'YOUR_API_KEY' with your actual Google Maps API key
    api_key = 'AIzaSyCLAWIkU-GBgvdeIo7vMlgASFZQEp55RZo'
    url = f'https://maps.googleapis.com/maps/api/elevation/json?locations={lat},{lng}&key={api_key}'
    response = requests.get(url)
    data = response.json()
    if 'results' in data and data['results']:
        elevation = data['results'][0]['elevation']
        return elevation
    else:
        return None

def get_elevations(locations):
    # Replace 'YOUR_API_KEY' with your actual Google Maps API key
    api_key = 'AIzaSyCLAWIkU-GBgvdeIo7vMlgASFZQEp55RZo'
    # Create a string of locations separated by '|'
    locations_str = '|'.join([f'{lat},{lng}' for lat, lng in locations])
    url = f'https://maps.googleapis.com/maps/api/elevation/json?locations={locations_str}&key={api_key}'
    response = requests.get(url)
    data = response.json()

    if 'results' in data:
        # Extract elevations for each location
        elevations = [result['elevation'] for result in data['results']]
        return elevations
    else:
        return None