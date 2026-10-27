document.addEventListener('DOMContentLoaded', () => {
  initCalendar();
  initTimeslotSelect();
});

const daysOfWeek = ['일', '월', '화', '수', '목', '금', '토'];

let currentDate = new Date();
let selectedDate = new Date();

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
      currentDate = new Date();
      selectedDate = new Date();
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

// 신청 가능 슬롯 클릭 시 예약 신청서의 일시를 선택한 날짜로 채움
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
