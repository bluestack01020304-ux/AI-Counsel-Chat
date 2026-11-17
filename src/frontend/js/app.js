document.addEventListener('DOMContentLoaded', () => {
  const chatInput = document.getElementById('chat-input');
  const sendBtn = document.getElementById('send-btn');
  const chatMessages = document.getElementById('chat-messages');
  const recommendWrapper = document.getElementById('recommend-wrapper');
  const chatList = document.getElementById('chat-list');
  const pinnedList = document.getElementById('pinned-list');
  const newChatBtn = document.getElementById('new-chat-btn');
  const pastChatBtn = document.getElementById('past-chat-btn');
  const pastChatModal = document.getElementById('past-chat-modal');
  const pastChatClose = document.getElementById('past-chat-close');
  const pastChatSearch = document.getElementById('past-chat-search');
  const pastChatList = document.getElementById('past-chat-list');

  const chatrooms = [];
  const messageCache = {};
  let currentSessionId = null;

  fetchUserData();
  fetchChatrooms();

  async function fetchUserData() {
    const token = localStorage.getItem('access_token');

    if (!token) {
      document.getElementById('user-name').textContent = '게스트';
      document.getElementById('user-desc').textContent = '로그인이 필요합니다';
      document.getElementById('welcome-title').textContent = '안녕하세요!';
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        logout();
        return;
      }
      if (!response.ok) throw new Error('유저 정보 조회 실패');

      const userData = await response.json();
      const userName = userData.name || userData.username || '사용자';
      const userDesc = userData.desc || userData.grade || '고등학교 2학년';

      document.getElementById('user-name').textContent = userName;
      document.getElementById('user-desc').textContent = userDesc;
      document.getElementById('welcome-title').textContent = `안녕하세요, ${userName}님!`;

    } catch (error) {
      console.error('사용자 정보 로드 오류:', error);
      document.getElementById('user-name').textContent = '사용자';
      document.getElementById('welcome-title').textContent = '안녕하세요!';
    }
  }

  async function fetchChatrooms() {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/chatrooms`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('상담 목록 조회 실패');

      const rooms = await response.json();
      chatrooms.push(...rooms);
      [...rooms].reverse().forEach(addChatHistory);
    } catch (error) {
      console.error('상담 목록 로드 오류:', error);
    }
  }

  async function openChatroom(sessionId) {
    currentSessionId = sessionId;
    markActive(sessionId);
    showChatArea();
    chatMessages.innerHTML = '';

    if (!messageCache[sessionId]) {
      const loadingEl = appendMessage('ai', '지난 상담을 불러오고 있어요... 🐻');
      try {
        const response = await fetch(`${API_BASE_URL}/api/chat/chatrooms/${encodeURIComponent(sessionId)}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
        });
        if (!response.ok) throw new Error('상담 내용 조회 실패');

        const data = await response.json();
        messageCache[sessionId] = data.messages || [];
      } catch (error) {
        console.error('상담 내용 로드 오류:', error);
        if (currentSessionId === sessionId) loadingEl.innerText = '지난 상담을 불러오지 못했어요.';
        return;
      }
      if (currentSessionId !== sessionId) return;
      loadingEl.remove();
    }

    messageCache[sessionId].forEach(msg => appendMessage(msg.role === 'user' ? 'user' : 'ai', msg.content));
  }

  async function sendMessage() {
    const question = chatInput.value.trim();
    if (!question) return;

    showChatArea();

    if (!currentSessionId) {
      const room = { session_id: `local-${Date.now()}`, title: question };
      chatrooms.unshift(room);
      messageCache[room.session_id] = [];
      currentSessionId = room.session_id;
      addChatHistory(room);
      markActive(room.session_id);
    }

    const messages = messageCache[currentSessionId];
    messages.push({ role: 'user', content: question });
    appendMessage('user', question);
    chatInput.value = '';

    const loadingMessageEl = appendMessage('ai', '곰곰이가 대답을 생각하고 있어요... 🐻');

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ question })
      });

      if (!response.ok) throw new Error('서버 응답 오류');

      const data = await response.json();
      loadingMessageEl.innerText = data.answer;
      messages.push({ role: 'ai', content: data.answer });

    } catch (error) {
      console.error('오류 발생:', error);
      console.error("오류 종류:", error.name);
      console.error("오류 메시지:", error.message);
      loadingMessageEl.innerText = "서버 연결에 실패했습니다. (백엔드 서버를 확인하세요)";
    }
  }

  function startNewChat() {
    chatMessages.innerHTML = '';
    chatMessages.style.display = 'none';

    if (recommendWrapper) recommendWrapper.style.display = 'block';

    chatInput.value = '';
    chatInput.focus();

    currentSessionId = null;
    markActive(null);
  }

  function showChatArea() {
    if (recommendWrapper) recommendWrapper.style.display = 'none';
    chatMessages.style.display = 'flex';
  }

  function appendMessage(sender, text) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message-bubble', sender);
    msgDiv.innerText = text;
    chatMessages.appendChild(msgDiv);

    chatMessages.scrollTop = chatMessages.scrollHeight;
    return msgDiv;
  }

  function addChatHistory(room) {
    const li = addHistoryItem(room.title, chatList, pinnedList);
    li.dataset.sessionId = room.session_id;
    li.addEventListener('click', () => openChatroom(room.session_id));
  }

  function markActive(sessionId) {
    document.querySelectorAll('#chat-list li, #pinned-list li').forEach(li => {
      li.classList.toggle('active', li.dataset.sessionId === sessionId);
    });
  }

  function formatDate(value) {
    const date = new Date(value);
    return isNaN(date) ? '' : date.toLocaleDateString('ko-KR');
  }

  function renderPastChats() {
    const keyword = pastChatSearch.value.trim().toLowerCase();
    const rooms = chatrooms.filter(room => (room.title || '').toLowerCase().includes(keyword));
    pastChatList.innerHTML = '';

    if (rooms.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'past-chat-empty';
      empty.textContent = keyword ? '검색 결과가 없어요.' : '아직 나눈 상담이 없어요.';
      pastChatList.appendChild(empty);
      return;
    }

    rooms.forEach(room => {
      const li = document.createElement('li');
      li.innerHTML = `
        <i class="fa-regular fa-comment-dots"></i>
        <span class="chat-title"></span>
        <span class="past-chat-date"></span>
      `;
      li.querySelector('.chat-title').textContent = room.title;
      li.querySelector('.past-chat-date').textContent = room.created_at ? formatDate(room.created_at) : '';
      li.addEventListener('click', () => {
        closePastChats();
        openChatroom(room.session_id);
      });
      pastChatList.appendChild(li);
    });
  }

  function openPastChats() {
    pastChatSearch.value = '';
    renderPastChats();
    pastChatModal.hidden = false;
    pastChatSearch.focus();
  }

  function closePastChats() {
    pastChatModal.hidden = true;
  }

  sendBtn.addEventListener('click', sendMessage);
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });

  if (newChatBtn) {
    newChatBtn.addEventListener('click', startNewChat);
  }

  pastChatBtn.addEventListener('click', openPastChats);
  pastChatClose.addEventListener('click', closePastChats);
  pastChatSearch.addEventListener('input', renderPastChats);
  pastChatModal.addEventListener('click', (e) => {
    if (e.target === pastChatModal) closePastChats();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !pastChatModal.hidden) closePastChats();
  });
});
