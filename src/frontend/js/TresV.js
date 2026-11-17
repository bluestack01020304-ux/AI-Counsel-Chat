document.addEventListener('DOMContentLoaded', () => {
  initCalendar();
  initModalEvents();
  initFilterEvents();
  initAppointmentActions();
  fetchAppointmentsFromAPI();
});

let currentDate = new Date();

function initCalendar() {
  renderCalendar(currentDate);

  const prevBtn = document.querySelector('.calendar-nav .icon-btn:first-child');
  const nextBtn = document.querySelector('.calendar-nav .icon-btn:last-child');
  const todayBtn = document.querySelector('.today-btn');

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      currentDate.setMonth(currentDate.getMonth() - 1);
      renderCalendar(currentDate);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      currentDate.setMonth(currentDate.getMonth() + 1);
      renderCalendar(currentDate);
    });
  }

  if (todayBtn) {
    todayBtn.addEventListener('click', () => {
      currentDate = new Date();
      renderCalendar(currentDate);
    });
  }
}

function renderCalendar(date) {
  const year = date.getFullYear();
  const month = date.getMonth();

  const titleElem = document.querySelector('.calendar-header h2');
  if (titleElem) {
    titleElem.innerHTML = `<i class="fa-regular fa-calendar-days"></i> ${year}년 ${month + 1}월`;
  }

  const daysContainer = document.querySelector('.mini-calendar .days');
  if (!daysContainer) return;

  daysContainer.innerHTML = '';

  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();
  const prevLastDate = new Date(year, month, 0).getDate();

  const today = new Date();

  for (let i = firstDay - 1; i >= 0; i--) {
    const span = document.createElement('span');
    span.classList.add('prev-month');
    span.textContent = prevLastDate - i;
    daysContainer.appendChild(span);
  }

  for (let i = 1; i <= lastDate; i++) {
    const span = document.createElement('span');
    span.textContent = i;

    const isToday =
      today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === i;

    if (isToday) {
      span.classList.add('day', 'active-day');
    } else {
      span.classList.add('day');
    }

    if (isWeekend(new Date(year, month, i))) {
      span.classList.add('weekend');
      span.title = '주말에는 상담을 운영하지 않아요';
      daysContainer.appendChild(span);
      continue;
    }

    span.addEventListener('click', () => {
      document.querySelectorAll('.mini-calendar .days span').forEach(el => {
        el.classList.remove('active-day');
      });
      span.classList.add('active-day');
      onDateSelect(year, month + 1, i);
    });

    daysContainer.appendChild(span);
  }

  const totalDisplayed = firstDay + lastDate;
  const nextDays = (7 - (totalDisplayed % 7)) % 7;
  for (let i = 1; i <= nextDays; i++) {
    const span = document.createElement('span');
    span.classList.add('next-month');
    span.textContent = i;
    daysContainer.appendChild(span);
  }
}

function onDateSelect(year, month, day) {
  const timeslotHeader = document.querySelector('.timeslot-header h3');
  if (timeslotHeader) {
    const daysOfWeek = ['일', '월', '화', '수', '목', '금', '토'];
    const selectedDateObj = new Date(year, month - 1, day);
    const dayName = daysOfWeek[selectedDateObj.getDay()];
    timeslotHeader.textContent = `${month}월 ${day}일 (${dayName}) 상담 가능 시간`;
  }

  fetchTimeslotsForDate(year, month, day);
}

function initModalEvents() {
  const modal = document.getElementById('schedule-modal');
  const openBtn = document.getElementById('open-modal-btn');
  const closeBtns = document.querySelectorAll('.modal-close-btn');

  if (openBtn && modal) {
    openBtn.addEventListener('click', () => {
      modal.style.display = 'flex';
    });
  }

  closeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (modal) modal.style.display = 'none';
    });
  });

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });
  }

  const modalForm = document.querySelector('.modal-form');
  const createBtn = document.querySelector('.modal-footer .btn-primary');

  if (createBtn) {
    createBtn.addEventListener('click', (e) => {
      e.preventDefault();
      createNewTimeslot();
    });
  }
}

function initFilterEvents() {
  const filterItems = document.querySelectorAll('.filter-list li');
  filterItems.forEach(item => {
    item.addEventListener('click', () => {
      filterItems.forEach(li => li.classList.remove('active'));
      item.classList.add('active');

      const filterText = item.textContent.trim();
      filterAppointments(filterText);
    });
  });
}

