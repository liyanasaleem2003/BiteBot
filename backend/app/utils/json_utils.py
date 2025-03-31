import json
from datetime import datetime
from bson import ObjectId
from typing import Any

class JSONEncoder(json.JSONEncoder):
    """Custom JSON encoder that can handle MongoDB ObjectId and datetime objects."""
    def default(self, obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)

def json_dumps(obj: Any, **kwargs) -> str:
    """
    Convert a Python object to a JSON string, handling MongoDB ObjectId and datetime objects.
    
    Args:
        obj: The Python object to convert
        **kwargs: Additional arguments to pass to json.dumps
        
    Returns:
        A JSON string representation of the object
    """
    return json.dumps(obj, cls=JSONEncoder, **kwargs)

def json_loads(json_str: str, **kwargs) -> Any:
    """
    Convert a JSON string to a Python object.
    
    Args:
        json_str: The JSON string to convert
        **kwargs: Additional arguments to pass to json.loads
        
    Returns:
        A Python object representation of the JSON string
    """
    return json.loads(json_str, **kwargs)