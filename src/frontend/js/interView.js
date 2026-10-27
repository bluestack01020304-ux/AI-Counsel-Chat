document.addEventListener('DOMContentLoaded', () => {
  const typeList = document.getElementById('type-list');
  const suggestChips = document.getElementById('suggest-chips');
  const chatBox = document.getElementById('interview-chat');
  const chatEmpty = document.getElementById('chat-empty');
  const input = document.getElementById('interview-input');
  const sendBtn = document.getElementById('interview-send-btn');
  const newInterviewBtn = document.getElementById('new-interview-btn');
  const historyList = document.getElementById('history-list');

  const interviewTypes = {
    personality: {
      name: '인성 면접',
      questions: [
        '인성 면접에서 자주 나오는 질문이 뭐야?',
        '갈등 해결 경험은 어떻게 답하면 좋아?',
        '나의 장단점을 말할 때 주의할 점은?',
      ],
    },
    major: {
      name: '전공 적합성 면접',
      questions: [
        '전공 적합성 면접은 어떻게 준비해?',
        '지원 학과 관련 시사 이슈를 어떻게 정리할까?',
        '전공 관련 활동이 부족하면 어떻게 답해?',
      ],
    },
    record: {
      name: '학생부 기반 면접',
      questions: [
        '학생부 기반 면접은 어떤 식으로 질문이 나와?',
        '세특 내용을 면접 답변으로 연결하는 방법은?',
        '학생부에서 예상 질문을 뽑는 방법 알려줘',
      ],
    },
    intro: {
      name: '자기소개 · 지원동기',
      questions: [
        '1분 자기소개 구조를 알려줘',
        '지원동기를 진정성 있게 말하는 방법은?',
        '입학 후 학업 계획은 어떻게 말해야 해?',
      ],
    },
    pressure: {
      name: '압박 면접',
      questions: [
        '압박 면접에서 당황하지 않는 방법은?',
        '모르는 질문을 받으면 어떻게 대처해?',
        '내 답변을 반박당하면 어떻게 말해야 해?',
      ],
    },
  };

  let currentType = 'personality';
  let sessionStarted = false;

  renderSuggestions();
  fetchUserName();

  typeList.addEventListener('click', (e) => {
    const li = e.target.closest('li');
    if (!li) return;

    typeList.querySelectorAll('li').forEach(item => item.classList.remove('active'));
    li.classList.add('active');
    currentType = li.dataset.type;
    renderSuggestions();
  });

  function renderSuggestions() {
    suggestChips.innerHTML = '';

    const mockChip = document.createElement('button');
    mockChip.className = 'suggest-chip mock';
    mockChip.innerHTML = '<i class="fa-solid fa-play"></i> 모의 면접 질문 받기';
    mockChip.addEventListener('click', () => {
      sendQuestion(`${interviewTypes[currentType].name} 모의 면접을 시작하려고 해. 면접관처럼 예상 질문을 하나 해주고, 내가 답하면 피드백해줘.`);
    });
    suggestChips.appendChild(mockChip);

    interviewTypes[currentType].questions.forEach(q => {
      const chip = document.createElement('button');
      chip.className = 'suggest-chip';
      chip.textContent = q;
      chip.addEventListener('click', () => sendQuestion(q));
      suggestChips.appendChild(chip);
    });
  }

  function buildPrompt(question) {
    return `[실전 면접 대비] 면접 유형: ${interviewTypes[currentType].name}\n질문: ${question}`;
  }

  async function sendQuestion(question) {
    question = question.trim();
    if (!question || sendBtn.disabled) return;

    if (!sessionStarted) {
      sessionStarted = true;
      addHistory(question);
    }

    chatEmpty.hidden = true;
    appendMessage('user', question);
    input.value = '';
    resizeInput();

    const loadingEl = appendMessage('ai', '곰곰이 면접 코치가 생각하고 있어요... 🐻');
    loadingEl.classList.add('loading');
    sendBtn.disabled = true;

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ question: buildPrompt(question) })
      });

      if (!response.ok) throw new Error('서버 응답 오류');

      const data = await response.json();
      loadingEl.innerText = data.answer;
    } catch (error) {
      console.error('오류 발생:', error);
      loadingEl.innerText = '서버 연결에 실패했습니다. (백엔드 서버를 확인하세요)';
    } finally {
      loadingEl.classList.remove('loading');
      sendBtn.disabled = false;
      input.focus();
    }
  }

  function appendMessage(sender, text) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message-bubble', sender);
    msgDiv.innerText = text;
    chatBox.appendChild(msgDiv);

    chatBox.scrollTop = chatBox.scrollHeight;
    return msgDiv;
  }

  function addHistory(title) {
    const li = document.createElement('li');
    li.innerHTML = `
      <i class="fa-regular fa-folder"></i>
      <span class="chat-title"></span>
    `;
    li.querySelector('.chat-title').textContent = title;
    historyList.prepend(li);
  }

  function startNewInterview() {
    chatBox.querySelectorAll('.message-bubble').forEach(el => el.remove());
    chatEmpty.hidden = false;
    input.value = '';
    resizeInput();
    input.focus();
    sessionStarted = false;
  }

  function resizeInput() {
    input.style.height = 'auto';
    input.style.height = `${input.scrollHeight}px`;
  }

  async function fetchUserName() {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) return;

      const userData = await response.json();
      document.getElementById('user-name').textContent = userData.name || userData.username || '사용자';
    } catch (error) {
      console.error('사용자 정보 로드 오류:', error);
    }
  }

  sendBtn.addEventListener('click', () => sendQuestion(input.value));
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      sendQuestion(input.value);
    }
  });
  input.addEventListener('input', resizeInput);
  newInterviewBtn.addEventListener('click', startNewInterview);
});
