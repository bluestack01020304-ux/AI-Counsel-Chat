document.addEventListener('DOMContentLoaded', () => {
  const chatInput = document.getElementById('chat-input');
  const sendBtn = document.getElementById('send-btn');
  const chatMessages = document.getElementById('chat-messages');
  const recommendWrapper = document.getElementById('recommend-wrapper');
  const chatList = document.getElementById('chat-list');
  const newChatBtn = document.getElementById('new-chat-btn');

  let currentChatTitle = null;

  // 페이지 로드 시 유저 정보 API 호출
  fetchUserData();

  // 로그인된 유저의 정보를 API로 가져와 화면의 이름을 바꿔주는 함수
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

      // HTML 요소에 동적으로 데이터 반영
      document.getElementById('user-name').textContent = userName;
      document.getElementById('user-desc').textContent = userDesc;
      document.getElementById('welcome-title').textContent = `안녕하세요, ${userName}님!`;

    } catch (error) {
      console.error('사용자 정보 로드 오류:', error);
      document.getElementById('user-name').textContent = '사용자';
      document.getElementById('welcome-title').textContent = '안녕하세요!';
    }
  }

  async function sendMessage() {
    const question = chatInput.value.trim();
    if (!question) return;

    if (recommendWrapper) recommendWrapper.style.display = 'none';
    chatMessages.style.display = 'flex';

    if (!currentChatTitle) {
      currentChatTitle = question;
      addChatHistory(currentChatTitle);
    }

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

    } catch (error) {
      console.error('오류 발생:', error);
      loadingMessageEl.innerText = "서버 연결에 실패했습니다. (백엔드 서버를 확인하세요)";
    }
  }

  function startNewChat() {
    chatMessages.innerHTML = '';
    chatMessages.style.display = 'none';

    if (recommendWrapper) recommendWrapper.style.display = 'block';

    chatInput.value = '';
    chatInput.focus();

    currentChatTitle = null;
  }

  function appendMessage(sender, text) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message-bubble', sender);
    msgDiv.innerText = text;
    chatMessages.appendChild(msgDiv);

    chatMessages.scrollTop = chatMessages.scrollHeight;
    return msgDiv;
  }

  function addChatHistory(title) {
    const li = document.createElement('li');
    li.innerHTML = `
      <i class="fa-regular fa-folder"></i>
      <span class="chat-title"></span>
    `;
    li.querySelector('.chat-title').textContent = title;
    chatList.prepend(li);
  }

  sendBtn.addEventListener('click', sendMessage);
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });

  if (newChatBtn) {
    newChatBtn.addEventListener('click', startNewChat);
  }
});
