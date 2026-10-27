document.addEventListener('DOMContentLoaded', () => {
  // DOM 요소 선택
  const newRecordBtn = document.getElementById('new-record-btn');
  const studentList = document.getElementById('student-list');
  const searchInput = document.getElementById('student-search-input');
  const searchBtn = document.getElementById('search-btn');
  const recommendCards = document.querySelectorAll('.recommend-card');

  // 1. 새로운 상담 일지 작성 클릭 이벤트
  newRecordBtn.addEventListener('click', () => {
    alert('새 상담 일지 작성 창을 엽니다.');
  });

  // 2. 학생 목록 선택 처리
  studentList.addEventListener('click', (e) => {
    const li = e.target.closest('li');
    if (!li) return;

    // 기존 활성화 항목 해제 후 클릭 항목 활성화
    document.querySelectorAll('#student-list li').forEach(item => {
      item.classList.remove('active');
    });
    li.classList.add('active');

    const studentName = li.textContent.trim();
    alert(`${studentName} 학생의 진로 상세 정보 페이지로 이동합니다.`);
  });

  // 3. 학생/키워드 검색 기능
  function handleSearch() {
    const query = searchInput.value.trim();
    if (query) {
      alert(`'${query}'에 대한 학생 및 상담 정보 검색 결과입니다.`);
    } else {
      alert('검색할 학생 이름이나 키워드를 입력해주세요.');
    }
  }

  searchBtn.addEventListener('click', handleSearch);
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  });

  // 4. 업무 추천 카드 클릭 이벤트 (페이지가 있는 카드는 이동)
  const cardPages = {
    '수시/정시 진학 가이드': 'jinhak.html',
    '상담 일정 및 예약 관리': 'TresV.html',
  };

  recommendCards.forEach(card => {
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => {
      const cardTitle = card.querySelector('.card-text h3').textContent;
      if (cardPages[cardTitle]) {
        window.location.href = cardPages[cardTitle];
      } else {
        alert(`'${cardTitle}' 기능은 준비 중입니다.`);
      }
    });
  });
});