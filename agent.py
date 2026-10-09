import time
import requests
import functools
import threading
import random

class MoniOpenClient:
    def __init__(self, endpoint="http://localhost:3001/api/v1/heartbeat", bot_id="python-agent"):
        self.endpoint = endpoint
        self.bot_id = bot_id

    def send_heartbeat(self, status="Healthy", latency=0.0):
        try:
            payload = {
                "botId": self.bot_id,
                "status": status,
                "latency": round(latency, 2)
            }
            response = requests.post(self.endpoint, json=payload, timeout=2)
            if response.status_code == 200:
                print(f"[MoniOpen] Heartbeat sent: {status} ({latency:.2f}ms)")
            else:
                print(f"[MoniOpen] Error: {response.status_code}")
        except Exception as e:
            print(f"[MoniOpen] Connection failed: {str(e)}")

def track_performance(client):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            start = time.time()
            try:
                result = func(*args, **kwargs)
                latency = (time.time() - start) * 1000
                client.send_heartbeat(status="Healthy", latency=latency)
                return result
            except Exception as e:
                latency = (time.time() - start) * 1000
                client.send_heartbeat(status=f"ERROR: {str(e)}", latency=latency)
                raise
        return wrapper
    return decorator

if __name__ == "__main__":
    print("Iniciando MoniOpen Agent Simulator...")
    bots = ["roblox-tracker", "bot-discord", "errorcito-viales"]
    
    def simulate_bot(bot_id):
        client = MoniOpenClient(bot_id=bot_id)
        while True:
            latency = random.uniform(30.0, 80.0)
            client.send_heartbeat("Healthy", latency)
            time.sleep(random.uniform(2.0, 5.0))

    threads = []
    for bot in bots:
        t = threading.Thread(target=simulate_bot, args=(bot,))
        t.daemon = True
        t.start()
        threads.append(t)

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("Agent stopped.")
