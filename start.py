"""
Quick start script for the Scholarship Match backend
"""
import subprocess
import sys

if __name__ == "__main__":
    print("Starting Scholarship Match Backend...")
    print("API will be available at http://localhost:8000")
    print("API Docs at http://localhost:8000/docs")
    print("\nPress Ctrl+C to stop the server\n")
    
    try:
        subprocess.run([
            sys.executable, "-m", "uvicorn", 
            "app.main:app", 
            "--reload", 
            "--port", "8000"
        ])
    except KeyboardInterrupt:
        print("\n\nServer stopped.")
