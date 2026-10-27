document.addEventListener('DOMContentLoaded', () => {
  const chatInput = document.getElementById('chat-input');
  const sendBtn = document.getElementById('send-btn');
  const chatMessages = document.getElementById('chat-messages');
  const recommendWrapper = document.getElementById('recommend-wrapper');
  const chatList = document.getElementById('chat-list');
  const newChatBtn = document.getElementById('new-chat-btn');
  const logoutButton = document.getElementById("logout-btn");

  logoutButton.addEventListener("click", () => {
    localStorage.removeItem("access_token");
    window.location.href = "../html/login.html";
  });

  const BACKEND_URL = 'http://127.0.0.1:8000';

  const token = localStorage.getItem("access_token");
  if (!token) {
    window.location.href = "../html/login.html";
    return;
  }

  let currentChatTitle = null;
  let currentSessionId = null;

  // 토큰을 붙여서 요청, 토큰 만료 시 로그인 화면으로
  async function api(path, options = {}) {
    const response = await fetch(`${BACKEND_URL}/api/chat${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.status === 401) {
      localStorage.removeItem("access_token");
      window.location.href = "../html/login.html";
    }

    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.detail || '서버 응답 오류');
    return data;
  }

  async function sendMessage() {
    const question = chatInput.value.trim();    
    if (!question) return;

    if (recommendWrapper) recommendWrapper.style.display = 'none';
    chatMessages.style.display = 'flex';

    appendMessage('user', question);
    chatInput.value = '';

    const loadingMessageEl = appendMessage('ai', '곰곰이가 대답을 생각하고 있어요... 🐻');

    try {
      if (!currentSessionId) {
        const room = await api('/chatrooms/createRoom', {
          method: 'POST',
          body: JSON.stringify({ title: question })
        });
        currentSessionId = room.session_id;
        currentChatTitle = room.title;
        addChatHistory(room.title, room.session_id);
      }

      const data = await api('/ask', {
        method: 'POST',
        body: JSON.stringify({ question: question, session_id: currentSessionId })
      });

      loadingMessageEl.innerText = data.answer;

    } catch (error) {
      console.error('오류 발생:', error);
      loadingMessageEl.innerText = error instanceof TypeError
        ? "서버 연결에 실패했습니다. (백엔드 서버를 확인하세요)"
        : error.message;
    }
  }

  async function openChat(sessionId) {
    try {
      const room = await api(`/chatrooms/${sessionId}`);

      startNewChat();
      currentSessionId = room.session_id;
      currentChatTitle = room.title;

      if (recommendWrapper) recommendWrapper.style.display = 'none';
      chatMessages.style.display = 'flex';
      room.messages.forEach((m) => appendMessage(m.sender, m.message));
    } catch (error) {
      console.error('채팅방 불러오기 실패:', error);
    }
  }

  async function loadChatList() {
    try {
      const rooms = await api('/chatrooms');
      // addChatHistory가 맨 위에 추가하므로 오래된 방부터
      rooms.reverse().forEach((room) => addChatHistory(room.title, room.session_id));
    } catch (error) {
      console.error('채팅 목록 불러오기 실패:', error);
    }
  }

  function startNewChat() {
    chatMessages.innerHTML = '';
    chatMessages.style.display = 'none';

    if (recommendWrapper) recommendWrapper.style.display = 'block';

    chatInput.value = '';
    chatInput.focus();

    currentChatTitle = null;
    currentSessionId = null;
  }

  function appendMessage(sender, text) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message-bubble', sender);
    msgDiv.innerText = text;
    chatMessages.appendChild(msgDiv);
    
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return msgDiv;
  }

  function addChatHistory(title, sessionId) {
    const li = document.createElement('li');
    li.innerHTML = `
      <i class="fa-regular fa-folder"></i>
      <span class="chat-title"></span>
    `;
    li.querySelector('.chat-title').textContent = title;
    li.addEventListener('click', () => openChat(sessionId));
    chatList.prepend(li);
  }

  sendBtn.addEventListener('click', sendMessage);
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });

  if (newChatBtn) {
    newChatBtn.addEventListener('click', startNewChat);
  }

  loadChatList();
});