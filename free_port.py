"""
Free a port by killing any process listening on it.
Usage: python free_port.py <port>
Example: python free_port.py 5173
"""
#to limit the testing port to 5137 
import subprocess
import sys
import time

def main():
    if len(sys.argv) < 2:
        return 0
    try:
        port = sys.argv[1]
        r = subprocess.run(
            ["netstat", "-ano"],
            capture_output=True, text=True, timeout=10
        )
        if r.returncode != 0:
            return 0
        for line in r.stdout.splitlines():
            if f":{port}" in line and "LISTENING" in line:
                parts = line.split()
                pid = parts[-1] if parts else None
                if pid and pid.isdigit() and pid != "0":
                    print(f"Port {port} in use by PID {pid} - freeing...")
                    subprocess.run(["taskkill", "/PID", pid, "/F"], capture_output=True, timeout=5)
                    time.sleep(2)
                    return 0
        return 0
    except Exception:
        return 0

if __name__ == "__main__":
    sys.exit(main())
