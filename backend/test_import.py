import sys
print("Python path:", sys.path)
try:
    from app.main import app
    print("Successfully imported app.main")
except ImportError as e:
    print("Import error:", str(e)) 