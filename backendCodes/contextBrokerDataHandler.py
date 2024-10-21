import randomCoords
import latlonToUtm
import getElevation

import aiohttp
import asyncio
import schedule
import time

# Variables to store AP and app user data
APs_retrieved = []
APUserIDs = []
APNewLocations = []
APOldLocations = []
APAreas = []

appUserIDs = []
appNewLocations = []
appOldLocations = []
appAreas = []

# Define Access Points with their coordinates
AccessPoints = {
    "R0_EST-AP_0.1": [38.286049, 21.789461],
    "R0_EST-AP_0.2": [38.285868, 21.789490],
    "R0_EST-AP_0.3": [38.286073, 21.789858],
    "R0_EST-AP_0.4": [38.285812, 21.789901],
    "R0_AMF-AP_0.3": [38.285875, 21.790261]
}

# URL of the NGSI v2 context broker
url = "http://150.140.186.118:1026/v2"

# Function to format locations as "X={},Y={},Z={}"
def format_location(location):
    return {"X": location[0], "Y": location[1], "Z": location[2]}

# Function to send a POST request for creating a new entity
async def send_post(session, entityId, userIDs, new_locations, old_locations, areas):
    post_url = f"{url}/entities/"
    headers = {"Content-Type": "application/json"}
    
    # Format the locations
    formatted_new_locations = [format_location(loc) for loc in new_locations]
    formatted_old_locations = [format_location(loc) for loc in old_locations]

    # Payload for creating a DigitalTwinData entity
    data = {
        "id": f"DigitalTwinData:{entityId}",
        "type": "Data",
        "user_ids": {"type": "List", "value": userIDs},
        "new_locations": {"type": "List", "value": formatted_new_locations},
        "old_locations": {"type": "List", "value": formatted_old_locations},
        "areas": {"type": "List", "value": areas}
    }

    # Send the POST request
    async with session.post(post_url, json=data, headers=headers) as response:
        if response.status == 201:
            print(f"Entity with id {entityId} created successfully")
        else:
            print(f"Failed to create entity with id {entityId}. Status: {response.status}, Response: {await response.text()}")

# Function to send a PATCH request for updating an existing entity
async def send_patch(session, entityId, userIDs, new_locations, old_locations, areas):
    patch_url = f"{url}/entities/DigitalTwinData:{entityId}/attrs"
    headers = {"Content-Type": "application/json"}

    # Format the locations
    formatted_new_locations = [format_location(loc) for loc in new_locations]
    formatted_old_locations = [format_location(loc) for loc in old_locations]

    # Payload for updating a DigitalTwinData entity
    data = {
        "user_ids": {"type": "List", "value": userIDs},
        "new_locations": {"type": "List", "value": formatted_new_locations},
        "old_locations": {"type": "List", "value": formatted_old_locations},
        "areas": {"type": "List", "value": areas}
    }

    # Send the PATCH request
    async with session.patch(patch_url, json=data, headers=headers) as response:
        if response.status == 204:
            print(f"Entity with id {entityId} updated successfully")
        else:
            print(f"Failed to update entity with id {entityId}. Status: {response.status}, Response: {await response.text()}")

