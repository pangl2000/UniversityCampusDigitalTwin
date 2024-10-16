from datetime import timedelta, timezone
import os
from flask import Flask
import datetime as dt
from pymongo import MongoClient
import json
from bson import json_util
from flask_restful import Api, Resource, reqparse
from collections import defaultdict

app = Flask(__name__)

api = Api(app)

# MongoDB configuration
mongo_uri = os.environ.get('MONGO_URI', 'mongodb://localhost:27017/')
client = MongoClient(mongo_uri)

# Select the database
db = client["externalDB"]

# Select the collection within the database
collection = db['collection']

parser = reqparse.RequestParser()
parser.add_argument('data', type=dict, help='Data to be posted or patched', required=True)

class EntityResourceMultipleInstances(Resource):
    def get(self):
        data = list(collection.find())
        if not data:
            return {'message': 'Entities not found'}, 404
        
        json_doc = json.loads(json_util.dumps(data))
        return {'message': 'Entities received', 'data': json_doc}, 200

class EntityResource(Resource):
    def get(self, entity_id):
        data = collection.find_one({'id': entity_id})
        if not data:
            return {'message': f'Entity with ID {entity_id} not found'}, 404
        
        json_doc = json.loads(json_util.dumps(data))
        return {'message': f'Entity with ID {entity_id} received', 'data': json_doc}, 200

    def post(self, entity_id):
        args = parser.parse_args()
        data = args['data']

        if collection.find_one({'id': entity_id}):
            return {'message': f'Entity with ID {entity_id} already exists'}, 400  # 400 Bad Request for duplication

        # Insert the new entity
        json_doc = json.loads(json_util.dumps(data))
        collection.insert_one(json_doc)
        return {'message': 'Entity posted successfully'}, 201  # 201 Created

    def patch(self, entity_id):
        args = parser.parse_args()
        data = args['data']

        existing_entity = collection.find_one({'id': entity_id})
        if not existing_entity:
            return {'message': f'Entity with ID {entity_id} not found'}, 404

        # Update the entity with the provided data
        for key, value in data.items():
            if key in existing_entity:
                existing_entity[key] = value

        existing_entity.pop('_id', None)
        existing_entity.pop('id', None)

        # Update the entity in the MongoDB collection
        json_document = json.loads(json_util.dumps(existing_entity))
        collection.update_one({'id': entity_id}, {'$set': json_document})
        return {'message': f'Entity with ID {entity_id} partially updated', 'data': existing_entity}, 200

    def delete(self, entity_id):
        existing_entity = collection.find_one({'id': entity_id})
        if not existing_entity:
            return {'message': f'Entity with ID {entity_id} not found'}, 404

        entityObjectId = existing_entity['_id']
        collection.delete_one({'_id': entityObjectId})

        # Return a success message for deletion
        return {'message': f'Entity with ID {entity_id} deleted'}, 200

# Add resources to the API
api.add_resource(EntityResource, '/entity/<string:entity_id>')
api.add_resource(EntityResourceMultipleInstances, '/entities')

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True, port=5001)
