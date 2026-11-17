function setFilter(type) {
  const sections = document.querySelectorAll('.guide-sec');
  const buttons = document.querySelectorAll('.nav-btn');

  buttons.forEach(btn => {
    btn.classList.remove('bg-white', 'text-indigo-700', 'shadow-sm');
    btn.classList.add('text-white', 'hover:bg-white/10');
  });

  const activeBtn = document.getElementById(`btn-${type}`);
  if (activeBtn) {
    activeBtn.classList.remove('text-white', 'hover:bg-white/10');
    activeBtn.classList.add('bg-white', 'text-indigo-700', 'shadow-sm');
  }

  if (type === 'all') {
    sections.forEach(sec => sec.classList.remove('hidden'));
  } else {
    sections.forEach(sec => sec.classList.add('hidden'));
    const targetSec = document.getElementById(`sec-${type}`);
    if (targetSec) targetSec.classList.remove('hidden');
  }
}

function toggleAccordion(id) {
  const content = document.getElementById(id);
  const icon = document.getElementById(`${id}-icon`);
  if (content.classList.contains('hidden')) {
    content.classList.remove('hidden');
    icon.classList.add('rotate-180');
  } else {
    content.classList.add('hidden');
    icon.classList.remove('rotate-180');
  }
}

function setRoadmapTab(grade) {
  const tabs = document.querySelectorAll('.roadmap-tab');
  const contents = document.querySelectorAll('.roadmap-content');

  tabs.forEach(t => {
    t.classList.remove('border-indigo-600', 'text-indigo-600', 'font-bold');
    t.classList.add('border-transparent', 'text-slate-500', 'font-medium');
  });

  contents.forEach(c => c.classList.add('hidden'));

  const activeTab = document.getElementById(`rtab-${grade}`);
  const activeContent = document.getElementById(`rcontent-${grade}`);

  if (activeTab && activeContent) {
    activeTab.classList.remove('border-transparent', 'text-slate-500', 'font-medium');
    activeTab.classList.add('border-indigo-600', 'text-indigo-600', 'font-bold');
    activeContent.classList.remove('hidden');
  }
}

const GUIDE_STORAGE_KEY = 'jinhak_guide';

document.addEventListener('DOMContentLoaded', () => {
  const main = document.querySelector('main');
  const editBtn = document.getElementById('guide-edit-btn');
  const editBar = document.getElementById('guide-edit-bar');
  const saveBtn = document.getElementById('guide-save-btn');
  const cancelBtn = document.getElementById('guide-cancel-btn');
  const resetBtn = document.getElementById('guide-reset-btn');
  const updatedAt = document.getElementById('guide-updated-at');
  const isTeacher = getRole() === 'teachers';
  const defaultContent = main.innerHTML;
  let contentBeforeEdit = '';

  loadGuide();

  if (isTeacher) {
    editBtn.hidden = false;
    editBtn.addEventListener('click', startEditing);
    saveBtn.addEventListener('click', saveGuide);
    cancelBtn.addEventListener('click', cancelEditing);
    resetBtn.addEventListener('click', resetGuide);
    main.addEventListener('paste', pastePlainText);
    window.addEventListener('beforeunload', (e) => {
      if (document.body.classList.contains('guide-editing')) e.preventDefault();
    });
  }

  async function loadGuide() {
    let saved = null;
    try {
      const response = await fetch(`${API_BASE_URL}/api/guide/jinhak`);
      if (!response.ok) throw new Error('가이드 조회 실패');
      saved = await response.json();
    } catch (error) {
      try {
        saved = JSON.parse(localStorage.getItem(GUIDE_STORAGE_KEY));
      } catch (e) {
        saved = null;
      }
    }

    if (saved && saved.content) {
      main.innerHTML = saved.content;
      showUpdatedAt(saved.updated_at);
    }
  }

  function showUpdatedAt(value) {
    const date = new Date(value);
    updatedAt.hidden = isNaN(date);
    if (!updatedAt.hidden) {
      updatedAt.textContent = `마지막 수정: ${date.toLocaleDateString('ko-KR')} (선생님이 최신 내용으로 수정했어요)`;
    }
  }

  function resetView() {
    setFilter('all');
    setRoadmapTab('g1');
    main.querySelectorAll('[id^="acc"]:not([id$="-icon"])').forEach(el => el.classList.add('hidden'));
    main.querySelectorAll('[id^="acc"][id$="-icon"]').forEach(el => el.classList.remove('rotate-180'));
  }

  function startEditing() {
    resetView();
    contentBeforeEdit = main.innerHTML;
    main.contentEditable = 'true';
    document.body.classList.add('guide-editing');
    editBar.hidden = false;
    main.focus();
  }

  function stopEditing() {
    main.removeAttribute('contenteditable');
    document.body.classList.remove('guide-editing');
    editBar.hidden = true;
  }

  function cancelEditing() {
    if (main.innerHTML !== contentBeforeEdit && !confirm('수정한 내용을 저장하지 않고 나갈까요?')) return;
    main.innerHTML = contentBeforeEdit;
    stopEditing();
  }

  function resetGuide() {
    if (!confirm('처음 기본 내용으로 되돌릴까요? 저장을 눌러야 반영돼요.')) return;
    main.innerHTML = defaultContent;
    resetView();
  }

  async function saveGuide() {
    resetView();
    const payload = { content: main.innerHTML, updated_at: new Date().toISOString() };

    saveBtn.disabled = true;
    try {
      const response = await fetch(`${API_BASE_URL}/api/guide/jinhak`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: payload.content })
      });
      if (!response.ok) throw new Error('가이드 저장 실패');
      alert('가이드를 저장했어요. 학생들도 바뀐 내용을 보게 돼요.');
    } catch (error) {
      localStorage.setItem(GUIDE_STORAGE_KEY, JSON.stringify(payload));
      alert('아직 서버와 연결되지 않아 이 브라우저에만 임시로 저장했어요.');
    } finally {
      saveBtn.disabled = false;
    }

    showUpdatedAt(payload.updated_at);
    stopEditing();
  }

  function pastePlainText(e) {
    if (!document.body.classList.contains('guide-editing')) return;
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  }
});

