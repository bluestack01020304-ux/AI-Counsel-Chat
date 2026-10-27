// 카테고리 필터 기능
function setFilter(type) {
  const sections = document.querySelectorAll('.guide-sec');
  const buttons = document.querySelectorAll('.nav-btn');

  // 버튼 스타일 초기화
  buttons.forEach(btn => {
    btn.classList.remove('bg-white', 'text-indigo-700', 'shadow-sm');
    btn.classList.add('text-white', 'hover:bg-white/10');
  });

  // 선택된 버튼 활성화
  const activeBtn = document.getElementById(`btn-${type}`);
  if (activeBtn) {
    activeBtn.classList.remove('text-white', 'hover:bg-white/10');
    activeBtn.classList.add('bg-white', 'text-indigo-700', 'shadow-sm');
  }

  // 섹션 토글
  if (type === 'all') {
    sections.forEach(sec => sec.classList.remove('hidden'));
  } else {
    sections.forEach(sec => sec.classList.add('hidden'));
    const targetSec = document.getElementById(`sec-${type}`);
    if (targetSec) targetSec.classList.remove('hidden');
  }
}

// 아코디언 토글
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

// 로드맵 탭 전환
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

