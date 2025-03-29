import json
from datetime import datetime
from bson import ObjectId

class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        if isinstance(obj, ObjectId):
            return str(obj)
        return super().default(obj)

def json_dumps(obj, **kwargs):
    """Custom JSON dumps function that handles datetime and ObjectId"""
    return json.dumps(obj, cls=CustomJSONEncoder, **kwargs)

def json_loads(s, **kwargs):
    """Custom JSON loads function that handles datetime and ObjectId"""
    return json.loads(s, **kwargs) 