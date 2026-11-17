document.addEventListener('DOMContentLoaded', () => {
  initCalendar();
  initTimeslotSelect();
  initFilterEvents();
  initCancelEvents();
  initBookingModal();
});

function updatePendingCount() {
  const pendingBadge = document.querySelector('.pending-count');
  if (pendingBadge) {
    pendingBadge.textContent = `대기 ${document.querySelectorAll('.appointment-card.pending').length}건`;
  }
}

function initBookingModal() {
  const modal = document.getElementById('booking-modal');
  const openBtn = document.getElementById('open-booking-modal-btn');
  const submitBtn = document.getElementById('submit-booking-btn');
  const timeInput = document.getElementById('modal-selected-time');
  const typeSelect = document.getElementById('modal-consult-type');
  const topicInput = document.getElementById('modal-consult-topic');
  let selectedChip = null;

  function openModal(chip) {
    selectedChip = chip || null;
    topicInput.value = '';
    modal.style.display = 'flex';
    topicInput.focus();
  }

  function closeModal() {
    modal.style.display = 'none';
  }

  openBtn.addEventListener('click', () => openModal());
  document.querySelectorAll('.timeslot-chip.student-selectable').forEach(chip => {
    chip.addEventListener('click', () => {
      if (!chip.classList.contains('disabled')) openModal(chip);
    });
  });
  modal.querySelectorAll('.modal-close-btn').forEach(btn => btn.addEventListener('click', closeModal));
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  submitBtn.addEventListener('click', () => {
    const topic = topicInput.value.trim();
    if (!topic) {
      alert('상담 안건 및 고민 내용을 입력해주세요.');
      topicInput.focus();
      return;
    }

    const isOnline = typeSelect.value === 'online';
    const card = document.createElement('div');
    card.className = 'appointment-card pending';
    card.innerHTML = `
      <div class="appt-status-bar"></div>
      <div class="appt-main">
        <div class="appt-user">
          <div class="user-avatar"><i class="fa-solid fa-chalkboard-user"></i></div>
          <div class="user-meta">
            <h4>박진로 선생님 <span class="student-info">(담임 교사)</span></h4>
            <span class="appt-type${isOnline ? ' online' : ''}"></span>
          </div>
        </div>
        <div class="appt-time"><i class="fa-regular fa-clock"></i> <span class="appt-time-text"></span></div>
        <p class="appt-topic"><strong>상담 안건:</strong> <span class="appt-topic-text"></span></p>
        <div class="appt-actions">
          <span class="status-waiting-badge"><i class="fa-solid fa-hourglass-half"></i> 선생님 확인/승인 대기 중</span>
          <button class="btn btn-outline cancel-btn"><i class="fa-solid fa-xmark"></i> 신청 취소</button>
        </div>
      </div>
    `;
    card.querySelector('.appt-type').textContent = typeSelect.options[typeSelect.selectedIndex].text;
    card.querySelector('.appt-time-text').textContent = timeInput.value;
    card.querySelector('.appt-topic-text').textContent = topic;
    document.querySelector('.appointment-list').prepend(card);

    if (selectedChip) {
      selectedChip.classList.remove('available', 'student-selectable');
      selectedChip.classList.add('disabled');
      selectedChip.querySelector('.slot-badge').textContent = '내 신청 대기 중';
    }

    closeModal();
    updatePendingCount();
    applyFilter();
    alert('상담 신청이 완료됐어요. 선생님이 승인하면 확정돼요.');
  });
}

function initFilterEvents() {
  const filterItems = document.querySelectorAll('.filter-list li');
  filterItems.forEach(item => {
    item.addEventListener('click', () => {
      filterItems.forEach(li => li.classList.remove('active'));
      item.classList.add('active');
      applyFilter();
    });
  });
}

function applyFilter() {
  const activeItem = document.querySelector('.filter-list li.active');
  const filter = activeItem ? activeItem.dataset.filter : 'all';
  document.querySelectorAll('.appointment-card').forEach(card => {
    card.style.display = filter === 'all' || card.classList.contains(filter) ? 'flex' : 'none';
  });
}

