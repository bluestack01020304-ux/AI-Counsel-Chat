// 모든 페이지 공통: 로그아웃, 로고 클릭 시 홈 이동
const API_BASE_URL = 'http://127.0.0.1:8000';

function getHomePage() {
  return localStorage.getItem('role') === 'teachers' ? 'Tindex.html' : 'index.html';
}

function logout() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('role');
  window.location.href = 'login.html';
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.logout-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm('로그아웃 하시겠습니까?')) logout();
    });
  });

  const logo = document.querySelector('.sidebar-header');
  if (logo) {
    logo.style.cursor = 'pointer';
    logo.addEventListener('click', () => {
      window.location.href = getHomePage();
    });
  }
});
