from google import genai
from dotenv import load_dotenv
import os

load_dotenv()

client = None

def init():
    global client

    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
    return client

def _generate(prompt: str):
    if client is None:
        init()

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )

    return response.text

def chat(question: str, context: str, memory: str = "", history: list = None):
    # history: [(role, content), ...] 현재 채팅방의 최근 대화
    history_text = "\n".join(
        f"{'학생' if role == 'user' else '상담사'}: {content}" for role, content in (history or [])
    )

    prompt = f"""
너는 학생에 진로 고민을 상담해주는 AI이다.

아래 자료를 참고하여 대답하라

[참고자료]
{context}
[참고자료 끝]

[이 학생에 대해 기억하고 있는 내용]
{memory or "없음"}
[기억 끝]

[이번 상담의 이전 대화]
{history_text or "없음"}
[이전 대화 끝]

학생의 질문:
{question}

기억하고 있는 내용과 이전 대화를 이어서 상담하되, 참고 자료를 바탕으로 학생에게 이해하기 쉽게 설명해라
3문장 이내로 답변해라"""

    return _generate(prompt)

def summarize_memory(memory: str, question: str, answer: str):
    prompt = f"""
너는 학생 상담 기록을 정리하는 역할이다.
기존 기억에 새 대화에서 알게 된 내용을 반영해서, 다음 상담에 도움이 될 학생 정보를 정리하라.

- 학생의 고민, 관심 분야, 목표, 상황, 이전에 받은 조언 위주로 적어라
- 오래되었거나 바뀐 내용은 새 내용으로 고쳐라
- 상담과 관계없는 내용은 빼라
- 개조식으로 500자 이내로 써라. 정리한 내용만 출력하라

[기존 기억]
{memory or "없음"}

[새 대화]
학생: {question}
상담사: {answer}"""

    return _generate(prompt).strip()