function initCancelEvents() {
  const appointmentList = document.querySelector('.appointment-list');
  if (!appointmentList) return;

  const modal = document.getElementById('cancel-modal');
  const guide = document.getElementById('cancel-guide');
  const reasonBox = document.getElementById('cancel-reasons');
  const etcInput = document.getElementById('cancel-reason-etc');
  const confirmBtn = document.getElementById('confirm-cancel-btn');
  let targetCard = null;

  function closeModal() {
    modal.style.display = 'none';
    targetCard = null;
  }

  appointmentList.addEventListener('click', (e) => {
    const cancelBtn = e.target.closest('.cancel-btn');
    if (!cancelBtn) return;

    targetCard = cancelBtn.closest('.appointment-card');
    guide.textContent = targetCard.classList.contains('confirmed')
      ? '확정된 상담을 취소하면 되돌릴 수 없어요. 취소 사유를 선택해주세요.'
      : '상담 신청을 취소할까요? 취소 사유를 선택해주세요.';
    reasonBox.querySelectorAll('input').forEach(radio => { radio.checked = false; });
    etcInput.value = '';
    etcInput.hidden = true;
    modal.style.display = 'flex';
  });

  reasonBox.addEventListener('change', () => {
    const selected = reasonBox.querySelector('input:checked');
    etcInput.hidden = !selected || selected.value !== 'etc';
    if (!etcInput.hidden) etcInput.focus();
  });

  modal.querySelectorAll('.modal-close-btn').forEach(btn => btn.addEventListener('click', closeModal));
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  confirmBtn.addEventListener('click', () => {
    const selected = reasonBox.querySelector('input:checked');
    if (!selected) {
      alert('취소 사유를 선택해주세요.');
      return;
    }

    const reason = selected.value === 'etc' ? etcInput.value.trim() : selected.value;
    if (!reason) {
      alert('취소 사유를 입력해주세요.');
      etcInput.focus();
      return;
    }

    targetCard.classList.remove('pending', 'confirmed');
    targetCard.classList.add('rejected');

    const topic = document.createElement('p');
    topic.className = 'appt-topic';
    topic.innerHTML = '<strong>취소 사유 (직접 취소):</strong> <span></span>';
    topic.querySelector('span').textContent = reason;
    targetCard.querySelector('.appt-actions').replaceWith(topic);

    closeModal();
    updatePendingCount();
    applyFilter();
  });
}

const daysOfWeek = ['일', '월', '화', '수', '목', '금', '토'];

let selectedDate = nextWeekday(new Date());
let currentDate = new Date(selectedDate);

function initCalendar() {
  renderCalendar(currentDate);
  onDateSelect(selectedDate);

  const prevBtn = document.querySelector('.calendar-nav .icon-btn:first-child');
  const nextBtn = document.querySelector('.calendar-nav .icon-btn:last-child');
  const todayBtn = document.querySelector('.today-btn');

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      currentDate.setDate(1);
      currentDate.setMonth(currentDate.getMonth() - 1);
      renderCalendar(currentDate);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      currentDate.setDate(1);
      currentDate.setMonth(currentDate.getMonth() + 1);
      renderCalendar(currentDate);
    });
  }

  if (todayBtn) {
    todayBtn.addEventListener('click', () => {
      selectedDate = nextWeekday(new Date());
      currentDate = new Date(selectedDate);
      renderCalendar(currentDate);
      onDateSelect(selectedDate);
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

  for (let i = firstDay - 1; i >= 0; i--) {
    const span = document.createElement('span');
    span.classList.add('prev-month');
    span.textContent = prevLastDate - i;
    daysContainer.appendChild(span);
  }

  for (let i = 1; i <= lastDate; i++) {
    const span = document.createElement('span');
    span.textContent = i;
    span.classList.add('day');

    if (isWeekend(new Date(year, month, i))) {
      span.classList.add('weekend');
      span.title = '주말에는 상담 예약을 받지 않아요';
      daysContainer.appendChild(span);
      continue;
    }

    const isSelected =
      selectedDate.getFullYear() === year &&
      selectedDate.getMonth() === month &&
      selectedDate.getDate() === i;

    if (isSelected) {
      span.classList.add('active-day');
    }

    span.addEventListener('click', () => {
      document.querySelectorAll('.mini-calendar .days span').forEach(el => {
        el.classList.remove('active-day');
      });
      span.classList.add('active-day');
      selectedDate = new Date(year, month, i);
      onDateSelect(selectedDate);
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

function onDateSelect(date) {
  const timeslotHeader = document.querySelector('.timeslot-header h3');
  if (timeslotHeader) {
    const dayName = daysOfWeek[date.getDay()];
    timeslotHeader.textContent = `${date.getMonth() + 1}월 ${date.getDate()}일 (${dayName}) 신청 가능 시간`;
  }
}

function initTimeslotSelect() {
  document.querySelectorAll('.timeslot-chip.student-selectable').forEach(chip => {
    chip.addEventListener('click', () => {
      const timeInput = document.getElementById('modal-selected-time');
      const timeText = chip.querySelector('.time');
      if (!timeInput || !timeText) return;

      const y = selectedDate.getFullYear();
      const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const d = String(selectedDate.getDate()).padStart(2, '0');
      const dayName = daysOfWeek[selectedDate.getDay()];
      timeInput.value = `${y}-${m}-${d} (${dayName}) ${timeText.textContent}`;
    });
  });
}