function initAppointmentActions() {
  const appointmentList = document.querySelector('.appointment-list');
  if (!appointmentList) return;

  appointmentList.addEventListener('click', (e) => {
    const approveBtn = e.target.closest('.btn-approve');
    const rejectBtn = e.target.closest('.btn-reject');
    const completeBtn = e.target.closest('.complete-btn');
    const unconfirmBtn = e.target.closest('.unconfirm-btn');

    if (unconfirmBtn) {
      const card = unconfirmBtn.closest('.appointment-card');
      if (card && confirm('예약 승인을 취소하고 승인 대기 상태로 되돌릴까요?')) {
        card.classList.remove('confirmed');
        card.classList.add('pending');
        card.querySelector('.appt-actions').innerHTML = `
          <button class="btn btn-approve"><i class="fa-solid fa-check"></i> 예약 승인</button>
          <button class="btn btn-reject"><i class="fa-solid fa-xmark"></i> 반려</button>
        `;
        updatePendingCount();
      }
      return;
    }
    const writeNoteBtn = e.target.closest('.write-note-btn');

    if (writeNoteBtn) {
      const recordId = writeNoteBtn.dataset.recordId;
      window.location.href = recordId ? `counselNote.html?id=${recordId}` : 'counselNote.html';
      return;
    }

    if (completeBtn) {
      const card = completeBtn.closest('.appointment-card');
      if (card && confirm('상담을 완료 처리할까요? 완료된 상담에는 후기를 남길 수 있어요.')) {
        card.classList.remove('confirmed');
        card.classList.add('completed');
        card.querySelector('.appt-actions').innerHTML = `
          <span class="completed-badge"><i class="fa-solid fa-flag-checkered"></i> 상담 완료</span>
          <button class="btn btn-primary write-note-btn"><i class="fa-solid fa-pen-to-square"></i> 후기 남기기</button>
        `;
      }
      return;
    }

    if (approveBtn) {
      const card = approveBtn.closest('.appointment-card');
      if (card) {
        card.classList.remove('pending');
        card.classList.add('confirmed');
        
        const actionsDiv = card.querySelector('.appt-actions');
        actionsDiv.innerHTML = `
          <button class="btn btn-secondary unconfirm-btn" title="다시 누르면 승인 대기로 되돌려요"><i class="fa-solid fa-video"></i>예약 완료</button>
          <button class="btn btn-outline complete-btn"><i class="fa-solid fa-flag-checkered"></i> 상담 완료 처리</button>
        `;
        updatePendingCount();
      }
    }

    if (rejectBtn) {
      const card = rejectBtn.closest('.appointment-card');
      if (card && confirm('정말 이 예약을 반려하시겠습니까?')) {
        card.remove();
        updatePendingCount();
      }
    }
  });
}

function updatePendingCount() {
  const pendingCards = document.querySelectorAll('.appointment-card.pending');
  const pendingBadge = document.querySelector('.pending-count');
  if (pendingBadge) {
    pendingBadge.textContent = `대기 ${pendingCards.length}건`;
  }
}

function filterAppointments(filterText) {
  const cards = document.querySelectorAll('.appointment-card');
  cards.forEach(card => {
    if (filterText.includes('전체')) {
      card.style.display = 'flex';
    } else if (filterText.includes('대기') && card.classList.contains('pending')) {
      card.style.display = 'flex';
    } else if (filterText.includes('확정') && card.classList.contains('confirmed')) {
      card.style.display = 'flex';
    } else if (filterText.includes('취소') || filterText.includes('반려')) {
      card.style.display = card.classList.contains('rejected') ? 'flex' : 'none';
    } else if (filterText.includes('완료')) {
      card.style.display = card.classList.contains('completed') ? 'flex' : 'none';
    } else {
      card.style.display = 'none';
    }
  });
}

function createNewTimeslot() {
  const dateInput = document.querySelector('.modal-form input[type="date"]').value;
  const startTime = document.querySelectorAll('.modal-form input[type="time"]')[0].value;
  const endTime = document.querySelectorAll('.modal-form input[type="time"]')[1].value;
  const type = document.querySelector('.modal-form select').value;

  if (isWeekend(new Date(`${dateInput}T00:00:00`))) {
    alert('주말에는 상담 시간을 열 수 없어요. 평일 날짜를 선택해주세요.');
    return;
  }

  const payload = {
    date: dateInput,
    start_time: startTime,
    end_time: endTime,
    counseling_type: type
  };



  alert(`[임시] ${dateInput} (${startTime} ~ ${endTime}) 타임슬롯이 오픈되었습니다.`);
  document.getElementById('schedule-modal').style.display = 'none';
}

function fetchTimeslotsForDate(year, month, day) {
  
}

function fetchAppointmentsFromAPI() {
  
}