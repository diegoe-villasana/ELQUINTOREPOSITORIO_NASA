import requests
import json

url = 'http://127.0.0.1:5000/api/simulate'
payload = {
    "meteorite": {"diameter": 1000, "velocity": 20, "density": 3000, "angle": 45},
    "location": {"lat": 40.4168, "lng": -3.7038}
}

try:
    r = requests.post(url, json=payload, timeout=30)
    print('Status', r.status_code)
    try:
        print(json.dumps(r.json(), indent=2, ensure_ascii=False))
    except Exception:
        print(r.text)
except Exception as e:
    print('Error connecting to server:', e)
