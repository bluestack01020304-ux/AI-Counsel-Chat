import requests


class OllamaService:
    def __init__(self, base_url: str):
        self.base_url = base_url

    def chat(self, prompt: str):
        response = requests.post(
            f"{self.base_url}/api/generate",
            json={
                "model": "qwen3:8b",
                "prompt": prompt,
                "stream": False,
                "think": False,
            },
        )

        response.raise_for_status()

        print(response.json()["response"])
        return response.json()["response"]