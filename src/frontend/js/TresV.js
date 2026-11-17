document.addEventListener('DOMContentLoaded', () => {
  initCalendar();
  initModalEvents();
  initFilterEvents();
  initAppointmentActions();
  fetchUserName();
  fetchAppointmentsFromAPI();
});

const STATUS_FILTERS = {
  '전체': () => true,
  '대기': (r) => r.status === 'pending',
  '확정': (r) => r.status === 'confirmed',
  '취소': (r) => r.status === 'rejected' || r.status === 'cancelled',
};

let currentDate = new Date();
let selectedDate = new Date();
let monthTimeslots = [];
let appointments = [];
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

// 달이 바뀔 때마다 그 달의 타임슬롯을 받아 달력/슬롯 목록을 다시 그림
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

  const eventDays = new Set(
    monthTimeslots
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
    timeslotHeader.textContent = `${date.getMonth() + 1}월 ${date.getDate()}일 (${WEEKDAY_NAMES[date.getDay()]}) 상담 가능 시간`;
  }

  renderTimeslots(monthTimeslots.filter(slot => isSameDay(new Date(slot.start_at), date)));
}

function renderTimeslots(slots) {
  const grid = document.getElementById('timeslot-grid');
  const count = document.getElementById('timeslot-count');
  if (count) count.textContent = `총 ${slots.length}개 슬롯`;
  if (!grid) return;

  if (slots.length === 0) {
    grid.innerHTML = '<div class="timeslot-chip disabled"><span class="time">등록된 상담 시간이 없습니다</span></div>';
    return;
  }

  grid.innerHTML = slots.map(slot => {
    const time = `${formatTime(new Date(slot.start_at))} - ${formatTime(new Date(slot.end_at))}`;
    let chipClass = 'available';
    let badge = '신청 대기';

    if (slot.status === 'pending') {
      chipClass = 'booked';
      badge = `${escapeHtml(slot.student_name)} 승인 대기`;
    } else if (slot.status === 'confirmed') {
      chipClass = 'booked';
      badge = `${escapeHtml(slot.student_name)} 확정`;
    } else if (new Date(slot.start_at) <= new Date()) {
      chipClass = 'disabled';
      badge = '마감됨';
    }

    return `
      <div class="timeslot-chip ${chipClass}">
        <span class="time">${time}</span>
        <span class="slot-badge">${badge}</span>
      </div>`;
  }).join('');
}

function initModalEvents() {
  const modal = document.getElementById('schedule-modal');
  const openBtn = document.getElementById('open-modal-btn');
  const closeBtns = document.querySelectorAll('.modal-close-btn');

  if (openBtn && modal) {
    openBtn.addEventListener('click', () => {
      // 달력에서 선택한 날짜로 기본값 설정
      const y = selectedDate.getFullYear();
      const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const d = String(selectedDate.getDate()).padStart(2, '0');
      document.querySelector('.modal-form input[type="date"]').value = `${y}-${m}-${d}`;
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

  const createBtn = document.querySelector('.modal-footer .btn-primary');

  if (createBtn) {
    createBtn.addEventListener('click', (e) => {
      e.preventDefault();
      createNewTimeslot(createBtn);
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
      currentFilter = Object.keys(STATUS_FILTERS).find(key => filterText.includes(key)) || '전체';
      renderAppointments();
    });
  });
}

function initAppointmentActions() {
  const appointmentList = document.querySelector('.appointment-list');
  if (!appointmentList) return;

  appointmentList.addEventListener('click', async (e) => {
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
      await Promise.all([fetchAppointmentsFromAPI(), loadMonth()]);
    } catch (error) {
      alert(error.message);
      if (approveBtn) approveBtn.disabled = false;
      if (rejectBtn) rejectBtn.disabled = false;
    }
  });
}

function updatePendingCount() {
  const pendingBadge = document.querySelector('.pending-count');
  if (pendingBadge) {
    pendingBadge.textContent = `대기 ${appointments.filter(STATUS_FILTERS['대기']).length}건`;
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
      actions = '<span class="status-waiting-badge">학생이 취소함</span>';
    }

    return `
      <div class="appointment-card ${cardClass}" data-id="${appt.id}">
        <div class="appt-status-bar"></div>
        <div class="appt-main">
          <div class="appt-user">
            <div class="user-avatar">${escapeHtml(appt.student_name.charAt(0))}</div>
            <div class="user-meta">
              <h4>${escapeHtml(appt.student_name)}</h4>
              <span class="appt-type${isOnline ? ' online' : ''}">${isOnline ? '화상 상담' : '방문 상담'}</span>
            </div>
          </div>
          <div class="appt-time">
            <i class="fa-regular fa-clock"></i> ${formatSlotRange(appt.start_at, appt.end_at)}
          </div>
          <p class="appt-topic"><strong>${topicLabel}:</strong> ${escapeHtml(topic)}</p>
          <div class="appt-actions">${actions}</div>
        </div>
      </div>`;
  }).join('');
}

async function createNewTimeslot(createBtn) {
  const dateInput = document.querySelector('.modal-form input[type="date"]').value;
  const startTime = document.querySelectorAll('.modal-form input[type="time"]')[0].value;
  const endTime = document.querySelectorAll('.modal-form input[type="time"]')[1].value;
  const type = document.querySelector('.modal-form select').value;
  const note = document.querySelector('.modal-form textarea').value;

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


  // 입력한 로컬 시간을 시간대가 포함된 ISO 문자열로 변환
  const startAt = new Date(`${dateInput}T${startTime}`);
  const endAt = new Date(`${dateInput}T${endTime}`);

  createBtn.disabled = true;
  try {
    await apiFetch('/api/reservations/timeslots', {
      method: 'POST',
      body: JSON.stringify({
        start_at: startAt.toISOString(),
        end_at: endAt.toISOString(),
        counseling_type: type,
        note,
      }),
    });

    document.getElementById('schedule-modal').style.display = 'none';
    document.querySelector('.modal-form textarea').value = '';
    selectedDate = startAt;
    currentDate = new Date(startAt);
    await loadMonth();
  } catch (error) {
    alert(error.message);
  } finally {
    createBtn.disabled = false;
  }
}

async function fetchAppointmentsFromAPI() {
  try {
    appointments = await apiFetch('/api/reservations');
  } catch (error) {
    appointments = [];
    console.error('예약 목록 로드 오류:', error);
  }
  renderAppointments();
}

async function fetchUserName() {
  try {
    const user = await apiFetch('/api/users/me');
    document.querySelector('.user-profile .name').textContent = `${user.username} 선생님`;
  } catch (error) {
    console.error('사용자 정보 로드 오류:', error);
  }
}
