document.addEventListener('DOMContentLoaded', () => {
  const button = document.getElementById('action-btn');
  const message = document.getElementById('message');

  button.addEventListener('click', () => {
    message.textContent = '버튼이 성공적으로 클릭되었습니다!';
    message.style.color = '#10b981';
  });
});