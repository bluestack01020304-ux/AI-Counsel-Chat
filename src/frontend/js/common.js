const API_BASE_URL = 'http://127.0.0.1:8000';

const DEV_MODE = true;

const TEACHER_ONLY_PAGES = ['Tindex.html', 'TresV.html'];
const STUDENT_PAGES = ['index.html', 'resV.html', 'interView.html'];

function getRole() {
  if (DEV_MODE) {
    return sessionStorage.getItem('dev_role') || localStorage.getItem('role');
  }
  return localStorage.getItem('role');
}

function getHomePage() {
  return getRole() === 'teachers' ? 'Tindex.html' : 'index.html';
}

function logout() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('role');
  window.location.href = 'login.html';
} 

function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function nextWeekday(date) {
  const result = new Date(date);
  while (isWeekend(result)) result.setDate(result.getDate() + 1);
  return result;
}

(function guardTeacherPages() {
  const page = location.pathname.split('/').pop();

  if (DEV_MODE) {
    if (TEACHER_ONLY_PAGES.includes(page)) sessionStorage.setItem('dev_role', 'teachers');
    if (STUDENT_PAGES.includes(page)) sessionStorage.setItem('dev_role', 'students');
    return;
  }

  if (TEACHER_ONLY_PAGES.includes(page) && localStorage.getItem('role') !== 'teachers') {
    alert('선생님만 이용할 수 있는 화면이에요.');
    location.replace('index.html');
  }
})();

function addHistoryItem(title, list, pinnedList) {
  const li = document.createElement('li');
  li.innerHTML = `
    <i class="fa-regular fa-folder"></i>
    <span class="chat-title"></span>
    <button class="pin-btn" title="고정"><i class="fa-solid fa-thumbtack"></i></button>
  `;
  li.querySelector('.chat-title').textContent = title;

  const pinBtn = li.querySelector('.pin-btn');
  pinBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const pinned = li.classList.toggle('pinned');
    pinBtn.title = pinned ? '고정 해제' : '고정';
    (pinned ? pinnedList : list).prepend(li);
    pinnedList.closest('.history-group').hidden = pinnedList.children.length === 0;
  });

  list.prepend(li);
  return li;
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
