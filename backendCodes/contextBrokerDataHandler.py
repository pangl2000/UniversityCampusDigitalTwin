import randomCoords
import latlonToUtm
import getElevation

import aiohttp
import asyncio
import schedule
import time

APs_retrieved = []
userIDs = []
activeUserIDs = []

AccessPoints = {
    "R0_EST-AP_0.1": [38.286049, 21.789461],
    "R0_EST-AP_0.2": [38.285868, 21.789490],
    "R0_EST-AP_0.3": [38.286073, 21.789858],
    "R0_EST-AP_0.4": [38.285812, 21.789901],
    "R0_AMF-AP_0.3": [38.285875, 21.790261]
}

areas = ['polygon1', 'polygon2', 'line00', 'line10', 'line20']

# URL of the NGSI v2 context broker (replace with actual public broker URL)
url = "http://150.140.186.118:1026/v2"

async def send_post(session, resource_id, data):
    post_url = f"{url}/entities/"
    headers = {
        "Content-Type": "application/json"
    }

    payload = {
        "id": f"DigitalTwinUser:{resource_id}",
        "type": "User",
        "x": {
            "type": "Number",
            "value": data['x']  # Longitude
        },
        "y": {
            "type": "Number",
            "value": data['y']  # Latitude
        },
        "z": {
            "type": "Number",
            "value": data['z']  # Altitude
        },
        "x_old": {
            "type": "Number",
            "value": data['x_old']
        },
        "y_old": {
            "type": "Number",
            "value": data['y_old']
        },
        "z_old": {
            "type": "Number",
            "value": data['z_old']  # Previous altitude
        },
        "area": {
            "type": "Text",
            "value": data['area']
        }
    }

    async with session.post(post_url, json=payload, headers=headers) as response:
        if response.status == 201:
            print(f"User {resource_id} created successfully with POST request")
            return True
        else:
            print(f"Failed to create user {resource_id}. Status code: {response.status}, Response: {await response.text()}")
            return False

async def send_patch(session, resource_id, data):
    patch_url = f"{url}/entities/DigitalTwinUser:{resource_id}/attrs"
    headers = {
        "Content-Type": "application/json"
    }

    payload = {
        "x": {
            "type": "Number",
            "value": data['x']  # Longitude
        },
        "y": {
            "type": "Number",
            "value": data['y']  # Latitude
        },
        "z": {
            "type": "Number",
            "value": data['z']  # Altitude
        },
        "x_old": {
            "type": "Number",
            "value": data['x_old']
        },
        "y_old": {
            "type": "Number",
            "value": data['y_old']
        },
        "z_old": {
            "type": "Number",
            "value": data['z_old']  # Previous altitude
        },
        "area": {
            "type": "Text",
            "value": data['area']
        }
    }

    async with session.patch(patch_url, json=payload, headers=headers) as response:
        if response.status == 204:
            print(f"User {resource_id} updated successfully with PATCH request")
            return True
        else:
            print(f"Failed to update user {resource_id}. Status code: {response.status}, Response: {await response.text()}")
            return False

async def post_or_patch(session, resource_id, data):
    get_url = f"{url}/entities/DigitalTwinUser:{resource_id}"
    headers = {
        "Accept": "application/json"
    }

    async with session.get(get_url, headers=headers) as response:
        if response.status == 200:
            # User exists, retrieve current location and update with patch
            json_doc = await response.json()
            data['x_old'] = json_doc.get('x', {}).get('value', 0)
            data['y_old'] = json_doc.get('y', {}).get('value', 0)
            data['z_old'] = json_doc.get('z', {}).get('value', 0)
            print(f"User {resource_id} found. Patching data.")
            await send_patch(session, resource_id, data)
            return True
        else:
            # User not found, create a new one
            data['x_old'] = 0
            data['y_old'] = 0
            data['z_old'] = 0
            print(f"User {resource_id} not found. Sending POST request.")
            await send_post(session, resource_id, data)
            return False

