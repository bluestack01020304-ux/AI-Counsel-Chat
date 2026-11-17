document.addEventListener('DOMContentLoaded', () => {
  const isTeacher = getRole() === 'teachers';
  const recordList = document.getElementById('record-list');
  const recordDetail = document.getElementById('record-detail');
  const filterList = document.getElementById('filter-list');
  const todoCount = document.getElementById('todo-count');

  let records = [];
  let currentFilter = 'all';
  let selectedId = null;
  let useSample = false;

  const NOTE_MAX_LENGTH = 500;

  const QUICK_PHRASES = [
    { label: '상담 요약', text: '오늘 상담에서는 ' },
    { label: '잘한 점', text: '특히 잘하고 있는 점은 ' },
    { label: '보완할 점', text: '앞으로 보완하면 좋을 점은 ' },
    { label: '다음 상담까지 할 일', text: '다음 상담 전까지 ' },
    { label: '추천 활동', text: '추천하고 싶은 활동은 ' },
    { label: '응원 한마디', text: '지금처럼만 꾸준히 하면 충분히 잘할 수 있어. 응원할게!' },
  ];

  const labels = isTeacher
    ? { todo: '후기 작성 필요', done: '후기 작성 완료', count: '작성 필요' }
    : { todo: '후기 기다리는 중', done: '후기 도착', count: '받은 후기' };

  document.getElementById('role-badge').textContent = isTeacher ? '교사 모드' : '학생 모드';
  document.getElementById('user-desc').textContent = isTeacher ? '진로 지도 교사' : '학생';
  filterList.querySelector('[data-filter="todo"] .filter-label').textContent = labels.todo;
  filterList.querySelector('[data-filter="done"] .filter-label').textContent = labels.done;
  if (!isTeacher) {
    document.querySelector('.group-title').textContent = '메뉴';
    todoCount.hidden = true;
    filterList.querySelector('[data-filter="all"] .filter-label').textContent = '선생님 후기';
    filterList.querySelector('[data-filter="all"] i').className = 'fa-regular fa-comment-dots';
    filterList.querySelectorAll('[data-filter="todo"], [data-filter="done"]').forEach(li => li.remove());
  }
  document.getElementById('go-reservation-btn').addEventListener('click', () => {
    window.location.href = isTeacher ? 'TresV.html' : 'resV.html';
  });

  fetchUserName();
  fetchRecords();

  filterList.addEventListener('click', (e) => {
    const li = e.target.closest('li');
    if (!li) return;

    filterList.querySelectorAll('li').forEach(item => item.classList.remove('active'));
    li.classList.add('active');
    currentFilter = li.dataset.filter;
    renderList();
  });

  function authHeaders() {
    return { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` };
  }

  async function fetchUserName() {
    if (!localStorage.getItem('access_token')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/me`, { headers: authHeaders() });
      if (!response.ok) return;

      const userData = await response.json();
      document.getElementById('user-name').textContent = userData.name || userData.username || '사용자';
    } catch (error) {
      console.error('사용자 정보 로드 오류:', error);
    }
  }

  async function fetchRecords() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/counsel/records`, { headers: authHeaders() });
      if (!response.ok) throw new Error('상담 기록 조회 실패');
      records = await response.json();
    } catch (error) {
      console.error('상담 기록 로드 오류:', error);
      useSample = true;
      records = getSampleRecords();
    }

    const requestedId = new URLSearchParams(location.search).get('id');
    if (requestedId && records.some(r => String(r.record_id) === requestedId)) {
      selectedId = requestedId;
    }

    renderList();
    if (selectedId) renderDetail();
  }

  function hasNote(record) {
    return Boolean(record.teacher_note);
  }

  function findRecord(id) {
    return records.find(r => String(r.record_id) === String(id));
  }

  function renderList() {
    const count = records.filter(r => isTeacher ? !hasNote(r) : hasNote(r)).length;
    todoCount.textContent = `${labels.count} ${count}건`;

    const visible = records.filter(record => {
      if (currentFilter === 'todo') return !hasNote(record);
      if (currentFilter === 'done') return hasNote(record);
      return true;
    });

    recordList.innerHTML = '';
    if (visible.length === 0) {
      appendEmpty('해당하는 상담이 없어요.');
      return;
    }

    if (isTeacher) {
      visible.forEach(appendRecordItem);
      return;
    }

    [
      { title: labels.done, items: visible.filter(hasNote) },
      { title: labels.todo, items: visible.filter(r => !hasNote(r)) },
    ].forEach(group => {
      const header = document.createElement('li');
      header.className = 'record-group-title';
      header.textContent = `${group.title} (${group.items.length})`;
      recordList.appendChild(header);

      if (group.items.length === 0) {
        appendEmpty('아직 없어요.');
      } else {
        group.items.forEach(appendRecordItem);
      }
    });
  }

  function appendEmpty(text) {
    const empty = document.createElement('li');
    empty.className = 'record-list-empty';
    empty.textContent = text;
    recordList.appendChild(empty);
  }

  function appendRecordItem(record) {
    const li = document.createElement('li');
    li.className = 'record-item';
    li.classList.toggle('active', String(record.record_id) === String(selectedId));
    li.innerHTML = `
      <div class="record-item-top">
        <strong class="record-name"></strong>
        <span class="record-date"></span>
      </div>
      <p class="record-topic"></p>
      <span class="record-flag"></span>
    `;
    li.querySelector('.record-name').textContent = isTeacher ? record.student_name : record.teacher_name;
    li.querySelector('.record-date').textContent = formatDate(record.date);
    li.querySelector('.record-topic').textContent = record.topic;

    const flag = li.querySelector('.record-flag');
    flag.classList.add(hasNote(record) ? 'done' : 'todo');
    flag.textContent = hasNote(record) ? labels.done : labels.todo;

    li.addEventListener('click', () => {
      selectedId = record.record_id;
      renderList();
      renderDetail();
    });
    recordList.appendChild(li);
  }

  function renderDetail() {
    const record = findRecord(selectedId);
    if (!record) return;

    recordDetail.innerHTML = `
      <div class="detail-header">
        <h2 class="detail-title"></h2>
        <div class="detail-meta">
          <span class="appt-time"><i class="fa-regular fa-clock"></i> <span class="detail-date"></span></span>
          <span class="appt-type detail-type"></span>
        </div>
      </div>
      <p class="appt-topic"><strong>상담 안건:</strong> <span class="detail-topic"></span></p>

      <div class="note-block">
        <h3><i class="fa-solid fa-chalkboard-user"></i> 선생님 상담 후기</h3>
        <p class="note-guide"></p>
        <div class="note-body" id="note-body"></div>
      </div>
    `;

    recordDetail.querySelector('.detail-title').textContent = isTeacher
      ? `${record.student_name} ${record.student_info || ''}`.trim()
      : `${record.teacher_name}과의 상담`;
    recordDetail.querySelector('.detail-date').textContent = formatDate(record.date, true);
    recordDetail.querySelector('.detail-type').textContent = record.type || '';
    recordDetail.querySelector('.detail-topic').textContent = record.topic;
    recordDetail.querySelector('.note-guide').textContent = isTeacher
      ? '상담 내용을 정리하고 학생에게 전하고 싶은 조언이나 다음 할 일을 적어주세요. 학생도 이 후기를 볼 수 있어요.'
      : '선생님이 상담 후 남겨주신 후기예요.';

    if (isTeacher) {
      renderNoteEditor(record);
    } else {
      renderNoteView(record);
    }
  }

  function renderNoteEditor(record) {
    const body = document.getElementById('note-body');
    body.innerHTML = `
      <div class="quick-phrases"></div>
      <input type="text" class="note-input" placeholder="예) 오늘 이야기한 학과 정보 꼭 찾아보고, 다음 주까지 세특 정리해서 가져오자!">
      <div class="note-actions">
        <span class="note-saved-at"></span>
        <span class="note-length"></span>
        <button class="btn btn-primary"><i class="fa-solid fa-floppy-disk"></i> 후기 저장</button>
      </div>
    `;
    const input = body.querySelector('.note-input');
    const lengthText = body.querySelector('.note-length');
    const saveBtn = body.querySelector('.note-actions button');
    input.maxLength = NOTE_MAX_LENGTH;
    input.value = record.teacher_note || '';
    body.querySelector('.note-saved-at').textContent = savedAtText(record.note_updated_at);

    const updateLength = () => {
      lengthText.textContent = `${input.value.length} / ${NOTE_MAX_LENGTH}`;
    };
    updateLength();
    input.addEventListener('input', updateLength);

    const phraseBox = body.querySelector('.quick-phrases');
    QUICK_PHRASES.forEach(phrase => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'phrase-chip';
      chip.textContent = phrase.label;
      chip.addEventListener('click', () => {
        insertPhrase(input, phrase.text);
        updateLength();
      });
      phraseBox.appendChild(chip);
    });

    async function submitNote() {
      const content = input.value.trim();
      if (!content) {
        alert('후기 내용을 입력해주세요.');
        input.focus();
        return;
      }
      const ok = await save(saveBtn, `/api/counsel/records/${record.record_id}/note`, { content });
      if (!ok) return;

      record.teacher_note = content;
      record.note_updated_at = new Date().toISOString();
      renderList();
      renderDetail();
    }

    saveBtn.addEventListener('click', submitNote);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.isComposing) {
        e.preventDefault();
        submitNote();
      }
    });
  }

  function insertPhrase(input, text) {
    const before = input.value.slice(0, input.selectionStart);
    const after = input.value.slice(input.selectionEnd);
    const prefix = before && !before.endsWith(' ') ? ' ' : '';
    const inserted = (before + prefix + text).slice(0, NOTE_MAX_LENGTH);

    input.value = (inserted + after).slice(0, NOTE_MAX_LENGTH);
    input.focus();
    input.setSelectionRange(inserted.length, inserted.length);
  }

  function renderNoteView(record) {
    const body = document.getElementById('note-body');
    const p = document.createElement('p');
    p.className = 'note-text';
    if (hasNote(record)) {
      p.textContent = record.teacher_note;
    } else {
      p.classList.add('empty');
      p.textContent = '아직 선생님이 후기를 남기지 않았어요.';
    }
    body.appendChild(p);

    if (record.note_updated_at) {
      const savedAt = document.createElement('p');
      savedAt.className = 'note-saved-at';
      savedAt.textContent = savedAtText(record.note_updated_at);
      body.appendChild(savedAt);
    }
  }

  async function save(button, path, payload) {
    if (!isTeacher) {
      alert('후기는 선생님만 작성할 수 있어요.');
      return false;
    }
    if (useSample) {
      alert('아직 서버와 연결되지 않아 이 화면에만 임시로 저장돼요.');
      return true;
    }

    button.disabled = true;
    try {
      const response = await fetch(`${API_BASE_URL}${path}`, {
        method: 'PUT',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error('저장 실패');
      return true;
    } catch (error) {
      console.error('저장 오류:', error);
      alert('저장에 실패했어요. 잠시 후 다시 시도해주세요.');
      return false;
    } finally {
      button.disabled = false;
    }
  }

  function formatDate(value, withTime = false) {
    const date = new Date(value);
    if (isNaN(date)) return value || '';
    const options = { month: 'long', day: 'numeric', weekday: 'short' };
    if (withTime) Object.assign(options, { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleString('ko-KR', options);
  }

  function savedAtText(value) {
    if (!value) return '';
    return isTeacher ? `마지막 저장: ${formatDate(value, true)}` : `${formatDate(value, true)} 작성`;
  }

  function getSampleRecords() {
    return [
      {
        record_id: 1,
        student_name: '김민준',
        student_info: '(2학년 3반 05번)',
        teacher_name: '박진로 선생님',
        date: '2026-10-06T16:00:00',
        type: '방문 상담',
        topic: '컴퓨터공학과 진학을 위한 1차 진로 상담',
        teacher_note: '관심 분야가 분명해서 좋았어. 정보 과목 세특에 프로젝트 경험을 더 구체적으로 남기자. 다음 상담 전까지 자소서 초안 보내줘!',
        note_updated_at: '2026-10-06T17:10:00',
      },
      {
        record_id: 2,
        student_name: '이서연',
        student_info: '(2학년 3반 21번)',
        teacher_name: '박진로 선생님',
        date: '2026-10-08T14:00:00',
        type: '화상 상담',
        topic: '간호학과 수시 지원 전략 및 면접 준비',
        teacher_note: '',
      },
    ];
  }
});
