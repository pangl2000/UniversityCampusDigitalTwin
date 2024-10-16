import randomCoords
import latlonToUtm
import getElevation

import aiohttp
import asyncio
import schedule
import time

userIDs = []
activeUserIDs = []

areas = ['polygon1', 'polygon2', 'line00', 'line10', 'line20', 'line30', 'line40', 'line50', 'line60', 'line70', 'line80', 'line90']

# URL of the server where data needs to be sent
url = "http://localhost:5001"

async def send_post(session, resource_id, data):
    post_url = f"{url}/entity/{resource_id}"
    async with session.post(post_url, json={'data': data}) as response:
        if response.status == 201:
            print("Data created successfully with POST request")
            return True
        else:
            print(f"Failed to create data. Status code: {response.status}, Response: {await response.text()}")
            return False

async def send_patch(session, resource_id, data):
    patch_url = f"{url}/entity/{resource_id}"
    async with session.patch(patch_url, json={'data': data}) as response:
        if response.status == 200:
            print("Data updated successfully with PATCH request")
            return True
        else:
            print(f"Failed to update data. Status code: {response.status}, Response: {await response.text()}")
            if response.status == 404:
                print("Resource not found. Attempting to create with POST request.")
                return False
            return False

async def post_or_patch(session, resource_id, data):
    get_url = f"{url}/entity/{resource_id}"
    async with session.get(get_url) as response:
        if response.status == 200:
            json_doc = await response.json()
            data['x_old'] = json_doc['data']['x']
            data['y_old'] = json_doc['data']['y']
            data['z_old'] = json_doc['data']['z']
            print("Data found successfully with GET request")
            await send_patch(session, resource_id, data)
            return True
        else:
            print("Failed to find data. Sending POST request")
            await send_post(session, resource_id, data)
            return False

async def delete_inactive_users(session):
    global activeUserIDs
    get_url = f"{url}/entities"
    async with session.get(get_url) as response:
        if response.status == 200:
            json_doc = await response.json()
            tasks = []
            for entity in json_doc["data"]:
                if entity["id"] not in activeUserIDs:
                    tasks.append(delete_method(session, entity["id"]))
            if tasks:
                await asyncio.gather(*tasks)
            return True
        else:
            print("Failed to find data")
            return False

async def delete_method(session, resource_id):
    delete_url = f"{url}/entity/{resource_id}"
    async with session.delete(delete_url) as response:
        if response.status == 200:
            print("Data deleted successfully with DELETE request")
            return True
        else:
            print("Failed to delete data with id: " + resource_id)
            return False

async def send_requests():
    
    async with aiohttp.ClientSession() as session:
        # 1. Execute this request synchronously before proceeding
        
        tasks = []
        # 2. Create asynchronous tasks in the loop
        for i in range(0, len(areas)):
            point, area = randomCoords.uniSimulation(areas[i])
            if point is None:
                continue
            lat = point[0]
            lon = point[1]
            alt = getElevation.get_elevation(lat, lon)
            utmXY = latlonToUtm.fixedUEngineUnits(lat, lon)
            id = "FakeManny"+str(i)
            data = {
                "id": id, "x": utmXY[0] * 100, "y": utmXY[1] * 100, 
                "z": (10560.0 - (100 * 79.52169036865234) + (100 * alt)) + 200, 
                'x_old': 0, 'y_old': 0, 'z_old': 0, 
                "area": areas[i]
            }
            areas[i] = area
            # Append async task
            tasks.append(post_or_patch(session, id, data))
        
        # 3. Wait for all tasks in the loop to complete
        await asyncio.gather(*tasks)
        
        # 4. Execute this request synchronously after all loop tasks are done
        # await delete_inactive_users(session)

def job():
    asyncio.run(send_requests())

# Schedule the task to run periodically, e.g., every 10 seconds
schedule.every(5).seconds.do(job)

# Keep the script running
while True:
    schedule.run_pending()
    time.sleep(1)
