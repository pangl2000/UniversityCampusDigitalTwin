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
appActiveUserIDs = []

AccessPoints = {
    "R0_EST-AP_0.1": [38.286049, 21.789461],
    "R0_EST-AP_0.2": [38.285868, 21.789490],
    "R0_EST-AP_0.3": [38.286073, 21.789858],
    "R0_EST-AP_0.4": [38.285812, 21.789901],
    "R0_AMF-AP_0.3": [38.285875, 21.790261]
}

# URL of the NGSI v2 context broker (replace with actual public broker URL)
url = "http://150.140.186.118:1026/v2"

async def send_post(session, resource_id, data):
    post_url = f"{url}/entities/"
    headers = {"Content-Type": "application/json"}

    payload = {
        "id": f"DigitalTwinUser:{resource_id}",
        "type": "User",
        "x": {"type": "Number", "value": data['x']},
        "y": {"type": "Number", "value": data['y']},
        "z": {"type": "Number", "value": data['z']},
        "x_old": {"type": "Number", "value": data['x_old']},
        "y_old": {"type": "Number", "value": data['y_old']},
        "z_old": {"type": "Number", "value": data['z_old']},
        "area": {"type": "Text", "value": data['area']}
    }

    async with session.post(post_url, json=payload, headers=headers) as response:
        if response.status == 201:
            print(f"User {resource_id} created successfully")
            return True
        else:
            print(f"Failed to create user {resource_id}. Status: {response.status}, Response: {await response.text()}")
            return False

async def send_patch(session, resource_id, data):
    patch_url = f"{url}/entities/DigitalTwinUser:{resource_id}/attrs"
    headers = {"Content-Type": "application/json"}

    payload = {
        "x": {"type": "Number", "value": data['x']},
        "y": {"type": "Number", "value": data['y']},
        "z": {"type": "Number", "value": data['z']},
        "x_old": {"type": "Number", "value": data['x_old']},
        "y_old": {"type": "Number", "value": data['y_old']},
        "z_old": {"type": "Number", "value": data['z_old']},
        "area": {"type": "Text", "value": data['area']}
    }

    async with session.patch(patch_url, json=payload, headers=headers) as response:
        if response.status == 204:
            print(f"User {resource_id} updated successfully")
            return True
        else:
            print(f"Failed to update user {resource_id}. Status: {response.status}, Response: {await response.text()}")
            return False

async def post_or_patch(session, resource_id, data):
    get_url = f"{url}/entities/DigitalTwinUser:{resource_id}"
    headers = {"Accept": "application/json"}

    async with session.get(get_url, headers=headers) as response:
        if response.status == 200:
            json_doc = await response.json()
            data['x_old'] = json_doc.get('x', {}).get('value', 0)
            data['y_old'] = json_doc.get('y', {}).get('value', 0)
            data['z_old'] = json_doc.get('z', {}).get('value', 0)
            await send_patch(session, resource_id, data)
        else:
            data['x_old'] = 0
            data['y_old'] = 0
            data['z_old'] = 0
            await send_post(session, resource_id, data)

async def get_AP_data(session):
    global APs_retrieved, activeUserIDs
    APurl = "http://150.140.186.118:1026/v2/entities/WLC_LESXI"
    async with session.get(APurl) as response:
        if response.status == 200:
            json_doc = await response.json()
            allUserIDs = json_doc["csvData"]["value"]["2"]["value"]
            allAPs_retrieved = json_doc["csvData"]["value"]["4"]["value"]
            activeUserIDs, APs_retrieved = [], []
            for i in range(len(allAPs_retrieved)):
                if allAPs_retrieved[i] in AccessPoints:
                    APs_retrieved.append(allAPs_retrieved[i])
                    activeUserIDs.append(allUserIDs[i])
        else:
            print("Failed to retrieve AP data")

async def get_app_data(session):
    global appActiveUserIDs
    app_url = "http://localhost:5001/entities"
    async with session.get(app_url) as response:
        if response.status == 200:
            json_doc = await response.json()
            tasks, entityIDs = [], []
            for entity in json_doc["data"]:
                entityIDs.append(entity["id"])
                if entity["id"] not in appActiveUserIDs:
                    appActiveUserIDs.append(entity["id"])
            appActiveUserIDs = [uid for uid in appActiveUserIDs if uid in entityIDs]
            tasks = [post_or_patch(session, entity["id"], entity) for entity in json_doc["data"]]
            if tasks:
                await asyncio.gather(*tasks)
            await delete_inactive_users(session)
        else:
            print("Failed to retrieve app data")

async def delete_inactive_users(session):
    global activeUserIDs, appActiveUserIDs
    get_url = f"{url}/entities?idPattern=^DigitalTwinUser&limit=1000"
    headers = {"Accept": "application/json"}

    async with session.get(get_url, headers=headers) as response:
        if response.status == 200:
            json_doc = await response.json()
            tasks = []
            for entity in json_doc:
                # Remove 'DigitalTwinUser:' prefix for comparison
                raw_user_id = entity["id"].replace("DigitalTwinUser:", "")
                
                # Check if user is not in either list
                if raw_user_id not in activeUserIDs and raw_user_id not in appActiveUserIDs:
                    print(f"Marking user {raw_user_id} for deletion")
                    tasks.append(delete_method(session, raw_user_id))  # Pass raw ID for deletion
            if tasks:
                await asyncio.gather(*tasks)
        else:
            print("Failed to retrieve users")


async def delete_method(session, resource_id):
    delete_url = f"{url}/entities/DigitalTwinUser:{resource_id}"
    headers = {"Accept": "application/json"}

    async with session.delete(delete_url, headers=headers) as response:
        if response.status == 204:
            print(f"User {resource_id} deleted successfully")
        else:
            print(f"Failed to delete user {resource_id}")

async def send_requests():
    async with aiohttp.ClientSession() as session:
        await get_AP_data(session)
        tasks = []
        for i in range(len(APs_retrieved)):
            point = randomCoords.random_point_in_AP(APs_retrieved[i])
            if point is None:
                continue
            lat, lon = point[0], point[1]
            alt = getElevation.get_elevation(lat, lon)
            utmXY = latlonToUtm.fixedUEngineUnits(lat, lon)
            user_id = activeUserIDs[i]
            data = {
                "id": user_id,
                "x": utmXY[0] * 100,
                "y": utmXY[1] * 100,
                "z": (10560.0 - (100 * 79.52169036865234) + (100 * alt)) + 200,
                "x_old": 0,
                "y_old": 0,
                "z_old": 0,
                "area": APs_retrieved[i]
            }
            tasks.append(post_or_patch(session, user_id, data))
        await asyncio.gather(*tasks)
        await delete_inactive_users(session)

async def send_requests_often():
    async with aiohttp.ClientSession() as session:
        await get_app_data(session)

def AP_data():
    asyncio.run(send_requests())

def app_data():
    asyncio.run(send_requests_often())

# Schedule tasks to run periodically
schedule.every(10).seconds.do(AP_data)
schedule.every(5).seconds.do(app_data)

# Keep the script running
while True:
    schedule.run_pending()
    time.sleep(1)
