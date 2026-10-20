from google import genai
from dotenv import load_dotenv
import os

load_dotenv()
print(os.getenv("GEMINI_API_KEY"))
client = None

def init():
    global client

    client = genai.Client(api_key="AQ.Ab8RN6IuEgToNLMmEnub4CUuxSxUDJSFcrMCByMxR7JJIhQ0Xw")
    return client

def chat(question: str, context: str):
    if(client == None):
        print("Init 안됐습니다")

    prompt = f"""
너는 학생에 진로 고민을 상담해주는 AI이다.

아래 자료를 참고하여 대답하라

[참고자료]
{context}
["참고자료 끝]

학생의 질문:
{question}

참고 자료를 바탕으로 학생에게 이해하기 쉽게 설명해라"""

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )

    return response.text