async def get_AP_data(session):
    global APs_retrieved
    global userIDs
    APurl = "http://150.140.186.118:1026/v2/entities/WLC_LESXI"
    async with session.get(APurl) as response:
        if response.status == 200:
            json_doc = await response.json()
            userIDs = json_doc["csvData"]["value"]["2"]["value"]
            APs_retrieved = json_doc["csvData"]["value"]["4"]["value"]
            return True
        else:
            print("Failed to retrieve data from the Access Point")
            return False

async def get_app_data(session):
    app_url = "http://localhost:5001/entities"
    async with session.get(app_url) as response:
        if response.status == 200:
            json_doc = await response.json()
            tasks = []
            data = json_doc["data"]
            for entity in data:
                tasks.append(post_or_patch(session, entity["id"], entity))
            if tasks:
                await asyncio.gather(*tasks)
            return True
        else:
            print("Failed to retrieve data from the app")
            return False

async def delete_inactive_users(session):
    global activeUserIDs
    get_url = f"{url}/entities?idPattern=^DigitalTwinUser&limit=1000"
    headers = {
        "Accept": "application/json"
    }

    async with session.get(get_url, headers=headers) as response:
        if response.status == 200:
            json_doc = await response.json()
            tasks = []
            for entity in json_doc:
                if entity["id"] not in activeUserIDs:
                    tasks.append(delete_method(session, entity["id"]))
            if tasks:
                await asyncio.gather(*tasks)
            return True
        else:
            print("Failed to retrieve users")
            return False

async def delete_method(session, resource_id):
    delete_url = f"{url}/entities/{resource_id}"
    headers = {
        "Accept": "application/json"
    }

    async with session.delete(delete_url, headers=headers) as response:
        if response.status == 204:
            print(f"User {resource_id} deleted successfully with DELETE request")
            return True
        else:
            print(f"Failed to delete user {resource_id}")
            return False

async def send_requests():
    global activeUserIDs
    global APs_retrieved
    global userIDs
    activeUserIDs = []
    
    async with aiohttp.ClientSession() as session:
        # 1. Fetch data from Access Points (APs)
        await get_AP_data(session)
        
        tasks = []
        # 2. For each AP, post or patch user data
        for i in range(0, len(APs_retrieved)):
            if APs_retrieved[i] in AccessPoints.keys():
                point = randomCoords.random_point_in_AP(APs_retrieved[i])
                if point is None:
                    continue
                lat = point[0]
                lon = point[1]
                alt = getElevation.get_elevation(lat, lon)
                utmXY = latlonToUtm.fixedUEngineUnits(lat, lon)
                user_id = userIDs[i]
                activeUserIDs.append(user_id)
                data = {
                    "id": user_id,
                    "x": utmXY[0] * 100,  # Longitude
                    "y": utmXY[1] * 100,  # Latitude
                    "z": (10560.0 - (100 * 79.52169036865234) + (100 * alt)) + 200, # Altitude
                    "x_old": 0,
                    "y_old": 0,
                    "z_old": 0,
                    "area": APs_retrieved[i]
                }
                
                # Append async task to post or patch user data
                tasks.append(post_or_patch(session, user_id, data))
        
        print(len(set(activeUserIDs)))
        # 3. Wait for all tasks in the loop to complete
        await asyncio.gather(*tasks)
        
        # 4. Delete inactive users
        await delete_inactive_users(session)

async def send_requests_often():
    async with aiohttp.ClientSession() as session:
        await get_app_data(session)

def AP_data():
    asyncio.run(send_requests())

def app_data():
    asyncio.run(send_requests_often())


# Schedule the task to run periodically, e.g., every 10 seconds
schedule.every(10).seconds.do(AP_data)
schedule.every(5).seconds.do(app_data)

# Keep the script running
while True:
    schedule.run_pending()
    time.sleep(1)
