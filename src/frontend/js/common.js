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

// 토큰을 붙여 API 호출, 실패 시 서버의 detail 메시지로 에러를 던짐
async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('access_token');
  if (!token) {
    window.location.href = 'login.html';
    throw new Error('로그인이 필요합니다.');
  }

  const headers = { 'Authorization': `Bearer ${token}`, ...(options.headers || {}) };
  if (options.body) headers['Content-Type'] = 'application/json';

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  } catch (error) {
    throw new Error('서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인해 주세요.');
  }

  const data = await response.json().catch(() => ({}));

  if (response.status === 401) {
    alert('로그인이 만료되었습니다. 다시 로그인해 주세요.');
    logout();
    throw new Error(data.detail || '로그인이 필요합니다.');
  }
  if (!response.ok) {
    const detail = Array.isArray(data.detail) ? '입력값을 확인해 주세요.' : data.detail;
    throw new Error(detail || '요청을 처리하지 못했습니다.');
  }

  return data;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text ?? '';
  return div.innerHTML;
}

const WEEKDAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

function formatTime(date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

// 예: 10월 15일 (목) 15:00 ~ 15:40
function formatSlotRange(startIso, endIso) {
  const start = new Date(startIso);
  const end = new Date(endIso);
  return `${start.getMonth() + 1}월 ${start.getDate()}일 (${WEEKDAY_NAMES[start.getDay()]}) ${formatTime(start)} ~ ${formatTime(end)}`;
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// 달력에 표시 중인 달의 타임슬롯 조회 (로컬 시간 기준 월 범위)
function fetchMonthTimeslots(date) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  const query = `start=${encodeURIComponent(start.toISOString())}&end=${encodeURIComponent(end.toISOString())}`;
  return apiFetch(`/api/reservations/timeslots?${query}`);
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
