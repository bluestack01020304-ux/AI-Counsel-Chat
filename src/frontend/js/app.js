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


<<<<<<< HEAD
  const BACKEND_URL = 'http://127.0.0.1:8000';
=======
  const BACKEND_URL = 'http://0.0.0.0:8000';
>>>>>>> 06d4cd5a23264e374da6961960b2ecea71031089

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
<<<<<<< HEAD
      const response = await fetch(`${BACKEND_URL}/api/chat/ask`, {
=======
      const response = await fetch(BACKEND_URL, {
>>>>>>> 06d4cd5a23264e374da6961960b2ecea71031089
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
<<<<<<< HEAD
        body: JSON.stringify({ question: question })
=======
        body: JSON.stringify({ message: question })
>>>>>>> 06d4cd5a23264e374da6961960b2ecea71031089
      });

      if (!response.ok) throw new Error('서버 응답 오류');

      const data = await response.json();
      
      const aiReply = data.reply || data.answer || data.message;
<<<<<<< HEAD
      loadingMessageEl.innerText = aiReply; 
=======
      loadingMessageEl.innerText = aiReply;
>>>>>>> 06d4cd5a23264e374da6961960b2ecea71031089



    } catch (error) {
      console.error('오류 발생:', error);
<<<<<<< HEAD
      console.error("오류 종류:", error.name)
      console.error("오류 메시지:", error.message)
=======
>>>>>>> 06d4cd5a23264e374da6961960b2ecea71031089
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