from flask import Flask, jsonify, request, Response
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error
from dotenv import load_dotenv
import os
from datetime import datetime, timedelta
from collections import defaultdict
import json
import matplotlib.pyplot as plt
import io
from matplotlib.backends.backend_agg import FigureCanvasAgg as FigureCanvas

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
# Allow requests from any origin
CORS(app, resources={r"/*": {"origins": "*"}})

class Measurement:
    def __init__(self, datetime, json_data):
        self.datetime = datetime
        try:
            self.json_data = json.loads(json_data)
        except json.JSONDecodeError:
            self.json_data = None
            print(f"Failed to decode JSON: {json_data}")

def perform_analysis(measurement):
    ap_dict = defaultdict(int)

    # Check if "4" key exists and contains "value"
    if "4" in measurement.json_data and "value" in measurement.json_data["4"]:
        for entry in measurement.json_data["4"]["value"]:
            if "empty_cell" in str(entry):
                continue
            ap_dict[str(entry)] += 1
    else:
        # Debugging output for when the expected structure is not present
        print(f"Key '4' or 'value' missing in data: {measurement.json_data}")
    
    return ap_dict

@app.route('/api/get_ap_history', methods=['GET'])
def get_ap_history():
    try:
        # Fetch database connection details from environment variables
        db_host = os.getenv('DB_HOST')
        db_port = os.getenv('DB_PORT')
        db_user = os.getenv('DB_USER')
        db_password = os.getenv('DB_PASSWORD')
        db_name = os.getenv('DB_NAME')

        # Establish a connection to the MySQL database
        connection = mysql.connector.connect(
            host=db_host,
            port=db_port,
            user=db_user,
            password=db_password,
            database=db_name
        )

        if connection.is_connected():
            cursor = connection.cursor()

            # Find the most recent entry's timestamp
            cursor.execute("SELECT MAX(recvTimeTs) FROM WLC_LESXI_WLCdata")
            last_entry_timestamp = float(cursor.fetchone()[0])
            last_entry_datetime = datetime.fromtimestamp(last_entry_timestamp / 1000.0)  # Assuming timestamp is in milliseconds

            # Calculate 7 days before the last entry
            start_time = last_entry_datetime - timedelta(hours=24 * 7)

            # Query to fetch all entries from the last 7 days from the most recent entry
            cursor.execute("""
                SELECT attrName, attrValue, recvTimeTs
                FROM WLC_LESXI_WLCdata 
                WHERE recvTimeTs BETWEEN %s AND %s 
                ORDER BY recvTimeTs DESC
            """, (
                int(start_time.timestamp() * 1000),
                int(last_entry_datetime.timestamp() * 1000)
            ))

            results = cursor.fetchall()
            measurements = []
            paired_entries = {}

            # Group entries by recvTimeTs
            for name, value, recv_time_ts in results:
                if recv_time_ts not in paired_entries:
                    paired_entries[recv_time_ts] = {}
                if name == 'DateTime':
                    paired_entries[recv_time_ts]['datetime'] = datetime.strptime(value, '%Y-%m-%dT%H:%M:%S.%fZ')
                elif name == 'csvData':
                    paired_entries[recv_time_ts]['json_data'] = value

            # Create Measurement objects from paired entries
            for entry in paired_entries.values():
                if 'datetime' in entry and 'json_data' in entry:
                    measurements.append(Measurement(entry['datetime'], entry['json_data']))
                else:
                    print("Problem, missing corresponding attributes")

            aps_snapshots = []
            aps_datetimes = []
            aps_names = set()

            for measurement in measurements:
                for key in perform_analysis(measurement):
                    aps_names.add(key)

            for measurement in measurements:
                result = perform_analysis(measurement)
                for key in aps_names:
                    if key not in result:
                        result[key] = -1
                aps_snapshots.append(result)
                aps_datetimes.append(measurement.datetime)

            aps_history = defaultdict(list)
            for status in aps_snapshots:
                for ap in status:
                    aps_history[ap].append(status[ap])

            # Close the cursor and connection
            cursor.close()
            connection.close()

            # Convert the results to a dictionary for JSON response
            response = {
                'aps_history': dict(aps_history),
                'aps_datetimes': [dt.strftime('%Y-%m-%dT%H:%M:%S') for dt in aps_datetimes]
            }
            return jsonify(response)

    except Error as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
