document.addEventListener('DOMContentLoaded', () => {
  const chatInput = document.getElementById('chat-input');
  const sendBtn = document.getElementById('send-btn');
  const chatMessages = document.getElementById('chat-messages');
  const recommendWrapper = document.getElementById('recommend-wrapper');
  const chatList = document.getElementById('chat-list');
  const newChatBtn = document.getElementById('new-chat-btn');

  const BACKEND_URL = 'http://0.0.0.0:8000';

  let currentChatTitle = null;

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
      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: question })
      });

      if (!response.ok) throw new Error('서버 응답 오류');

      const data = await response.json();
      
      const aiReply = data.reply || data.answer || data.message;
      loadingMessageEl.innerText = aiReply;



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
      <span class="chat-title">${title}</span>
    `;
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