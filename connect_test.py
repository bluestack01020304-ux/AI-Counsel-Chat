import requests


BASE_URL = "https://experiments-pads-interest-willow.trycloudflare.com"

r = requests.get(f"{BASE_URL}/api/tags")

print(r.status_code)
print(r.text)