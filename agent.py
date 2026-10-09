import time
import functools
import requests
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

class MoniOpenClient:
    def __init__(self, bot_id, server_url="http://localhost:3001"):
        self.bot_id = bot_id
        self.server_url = server_url
        self.api_url = f"{server_url}/api/v1/heartbeat"
    
    def send_heartbeat(self, status="online", latency=0):
        try:
            payload = {
                "botId": self.bot_id,
                "status": status,
                "latency": latency
            }
            response = requests.post(self.api_url, json=payload, timeout=5)
            response.raise_for_status()
            logging.info(f"[{self.bot_id}] Heartbeat sent successfully.")
        except Exception as e:
            logging.error(f"[{self.bot_id}] Failed to send heartbeat: {e}")

def track_performance(client):
    """Decorador para medir el tiempo de ejecución y reportarlo."""
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            start_time = time.time()
            try:
                result = func(*args, **kwargs)
                latency = (time.time() - start_time) * 1000 # in ms
                client.send_heartbeat(status="online", latency=latency)
                return result
            except Exception as e:
                client.send_heartbeat(status="error")
                raise e
        return wrapper
    return decorator

if __name__ == "__main__":
    # Test block
    bots = ["roblox-tracker", "bot-discord", "errorcito-viales"]
    clients = {bot: MoniOpenClient(bot_id=bot) for bot in bots}
    
    @track_performance(clients["roblox-tracker"])
    def simulate_roblox_task():
        time.sleep(0.5)
        print("Roblox task executed.")

    @track_performance(clients["bot-discord"])
    def simulate_discord_task():
        time.sleep(0.2)
        print("Discord task executed.")

    @track_performance(clients["errorcito-viales"])
    def simulate_errorcito_task():
        time.sleep(0.8)
        print("Errorcito task executed.")
        
    print("Iniciando prueba de telemetría...")
    for _ in range(3):
        simulate_roblox_task()
        simulate_discord_task()
        simulate_errorcito_task()
        time.sleep(2)
