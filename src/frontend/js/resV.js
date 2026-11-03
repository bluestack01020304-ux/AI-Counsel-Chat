document.addEventListener('DOMContentLoaded', () => {
  initCalendar();
  initTimeslotSelect();
  initBookingModal();
  initFilterEvents();
  initAppointmentActions();
  fetchUserName();
  fetchMyTeachers();
  fetchMyReservations();
});

const STATUS_FILTERS = {
  '전체': () => true,
  '대기': (r) => r.status === 'pending',
  '확정': (r) => r.status === 'confirmed',
  '취소': (r) => r.status === 'rejected' || r.status === 'cancelled',
};

const SLOT_BADGES = {
  available: '<i class="fa-solid fa-plus"></i> 신청 가능',
  mine: '내 예약 완료',
  taken: '다른 학생 예약됨',
  closed: '마감됨',
};

let currentDate = new Date();
let selectedDate = new Date();
let monthTimeslots = [];
let reservations = [];
let selectedSlot = null;
let currentFilter = '전체';

function initCalendar() {
  loadMonth();

  const prevBtn = document.querySelector('.calendar-nav .icon-btn:first-child');
  const nextBtn = document.querySelector('.calendar-nav .icon-btn:last-child');
  const todayBtn = document.querySelector('.today-btn');

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      currentDate.setDate(1);
      currentDate.setMonth(currentDate.getMonth() - 1);
      loadMonth();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      currentDate.setDate(1);
      currentDate.setMonth(currentDate.getMonth() + 1);
      loadMonth();
    });
  }

  if (todayBtn) {
    todayBtn.addEventListener('click', () => {
      currentDate = new Date();
      selectedDate = new Date();
      loadMonth();
    });
  }
}