# Function to handle creating or updating entities based on current data
async def post_or_patch(session, userIDs, new_locations, old_locations, areas):
    # Fetch existing entities from the context broker
    get_url = f"{url}/entities?idPattern=DigitalTwinData:"
    headers = {"Accept": "application/json"}

    async with session.get(get_url, headers=headers) as response:
        if response.status == 200:
            print("Entities exist.")
            json_doc = await response.json()
            existing_ids = [entity["id"] for entity in json_doc]

            # Determine how many entities are needed, each handling up to 100 users
            required_entities_count = (len(userIDs) // 100) + (1 if len(userIDs) % 100 > 0 else 0)

            print("Deleting entities not needed.")
            # Delete excess entities if the required count is less than existing entities
            for idx in range(required_entities_count, len(existing_ids)):
                entityFullId = existing_ids[idx]
                async with session.delete(f"{url}/entities/{entityFullId}") as delete_response:
                    if delete_response.status == 204:
                        print(f"Deleted extra entity {entityFullId} successfully.")
                    else:
                        print(f"Failed to delete extra entity {entityFullId}. Status: {delete_response.status}")

            print("Create or update entities needed.")
            # Create or update required entities
            for i in range(required_entities_count):
                batch_userIDs = userIDs[i * 100:(i + 1) * 100]
                batch_new_locations = new_locations[i * 100:(i + 1) * 100]
                batch_old_locations = old_locations[i * 100:(i + 1) * 100]
                batch_areas = areas[i * 100:(i + 1) * 100]

                if not batch_userIDs:
                    continue

                entityId = str(i)
                entityFullId = f"DigitalTwinData:{entityId}"

                # Update if the entity already exists; otherwise, create a new one
                if entityFullId in existing_ids[:required_entities_count]:
                    print("Sending patch request.")
                    await send_patch(session, entityId, batch_userIDs, batch_new_locations, batch_old_locations, batch_areas)
                else:
                    print("Sending post request.")
                    await send_post(session, entityId, batch_userIDs, batch_new_locations, batch_old_locations, batch_areas)
        else:
            # If retrieving existing entities fails, create a new entity as fallback
            print("No entities exist. Sending http post request.")
            await send_post(session, "0", userIDs, new_locations, old_locations, areas)

# Fetch data from the app and store it globally
async def get_app_data(session):
    global appUserIDs, appNewLocations, appOldLocations, appAreas
    app_url = "http://localhost:5001/entities"
    async with session.get(app_url) as response:
        if response.status == 200:
            json_doc = await response.json()
            appUserIDs, appNewLocations, appOldLocations, appAreas = [], [], [], []
            # Extract user data and store in global variables
            for entity in json_doc["data"]:
                appUserIDs.append(entity["id"])
                appNewLocations.append([entity["x"], entity["y"], entity["z"]])
                appOldLocations.append([entity["x_old"], entity["y_old"], entity["z_old"]])
                appAreas.append(entity["area"])
            print("Retrieved app data")
        else:
            print("Failed to retrieve app data")

# Fetch AP data and update global variables every 30 seconds
async def update_AP_data():
    global APs_retrieved, APUserIDs, APNewLocations, APOldLocations, APAreas
    
    # Temporary local storage for the new data
    local_APs_retrieved = []
    local_APUserIDs = []
    local_new_locations = []
    local_old_locations = []
    local_areas = []
    
    # (X, Y) coords to be used for get_elevations
    xyCoords = []
    existing_data = {}

    async with aiohttp.ClientSession() as session:
        # Retrieve existing entities and map user_ids to their new_locations
        get_url = f"{url}/entities?idPattern=^DigitalTwinData"
        headers = {"Accept": "application/json"}
        async with session.get(get_url, headers=headers) as response:
            if response.status == 200:
                json_doc = await response.json()
                for entity in json_doc:
                    for user_id, loc in zip(entity["user_ids"]["value"], entity["new_locations"]["value"]):
                        existing_data[user_id] = loc
                print("Retrieved existing DigitalTwinData entities")
            else:
                print("Failed to retrieve existing DigitalTwinData entities")

        # Fetch the AP data
        APurl = "http://150.140.186.118:1026/v2/entities/WLC_LESXI"
        async with session.get(APurl) as response:
            if response.status == 200:
                json_doc = await response.json()
                allUserIDs = json_doc["csvData"]["value"]["2"]["value"]
                allAPs_retrieved = json_doc["csvData"]["value"]["4"]["value"]
                
                # Filter and store only valid AP data in local variables
                for i in range(len(allAPs_retrieved)):
                    if allAPs_retrieved[i] in AccessPoints:
                        local_APs_retrieved.append(allAPs_retrieved[i])
                        local_APUserIDs.append(allUserIDs[i])
                        point = randomCoords.random_point_in_AP(allAPs_retrieved[i])
                        if point is None:
                            continue
                        lat, lon = point[0], point[1]
                        xyCoords.append((lat, lon))

                # Get altitude of each point
                elevations = getElevation.get_elevations(xyCoords)

                # Prepare AP data with updated old_locations if available
                for i in range(len(local_APUserIDs)):
                    alt = elevations[i]
                    utmXY = latlonToUtm.fixedUEngineUnits(xyCoords[i][0], xyCoords[i][1])
                    user_id = local_APUserIDs[i]
                    new_loc = [utmXY[0] * 100, utmXY[1] * 100, (10560.0 - (100 * 79.52169036865234) + (100 * alt)) + 200]
                    local_new_locations.append(new_loc)
                    
                    # Use the existing new_location as old_location if user_id exists, otherwise use new_loc
                    if user_id in existing_data:
                        old_loc = existing_data[user_id]
                    else:
                        old_loc = {"X": new_loc[0], "Y": new_loc[1], "Z": new_loc[2]}
                    local_old_locations.append([old_loc.get("X"), old_loc.get("Y"), old_loc.get("Z")])
                    local_areas.append(local_APs_retrieved[i])

                # Update global variables with the new data
                APs_retrieved[:] = local_APs_retrieved
                APUserIDs[:] = local_APUserIDs
                APNewLocations[:] = local_new_locations
                APOldLocations[:] = local_old_locations
                APAreas[:] = local_areas

                print("Retrieved and updated AP data with locations")
            else:
                print("Failed to retrieve AP data")

# Function to manage data fetching and updating from apps and APs every 5 seconds
async def send_requests():
    # Variables to store combined data for entities
    userIDs = []
    new_locations = []
    old_locations = []
    areas = []

    # Combine AP data
    userIDs.extend(APUserIDs)
    new_locations.extend(APNewLocations)
    old_locations.extend(APOldLocations)
    areas.extend(APAreas)

    # Get app data and merge it into the combined data
    async with aiohttp.ClientSession() as session:
        await get_app_data(session)
        userIDs.extend(appUserIDs)
        new_locations.extend(appNewLocations)
        old_locations.extend(appOldLocations)
        areas.extend(appAreas)

        # Send requests to update or create entities
        await post_or_patch(session, userIDs, new_locations, old_locations, areas)

# Scheduler functions to run periodically
def AP_data():
    asyncio.run(update_AP_data())

def app_data():
    asyncio.run(send_requests())

# Call update_AP_data once before scheduling
asyncio.run(update_AP_data())

# Schedule tasks to run every 30 seconds for AP data and every 5 seconds for app data
schedule.every(30).seconds.do(AP_data)
schedule.every(5).seconds.do(app_data)

# Keep the script running
while True:
    schedule.run_pending()
    time.sleep(1)