// 담당 선생님(teacher_students)이 연 슬롯만 서버에서 내려옴
async function loadMonth() {
  renderCalendar(currentDate);
  try {
    monthTimeslots = await fetchMonthTimeslots(currentDate);
  } catch (error) {
    monthTimeslots = [];
    console.error('타임슬롯 로드 오류:', error);
  }
  renderCalendar(currentDate);
  onDateSelect(selectedDate);
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

  // 신청 가능한 슬롯이 있는 날만 점 표시
  const eventDays = new Set(
    monthTimeslots
      .filter(slot => slot.status === 'available' || slot.status === 'mine')
      .map(slot => new Date(slot.start_at))
      .filter(d => d.getFullYear() === year && d.getMonth() === month)
      .map(d => d.getDate())
  );

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

    if (isSameDay(selectedDate, new Date(year, month, i))) {
      span.classList.add('active-day');
    }
    if (eventDays.has(i)) {
      span.classList.add('has-event');
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
  const timeslotHeader = document.getElementById('timeslot-title');
  if (timeslotHeader) {
    timeslotHeader.textContent = `${date.getMonth() + 1}월 ${date.getDate()}일 (${WEEKDAY_NAMES[date.getDay()]}) 신청 가능 시간`;
  }

  renderTimeslots(monthTimeslots.filter(slot => isSameDay(new Date(slot.start_at), date)));
}

function renderTimeslots(slots) {
  const grid = document.getElementById('timeslot-grid');
  if (!grid) return;

  if (slots.length === 0) {
    grid.innerHTML = '<div class="timeslot-chip disabled"><span class="time">선생님이 연 상담 시간이 없습니다</span></div>';
    return;
  }

  grid.innerHTML = slots.map(slot => {
    const time = `${formatTime(new Date(slot.start_at))} - ${formatTime(new Date(slot.end_at))}`;
    const chipClass = slot.status === 'available' ? 'available student-selectable' : 'disabled';
    const note = slot.note ? ` title="${escapeHtml(slot.note)}"` : '';

    return `
      <div class="timeslot-chip ${chipClass}" data-id="${slot.id}"${note}>
        <span class="time">${time} · ${escapeHtml(slot.teacher_name)} 선생님</span>
        <span class="slot-badge">${SLOT_BADGES[slot.status] || ''}</span>
      </div>`;
  }).join('');
}

// 신청 가능 슬롯 클릭 시 예약 신청서를 선택한 슬롯으로 채워서 엶
function initTimeslotSelect() {
  const grid = document.getElementById('timeslot-grid');
  if (!grid) return;

  grid.addEventListener('click', (e) => {
    const chip = e.target.closest('.timeslot-chip.student-selectable');
    if (!chip) return;

    selectedSlot = monthTimeslots.find(slot => slot.id === chip.dataset.id);
    if (selectedSlot) openBookingModal();
  });
}

function openBookingModal() {
  const start = new Date(selectedSlot.start_at);
  const y = start.getFullYear();
  const m = String(start.getMonth() + 1).padStart(2, '0');
  const d = String(start.getDate()).padStart(2, '0');

  document.getElementById('modal-teacher').value = `${selectedSlot.teacher_name} 선생님`;
  document.getElementById('modal-selected-time').value =
    `${y}-${m}-${d} (${WEEKDAY_NAMES[start.getDay()]}) ${formatTime(start)} - ${formatTime(new Date(selectedSlot.end_at))}`;
  document.getElementById('modal-consult-type').value = selectedSlot.counseling_type;
  document.getElementById('booking-modal').style.display = 'flex';
}

function initBookingModal() {
  const modal = document.getElementById('booking-modal');
  const quickBtn = document.getElementById('open-booking-modal-btn');
  const submitBtn = document.getElementById('submit-booking-btn');

  if (quickBtn) {
    quickBtn.addEventListener('click', () => {
      // 가장 가까운 신청 가능 슬롯을 골라 바로 신청서를 엶
      selectedSlot = monthTimeslots.find(slot => slot.status === 'available');
      if (!selectedSlot) {
        alert('이번 달에 신청 가능한 상담 시간이 없습니다.');
        return;
      }
      selectedDate = new Date(selectedSlot.start_at);
      renderCalendar(currentDate);
      onDateSelect(selectedDate);
      openBookingModal();
    });
  }

  document.querySelectorAll('#booking-modal .modal-close-btn').forEach(btn => {
    btn.addEventListener('click', () => { modal.style.display = 'none'; });
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.style.display = 'none';
  });

  submitBtn.addEventListener('click', async () => {
    const topicInput = document.getElementById('modal-consult-topic');
    const topic = topicInput.value.trim();
    if (!selectedSlot) return;
    if (!topic) {
      alert('상담 안건을 입력해 주세요.');
      topicInput.focus();
      return;
    }

    submitBtn.disabled = true;
    try {
      await apiFetch('/api/reservations', {
        method: 'POST',
        body: JSON.stringify({
          timeslot_id: selectedSlot.id,
          consult_type: document.getElementById('modal-consult-type').value,
          topic,
        }),
      });
      modal.style.display = 'none';
      topicInput.value = '';
      selectedSlot = null;
      alert('상담 신청이 완료되었습니다. 선생님 승인을 기다려 주세요.');
    } catch (error) {
      alert(error.message);
    } finally {
      submitBtn.disabled = false;
      await Promise.all([fetchMyReservations(), loadMonth()]);
    }
  });
}

function initFilterEvents() {
  const filterItems = document.querySelectorAll('.filter-list li');
  filterItems.forEach(item => {
    item.addEventListener('click', () => {
      filterItems.forEach(li => li.classList.remove('active'));
      item.classList.add('active');

      const filterText = item.textContent.trim();
      currentFilter = Object.keys(STATUS_FILTERS).find(key => filterText.includes(key)) || '전체';
      renderReservations();
    });
  });
}

function initAppointmentActions() {
  const list = document.querySelector('.appointment-list');
  if (!list) return;

  list.addEventListener('click', async (e) => {
    const cancelBtn = e.target.closest('.cancel-btn');
    if (!cancelBtn) return;
    if (!confirm('정말 이 상담 신청을 취소하시겠습니까?')) return;

    const id = cancelBtn.closest('.appointment-card').dataset.id;
    cancelBtn.disabled = true;
    try {
      await apiFetch(`/api/reservations/${id}/cancel`, { method: 'POST' });
      await Promise.all([fetchMyReservations(), loadMonth()]);
    } catch (error) {
      alert(error.message);
      cancelBtn.disabled = false;
    }
  });
}

function updateCounts() {
  Object.entries(STATUS_FILTERS).forEach(([key, match]) => {
    const el = document.querySelector(`[data-count="${key}"]`);
    if (el) el.textContent = reservations.filter(match).length;
  });

  const pendingBadge = document.querySelector('.pending-count');
  if (pendingBadge) {
    pendingBadge.textContent = `대기 ${reservations.filter(STATUS_FILTERS['대기']).length}건`;
  }
}

function renderReservations() {
  const list = document.querySelector('.appointment-list');
  if (!list) return;

  updateCounts();

  const items = reservations.filter(STATUS_FILTERS[currentFilter]);
  if (items.length === 0) {
    list.innerHTML = '<p class="appt-topic">표시할 상담 신청 내역이 없습니다.</p>';
    return;
  }

  list.innerHTML = items.map(r => {
    const cardClass = r.status === 'cancelled' ? 'rejected' : r.status;
    const isOnline = r.consult_type === 'online';
    let actions = '';
    let topicLabel = '상담 안건';
    let topic = r.topic;

    if (r.status === 'confirmed') {
      actions = `
        <span class="status-waiting-badge"><i class="fa-solid fa-circle-check"></i> 상담 확정</span>
        <button class="btn btn-outline cancel-btn"><i class="fa-solid fa-xmark"></i> 예약 취소</button>`;
    } else if (r.status === 'pending') {
      actions = `
        <span class="status-waiting-badge"><i class="fa-solid fa-hourglass-half"></i> 선생님 확인/승인 대기 중</span>
        <button class="btn btn-outline cancel-btn"><i class="fa-solid fa-xmark"></i> 신청 취소</button>`;
    } else if (r.status === 'rejected') {
      topicLabel = '반려 사유';
      topic = r.reject_reason || '사유가 입력되지 않았습니다.';
    } else {
      actions = '<span class="status-waiting-badge">취소한 신청</span>';
    }

    return `
      <div class="appointment-card ${cardClass}" data-id="${r.id}">
        <div class="appt-status-bar"></div>
        <div class="appt-main">
          <div class="appt-user">
            <div class="user-avatar"><i class="fa-solid fa-chalkboard-user"></i></div>
            <div class="user-meta">
              <h4>${escapeHtml(r.teacher_name)} 선생님</h4>
              <span class="appt-type${isOnline ? ' online' : ''}">${isOnline ? '화상 상담' : '방문 상담'}</span>
            </div>
          </div>
          <div class="appt-time">
            <i class="fa-regular fa-clock"></i> ${formatSlotRange(r.start_at, r.end_at)}
          </div>
          <p class="appt-topic"><strong>${topicLabel}:</strong> ${escapeHtml(topic)}</p>
          ${actions ? `<div class="appt-actions">${actions}</div>` : ''}
        </div>
      </div>`;
  }).join('');
}

async function fetchMyReservations() {
  try {
    reservations = await apiFetch('/api/reservations');
  } catch (error) {
    reservations = [];
    console.error('예약 목록 로드 오류:', error);
  }
  renderReservations();
}

async function fetchMyTeachers() {
  const badge = document.getElementById('teacher-badge');
  try {
    const teachers = await apiFetch('/api/reservations/teachers');
    badge.textContent = teachers.length
      ? `담당: ${teachers.map(t => `${t.name} 선생님`).join(', ')}`
      : '연결된 담당 선생님이 없습니다';
  } catch (error) {
    badge.textContent = '담당 선생님 정보를 불러오지 못했습니다';
  }
}

async function fetchUserName() {
  try {
    const user = await apiFetch('/api/users/me');
    document.querySelector('.user-profile .name').textContent = user.username;
  } catch (error) {
    console.error('사용자 정보 로드 오류:', error);
  }
}
