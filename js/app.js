/* ============================================================
   情報共有ポータル - フロントエンドロジック
   ============================================================ */

// ---- State ----
const state = {
  currentPage: 'dashboard',
  members: [],
  notices: [],
  events: [],
  goals: [],
  schedules: [],
  currentMember: null,       // ログイン中のメンバー
  calYear: new Date().getFullYear(),
  calMonth: new Date().getMonth(),
};

// ---- API ----
async function api(action, params = {}) {
  const url = CONFIG.GAS_URL;
  if (!url || url.includes('YOUR_DEPLOYMENT_ID')) {
    return mockApi(action, params);
  }
  const readActions = ['verify','getNotices','getEvents','getGoals','getMembers','getSchedules','addAccessLog'];
  try {
    if (readActions.includes(action)) {
      const qp = new URLSearchParams({ action, ...params });
      const res = await fetch(`${url}?${qp.toString()}`, { redirect: 'follow' });
      return await res.json();
    } else {
      const res = await fetch(url, {
        method: 'POST',
        redirect: 'follow',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action, ...params }),
      });
      return await res.json();
    }
  } catch (e) {
    console.error('API error:', e);
    return { success: false, error: e.message };
  }
}

// ---- Mock data (for demo when GAS URL not set) ----
const mockDB = {
  members: [
    { id: 'm1', name: '田中 太郎', role: 'リーダー', email: 'taro@example.com', joinDate: '2024-04-01' },
    { id: 'm2', name: '佐藤 花子', role: 'メンバー', email: 'hanako@example.com', joinDate: '2024-04-01' },
    { id: 'm3', name: '鈴木 一郎', role: 'メンバー', email: 'ichiro@example.com', joinDate: '2024-04-01' },
    { id: 'm4', name: '高橋 美咲', role: 'メンバー', email: 'misaki@example.com', joinDate: '2024-05-01' },
  ],
  notices: [
    { id: 'n1', title: '定例会議のお知らせ', content: '毎週月曜日 10:00〜 にオンラインで実施します。\nZoomのリンクは別途送付します。', author: '田中 太郎', date: '2026-06-01 09:00', priority: 'important' },
    { id: 'n2', title: 'ポータルサイト開設！', content: 'チームの情報共有ポータルを開設しました。\nお知らせ・カレンダー・目標管理などが使えます。', author: '田中 太郎', date: '2026-06-01 08:00', priority: 'normal' },
  ],
  events: [
    { id: 'e1', title: '月次定例会議', startDate: '2026-06-09', endDate: '2026-06-09', description: '6月の振り返りと7月の目標設定', category: 'work', author: '田中 太郎' },
    { id: 'e2', title: 'チーム懇親会', startDate: '2026-06-20', endDate: '2026-06-20', description: '場所：〇〇レストラン 18:00〜', category: 'social', author: '佐藤 花子' },
    { id: 'e3', title: '目標中間レビュー', startDate: '2026-06-15', endDate: '2026-06-15', description: '上半期の進捗確認', category: 'work', author: '田中 太郎' },
  ],
  goals: [
    { id: 'g1', memberId: 'm1', memberName: '田中 太郎', type: 'yearly', year: '2026', month: '', content: '新規顧客を20社獲得する', status: 'active', createdAt: '2026-01-01' },
    { id: 'g2', memberId: 'm1', memberName: '田中 太郎', type: 'monthly', year: '2026', month: '6', content: '提案書を3件完成させる', status: 'active', createdAt: '2026-06-01' },
    { id: 'g3', memberId: 'm2', memberName: '佐藤 花子', type: 'yearly', year: '2026', month: '', content: 'プロジェクト管理スキルを向上させる', status: 'done', createdAt: '2026-01-01' },
    { id: 'g4', memberId: 'm2', memberName: '佐藤 花子', type: 'monthly', year: '2026', month: '6', content: 'チームのWiki整備を完了させる', status: 'active', createdAt: '2026-06-01' },
  ],
  schedules: [
    { id: 's1', memberId: 'm1', memberName: '田中 太郎', date: '2026-06-02', plan: '提案書作成・顧客Aとの打ち合わせ', actual: '提案書完成。打ち合わせは来週に延期', status: 'done', note: '' },
    { id: 's2', memberId: 'm2', memberName: '佐藤 花子', date: '2026-06-02', plan: 'Wikiページ10件更新', actual: '', status: 'planned', note: '' },
  ],
};

function mockApi(action, params) {
  const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
  switch (action) {
    case 'verify':
      return { success: params.code === 'portal2024' };
    case 'getMembers':
      return { success: true, data: mockDB.members };
    case 'addMember': {
      const m = { id: 'm' + Date.now(), name: params.name, role: params.role || 'メンバー', email: params.email || '', joinDate: new Date().toISOString().slice(0,10) };
      mockDB.members.push(m);
      return { success: true };
    }
    case 'deleteMember':
      mockDB.members = mockDB.members.filter(x => x.id !== params.id);
      return { success: true };
    case 'getNotices':
      return { success: true, data: [...mockDB.notices].sort((a,b) => b.date.localeCompare(a.date)) };
    case 'addNotice': {
      mockDB.notices.unshift({ id: 'n' + Date.now(), title: params.title, content: params.content, author: params.author, date: now, priority: params.priority || 'normal' });
      return { success: true };
    }
    case 'deleteNotice':
      mockDB.notices = mockDB.notices.filter(x => x.id !== params.id);
      return { success: true };
    case 'getEvents':
      return { success: true, data: [...mockDB.events].sort((a,b) => a.startDate.localeCompare(b.startDate)) };
    case 'addEvent': {
      mockDB.events.push({ id: 'e' + Date.now(), title: params.title, startDate: params.startDate, endDate: params.endDate || params.startDate, description: params.description || '', category: params.category || 'other', author: params.author || '' });
      return { success: true };
    }
    case 'deleteEvent':
      mockDB.events = mockDB.events.filter(x => x.id !== params.id);
      return { success: true };
    case 'updateEvent': {
      const ev = mockDB.events.find(x => x.id === params.id);
      if (ev) { ['title','startDate','endDate','description','category'].forEach(f => { if (params[f] !== undefined) ev[f] = params[f]; }); }
      return { success: true };
    }
    case 'getGoals': {
      let items = mockDB.goals;
      if (params.memberId) items = items.filter(g => g.memberId === params.memberId);
      if (params.type)     items = items.filter(g => g.type === params.type);
      if (params.year)     items = items.filter(g => String(g.year) === String(params.year));
      if (params.month)    items = items.filter(g => String(g.month) === String(params.month));
      return { success: true, data: items };
    }
    case 'addGoal': {
      mockDB.goals.push({ id: 'g' + Date.now(), memberId: params.memberId, memberName: params.memberName, type: params.type, year: params.year, month: params.month || '', content: params.content, status: 'active', createdAt: new Date().toISOString().slice(0,10) });
      return { success: true };
    }
    case 'updateGoal': {
      const g = mockDB.goals.find(x => x.id === params.id);
      if (g) { if (params.status !== undefined) g.status = params.status; if (params.content !== undefined) g.content = params.content; }
      return { success: true };
    }
    case 'deleteGoal':
      mockDB.goals = mockDB.goals.filter(x => x.id !== params.id);
      return { success: true };
    case 'getSchedules': {
      let items = mockDB.schedules;
      if (params.memberId) items = items.filter(s => s.memberId === params.memberId);
      if (params.dateFrom) items = items.filter(s => s.date >= params.dateFrom);
      if (params.dateTo)   items = items.filter(s => s.date <= params.dateTo);
      return { success: true, data: [...items].sort((a,b) => a.date.localeCompare(b.date)) };
    }
    case 'addSchedule': {
      mockDB.schedules.push({ id: 's' + Date.now(), memberId: params.memberId, memberName: params.memberName, date: params.date, plan: params.plan || '', actual: params.actual || '', status: params.status || 'planned', note: params.note || '' });
      return { success: true };
    }
    case 'updateSchedule': {
      const s = mockDB.schedules.find(x => x.id === params.id);
      if (s) { ['plan','actual','status','note'].forEach(f => { if (params[f] !== undefined) s[f] = params[f]; }); }
      return { success: true };
    }
    case 'deleteSchedule':
      mockDB.schedules = mockDB.schedules.filter(x => x.id !== params.id);
      return { success: true };
    default:
      return { success: false, error: 'Unknown action' };
  }
}

// ---- UI Helpers ----
function showSpinner() { document.getElementById('spinner').classList.add('show'); }
function hideSpinner() { document.getElementById('spinner').classList.remove('show'); }

function showToast(msg, type = 'default') {
  const c = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
  const form = document.querySelector('#' + id + ' form');
  if (form) form.reset();
}

function escapeHtml(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function toTimeStr(val) {
  if (!val) return '';
  const s = String(val).replace(/^T/, ''); // Tプレフィックスを除去
  if (!s) return '';
  // ISO形式 (例: "1899-12-29T15:00:00.000Z") → JST時刻に変換
  if (s.includes('T') && s.includes('Z')) {
    const d = new Date(s);
    return String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0');
  }
  // 日付のみ形式 (YYYY-MM-DD) は非表示
  if (s.match(/^\d{4}-\d{2}-\d{2}$/)) return '';
  // 通常のHH:MM形式
  return s.slice(0, 5);
}

function toDateStr(val) {
  if (!val) return '';
  // ISO形式 "2026-07-04T15:00:00.000Z" → JST日付文字列に変換
  if (String(val).includes('T')) {
    const d = new Date(val);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }
  return String(val);
}

function priorityBadge(p) {
  if (p === 'urgent')    return '<span class="badge badge-red">緊急</span>';
  if (p === 'important') return '<span class="badge badge-yellow">重要</span>';
  return '<span class="badge badge-blue">通常</span>';
}

function statusBadge(s) {
  if (s === 'done')    return '<span class="badge badge-green">完了</span>';
  if (s === 'planned') return '<span class="badge badge-blue">予定</span>';
  return '<span class="badge badge-gray">' + escapeHtml(s) + '</span>';
}

function goalStatusBadge(s) {
  if (s === 'done')   return '<span class="badge badge-green">達成</span>';
  if (s === 'active') return '<span class="badge badge-blue">進行中</span>';
  return '<span class="badge badge-gray">' + escapeHtml(s) + '</span>';
}

// ---- Auth ----
async function handleLogin() {
  const code = document.getElementById('access-code').value.trim();
  if (!code) return;
  showSpinner();
  const [verifyRes, membersRes] = await Promise.all([
    api('verify', { code }),
    api('getMembers'),
  ]);
  hideSpinner();
  if (verifyRes.success) {
    sessionStorage.setItem('auth', '1');
    // メンバー一覧を表示してメンバー選択ステップへ
    state.members = membersRes.data || [];
    showMemberSelect();
  } else {
    const err = document.getElementById('login-error');
    err.style.display = 'block';
    err.textContent = 'アクセスコードが正しくありません';
    setTimeout(() => { err.style.display = 'none'; }, 3000);
  }
}

function showMemberSelect() {
  document.getElementById('login-step1').style.display = 'none';
  document.getElementById('login-step2').style.display = 'block';
  const list = document.getElementById('member-select-list');
  list.className = 'member-select-grid';
  list.innerHTML = state.members.map(m => `
    <button class="member-select-btn" onclick="selectMember('${m.id}')">
      <div class="ms-avatar">${escapeHtml(m.name[0])}</div>
      <span>${escapeHtml(m.name)}</span>
    </button>`).join('');
}

function selectMember(memberId) {
  const member = state.members.find(m => m.id === memberId);
  if (!member) return;
  state.currentMember = member;
  sessionStorage.setItem('memberId', memberId);
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app').style.display = 'flex';
  document.getElementById('user-name').textContent = member.name;
  document.getElementById('user-avatar').textContent = member.name[0];
  populateMemberSelects();
  navigate('dashboard');
  api('addAccessLog', { memberName: member.name }).catch(() => {});
}

function logAction(action) {
  const name = state.currentMember?.name || '';
  api('addAccessLog', { memberName: name, logAction: action }).catch(() => {});
}

// ---- Navigation ----
function navigate(page) {
  state.currentPage = page;
  document.querySelectorAll('.nav-item').forEach(el => el.classList.toggle('active', el.dataset.page === page));
  document.querySelectorAll('.page').forEach(el => el.classList.toggle('active', el.id === 'page-' + page));

  const titles = {
    dashboard: 'ダッシュボード', notices: 'お知らせ掲示板', calendar: 'イベントカレンダー',
    goals: '目標管理', schedules: '予定・実績', members: 'メンバー管理'
  };
  document.getElementById('page-title').textContent = titles[page] || page;

  const loaders = {
    dashboard: loadDashboard,
    notices: loadNotices,
    calendar: renderCalendar,
    goals: loadGoals,
    schedules: loadSchedules,
    members: loadMembers,
  };
  if (loaders[page]) loaders[page]();
}

// ---- Init ----
async function initApp() {
  showSpinner();
  const [mRes] = await Promise.all([api('getMembers')]);
  if (mRes.success) state.members = mRes.data;
  // Populate member selects
  populateMemberSelects();
  hideSpinner();
  navigate('dashboard');
}

function populateMemberSelects() {
  const opts = '<option value="">全メンバー</option>' + state.members.map(m => `<option value="${m.id}">${escapeHtml(m.name)}</option>`).join('');
  ['filter-member', 'goal-filter-member', 'schedule-filter-member'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = opts;
  });
  const reqOpts = state.members.map(m => `<option value="${m.id}">${escapeHtml(m.name)}</option>`).join('');
  ['goal-member', 'schedule-member'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = '<option value="">選択してください</option>' + reqOpts;
  });

  // Set current member default (first member)
  if (state.members.length > 0 && !state.currentMember) {
    state.currentMember = state.members[0];
    document.getElementById('user-name').textContent = state.currentMember.name;
    document.getElementById('user-avatar').textContent = state.currentMember.name[0];
  }
}

// ---- Dashboard ----
async function loadDashboard() {
  showSpinner();
  const [nRes, eRes, gRes, sRes] = await Promise.all([
    api('getNotices'), api('getEvents'), api('getGoals', {}), api('getSchedules', {})
  ]);
  hideSpinner();
  if (nRes.success) state.notices = nRes.data;
  if (eRes.success) state.events = eRes.data;
  if (gRes.success) state.goals = gRes.data;
  if (sRes.success) state.schedules = sRes.data;

  const today = new Date().toISOString().slice(0,10);
  const upcoming = (state.events || []).filter(e => toDateStr(e.startDate) >= today).slice(0,3);
  const recentNotices = (state.notices || []).slice(0,3);

  document.getElementById('stat-notices').textContent = state.notices.length;
  document.getElementById('stat-events').textContent = (state.events || []).filter(e => e.startDate >= today).length;
  document.getElementById('stat-goals').textContent = (state.goals || []).filter(g => g.status === 'active').length;
  document.getElementById('stat-members').textContent = state.members.length;

  // Recent notices
  document.getElementById('dash-notices').innerHTML = recentNotices.length
    ? recentNotices.map(n => `
        <div class="notice-card ${n.priority}">
          <div class="notice-header">
            <div class="notice-title">${escapeHtml(n.title)}</div>
            ${priorityBadge(n.priority)}
          </div>
          <div class="notice-meta">${escapeHtml(n.author)} · ${escapeHtml(n.date)}</div>
          <div class="notice-body">${escapeHtml(n.content).slice(0,100)}${n.content.length > 100 ? '...' : ''}</div>
        </div>`).join('')
    : '<div class="empty-state"><p>お知らせはありません</p></div>';

  // Upcoming events
  document.getElementById('dash-events').innerHTML = upcoming.length
    ? `<table><thead><tr><th>日付</th><th>イベント</th><th>カテゴリ</th></tr></thead><tbody>
        ${upcoming.map(e => `<tr>
          <td>${escapeHtml(toDateStr(e.startDate))}</td>
          <td>${escapeHtml(e.title)}</td>
          <td><span class="badge badge-blue">${escapeHtml(e.category)}</span></td>
        </tr>`).join('')}
      </tbody></table>`
    : '<div class="empty-state"><p>予定はありません</p></div>';
}

// ---- Notices ----
async function loadNotices() {
  showSpinner();
  const res = await api('getNotices');
  hideSpinner();
  if (!res.success) return showToast('取得に失敗しました', 'error');
  state.notices = res.data;
  renderNotices();
}

function renderNotices() {
  const list = document.getElementById('notices-list');
  list.innerHTML = state.notices.length
    ? state.notices.map(n => `
      <div class="notice-card ${n.priority}">
        <div class="notice-header">
          <div>
            <div class="notice-title">${escapeHtml(n.title)}</div>
            <div class="notice-meta">${escapeHtml(n.author)} · ${escapeHtml(n.date)}</div>
          </div>
          <div style="display:flex;gap:8px;align-items:center">
            ${priorityBadge(n.priority)}
            <button class="btn btn-sm btn-danger btn-icon" onclick="deleteNotice('${n.id}')">✕</button>
          </div>
        </div>
        <div class="notice-body">${escapeHtml(n.content)}</div>
      </div>`).join('')
    : '<div class="empty-state"><div class="empty-icon">📭</div><p>お知らせはありません</p></div>';
}

async function submitNotice(e) {
  e.preventDefault();
  const body = {
    title:    document.getElementById('notice-title').value,
    content:  document.getElementById('notice-content').value,
    priority: document.getElementById('notice-priority').value,
    author:   state.currentMember?.name || 'Unknown',
  };
  showSpinner();
  const res = await api('addNotice', body);
  hideSpinner();
  if (res.success) {
    showToast('お知らせを投稿しました', 'success');
    closeModal('modal-notice');
    loadNotices();
    logAction('お知らせ追加：' + body.title);
  } else showToast('投稿に失敗しました', 'error');
}

async function deleteNotice(id) {
  if (!confirm('このお知らせを削除しますか？')) return;
  showSpinner();
  const res = await api('deleteNotice', { id });
  hideSpinner();
  if (res.success) { showToast('削除しました'); loadNotices(); logAction('お知らせ削除'); }
  else showToast('削除に失敗しました', 'error');
}

// ---- Calendar ----
async function loadCalendarData() {
  const res = await api('getEvents');
  if (res.success) state.events = res.data;
}

async function renderCalendar() {
  if (!state.events.length) {
    showSpinner();
    await loadCalendarData();
    hideSpinner();
  } else await loadCalendarData();

  const y = state.calYear, m = state.calMonth;
  document.getElementById('cal-label').textContent = `${y}年 ${m+1}月`;

  const firstDay = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m+1, 0).getDate();
  const today = new Date().toISOString().slice(0,10);

  const eventsThisMonth = (state.events || []).filter(e => {
    const d = toDateStr(e.startDate) || '';
    return d.startsWith(`${y}-${String(m+1).padStart(2,'0')}`);
  });

  let html = '';
  const days = ['日','月','火','水','木','金','土'];
  days.forEach(d => { html += `<div class="cal-day-header">${d}</div>`; });

  for (let i = 0; i < firstDay; i++) html += '<div class="cal-cell empty"></div>';

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const dow = new Date(y, m, d).getDay();
    const isToday = dateStr === today;
    const cls = ['cal-cell', isToday ? 'today' : '', dow===0 ? 'sunday' : '', dow===6 ? 'saturday' : ''].filter(Boolean).join(' ');
    const dayEvents = eventsThisMonth.filter(e => toDateStr(e.startDate) === dateStr);

    html += `<div class="${cls}">
      <div class="cal-date">${d}</div>
      ${dayEvents.map(e => `<div class="cal-event cat-${e.category}" onclick="openEventDetail('${e.id}')" style="cursor:pointer">${toTimeStr(e.startTime) ? toTimeStr(e.startTime)+' ' : ''}${escapeHtml(e.title)}</div>`).join('')}
    </div>`;
  }

  document.getElementById('cal-grid').innerHTML = html;

  // イベント一覧テーブル更新
  const tbody = document.getElementById('events-tbody');
  if (tbody) {
    const sorted = [...(state.events||[])].sort((a,b) => toDateStr(a.startDate).localeCompare(toDateStr(b.startDate)));
    tbody.innerHTML = sorted.length ? sorted.map(e => `
      <tr>
        <td>${escapeHtml(toDateStr(e.startDate))}</td>
        <td>${toTimeStr(e.startTime)} ${toTimeStr(e.endTime) ? '〜 '+toTimeStr(e.endTime) : ''}</td>
        <td style="cursor:pointer;color:var(--primary)" onclick="openEventDetail('${e.id}')">${escapeHtml(e.title)}</td>
        <td>${escapeHtml(e.description||'')}</td>
        <td><span class="badge badge-blue">${escapeHtml(e.category||'')}</span></td>
        <td>
          <button class="btn btn-sm btn-secondary" onclick="openEditEvent('${e.id}')">編集</button>
          <button class="btn btn-sm btn-danger btn-icon" onclick="deleteEvent('${e.id}')" style="margin-left:4px">✕</button>
        </td>
      </tr>`).join('')
    : '<tr><td colspan="5" style="text-align:center;padding:30px;color:#6b7280">イベントがありません</td></tr>';
  }
}

let detailEventId = null;
function openEventDetail(id) {
  const ev = state.events.find(x => String(x.id) === String(id));
  if (!ev) return;
  detailEventId = id;
  document.getElementById('detail-event-title').textContent    = ev.title;
  document.getElementById('detail-event-date').textContent     = toDateStr(ev.startDate);
  document.getElementById('detail-event-start-time').textContent = toTimeStr(ev.startTime) || '未設定';
  document.getElementById('detail-event-end-time').textContent   = toTimeStr(ev.endTime)   || '未設定';
  document.getElementById('detail-event-category').textContent = ev.category || '';
  document.getElementById('detail-event-desc').textContent     = ev.description || '';
  openModal('modal-event-detail');
}

function openEditFromDetail() {
  closeModal('modal-event-detail');
  openEditEvent(detailEventId);
}

async function deleteEvent(id) {
  if (!confirm('このイベントを削除しますか？')) return;
  showSpinner();
  const res = await api('deleteEvent', { id });
  hideSpinner();
  if (res.success) { showToast('削除しました'); state.events = []; renderCalendar(); logAction('イベント削除'); }
  else showToast('削除に失敗しました', 'error');
}

let editingEventId = null;
function openEditEvent(id) {
  const ev = state.events.find(x => String(x.id) === String(id));
  if (!ev) return;
  editingEventId = id;
  document.getElementById('edit-event-title').value      = ev.title;
  document.getElementById('edit-event-start').value      = toDateStr(ev.startDate);
  document.getElementById('edit-event-start-time').value = toTimeStr(ev.startTime);
  document.getElementById('edit-event-end-time').value   = toTimeStr(ev.endTime);
  document.getElementById('edit-event-category').value  = ev.category || 'work';
  document.getElementById('edit-event-desc').value      = ev.description || '';
  openModal('modal-edit-event');
}

async function submitEditEvent(e) {
  e.preventDefault();
  const body = {
    id:          editingEventId,
    title:       document.getElementById('edit-event-title').value,
    startDate:   document.getElementById('edit-event-start').value,
    endDate:     document.getElementById('edit-event-start').value,
    startTime:   'T' + document.getElementById('edit-event-start-time').value,
    endTime:     'T' + document.getElementById('edit-event-end-time').value,
    category:    document.getElementById('edit-event-category').value,
    description: document.getElementById('edit-event-desc').value,
  };
  showSpinner();
  const res = await api('updateEvent', body);
  hideSpinner();
  if (res.success) {
    showToast('更新しました', 'success');
    closeModal('modal-edit-event');
    state.events = [];
    renderCalendar();
    logAction('イベント編集：' + body.title);
  } else showToast('更新に失敗しました', 'error');
}

async function submitEvent(e) {
  e.preventDefault();
  const body = {
    title:       document.getElementById('event-title').value,
    startDate:   document.getElementById('event-start').value,
    endDate:     document.getElementById('event-start').value,
    startTime:   'T' + document.getElementById('event-start-time').value,
    endTime:     'T' + document.getElementById('event-end-time').value,
    description: document.getElementById('event-desc').value,
    category:    document.getElementById('event-category').value,
    author:      state.currentMember?.name || '',
  };
  showSpinner();
  const res = await api('addEvent', body);
  hideSpinner();
  if (res.success) {
    showToast('イベントを追加しました', 'success');
    closeModal('modal-event');
    logAction('イベント追加：' + body.title);
    state.events = [];
    renderCalendar();
  } else showToast('追加に失敗しました', 'error');
}

// ---- Goals ----
async function loadGoals() {
  const params = {};
  const memberId = document.getElementById('goal-filter-member')?.value;
  const type     = document.getElementById('goal-filter-type')?.value;
  const year     = document.getElementById('goal-filter-year')?.value;
  if (memberId) params.memberId = memberId;
  if (type)     params.type = type;
  if (year)     params.year = year;

  showSpinner();
  const res = await api('getGoals', params);
  hideSpinner();
  if (!res.success) return showToast('取得に失敗しました', 'error');
  state.goals = res.data;
  renderGoals();
}

function renderGoals() {
  const list = document.getElementById('goals-list');
  if (!state.goals.length) {
    list.innerHTML = '<div class="empty-state"><div class="empty-icon">🎯</div><p>目標がありません</p></div>';
    return;
  }

  // Group by member
  const byMember = {};
  state.goals.forEach(g => {
    if (!byMember[g.memberName]) byMember[g.memberName] = [];
    byMember[g.memberName].push(g);
  });

  list.innerHTML = Object.entries(byMember).map(([name, goals]) => `
    <div class="card" style="margin-bottom:16px">
      <div class="card-header">
        <div class="card-title">${escapeHtml(name)}</div>
        <span class="badge badge-blue">${goals.length}件</span>
      </div>
      <div class="card-body" style="padding:8px 20px">
        ${goals.map(g => `
          <div class="goal-item">
            <div class="goal-check ${g.status === 'done' ? 'done' : ''}"
                 onclick="toggleGoal('${g.id}','${g.status}')">
              ${g.status === 'done' ? '✓' : ''}
            </div>
            <div style="flex:1">
              <div class="goal-content ${g.status === 'done' ? 'done' : ''}">${escapeHtml(g.content)}</div>
              <div class="goal-meta">
                ${g.type === 'yearly' ? '年次目標' : `月次目標 ${g.year}年${g.month}月`}
                · ${goalStatusBadge(g.status)}
              </div>
            </div>
            <button class="btn btn-sm btn-danger btn-icon" onclick="deleteGoal('${g.id}')">✕</button>
          </div>`).join('')}
      </div>
    </div>`).join('');
}

async function toggleGoal(id, currentStatus) {
  const newStatus = currentStatus === 'done' ? 'active' : 'done';
  showSpinner();
  const res = await api('updateGoal', { id, status: newStatus });
  hideSpinner();
  if (res.success) { loadGoals(); logAction('目標ステータス更新'); }
  else showToast('更新に失敗しました', 'error');
}

async function deleteGoal(id) {
  if (!confirm('この目標を削除しますか？')) return;
  showSpinner();
  const res = await api('deleteGoal', { id });
  hideSpinner();
  if (res.success) { showToast('削除しました'); loadGoals(); logAction('目標削除'); }
  else showToast('削除に失敗しました', 'error');
}

async function submitGoal(e) {
  e.preventDefault();
  const memberId = document.getElementById('goal-member').value;
  const member   = state.members.find(m => m.id === memberId);
  const type     = document.getElementById('goal-type').value;
  const body = {
    memberId,
    memberName: member?.name || '',
    type,
    year:    document.getElementById('goal-year').value,
    month:   type === 'monthly' ? document.getElementById('goal-month').value : '',
    content: document.getElementById('goal-content').value,
  };
  showSpinner();
  const res = await api('addGoal', body);
  hideSpinner();
  if (res.success) {
    showToast('目標を追加しました', 'success');
    closeModal('modal-goal');
    loadGoals();
    logAction('目標追加');
  } else showToast('追加に失敗しました', 'error');
}

function onGoalTypeChange() {
  const type = document.getElementById('goal-type').value;
  document.getElementById('goal-month-group').style.display = type === 'monthly' ? 'block' : 'none';
}

// ---- Schedules ----
async function loadSchedules() {
  const params = {};
  const memberId = document.getElementById('schedule-filter-member')?.value;
  const dateFrom = document.getElementById('schedule-date-from')?.value;
  const dateTo   = document.getElementById('schedule-date-to')?.value;
  if (memberId) params.memberId = memberId;
  if (dateFrom) params.dateFrom = dateFrom;
  if (dateTo)   params.dateTo   = dateTo;

  showSpinner();
  const res = await api('getSchedules', params);
  hideSpinner();
  if (!res.success) return showToast('取得に失敗しました', 'error');
  state.schedules = res.data;
  renderSchedules();
}

function renderSchedules() {
  const tbody = document.getElementById('schedules-tbody');
  if (!state.schedules.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:#6b7280">データがありません</td></tr>';
    return;
  }
  tbody.innerHTML = state.schedules.map(s => `
    <tr>
      <td>${escapeHtml(s.date)}</td>
      <td>${escapeHtml(s.memberName)}</td>
      <td style="max-width:200px">${escapeHtml(s.plan)}</td>
      <td style="max-width:200px">${s.actual ? escapeHtml(s.actual) : '<span style="color:#9ca3af">未記入</span>'}</td>
      <td>${statusBadge(s.status)}</td>
      <td>
        <button class="btn btn-sm btn-secondary" onclick="openEditSchedule('${s.id}')">編集</button>
        <button class="btn btn-sm btn-danger btn-icon" onclick="deleteSchedule('${s.id}')" style="margin-left:4px">✕</button>
      </td>
    </tr>`).join('');
}

async function submitSchedule(e) {
  e.preventDefault();
  const memberId = document.getElementById('schedule-member').value;
  const member   = state.members.find(m => m.id === memberId);
  const body = {
    memberId,
    memberName: member?.name || '',
    date:   document.getElementById('schedule-date').value,
    plan:   document.getElementById('schedule-plan').value,
    actual: document.getElementById('schedule-actual').value,
    status: document.getElementById('schedule-status').value,
    note:   document.getElementById('schedule-note').value,
  };
  showSpinner();
  const res = await api('addSchedule', body);
  hideSpinner();
  if (res.success) {
    showToast('予定を追加しました', 'success');
    closeModal('modal-schedule');
    loadSchedules();
    logAction('スケジュール追加');
  } else showToast('追加に失敗しました', 'error');
}

let editingScheduleId = null;
function openEditSchedule(id) {
  const s = state.schedules.find(x => String(x.id) === String(id));
  if (!s) return;
  editingScheduleId = id;
  document.getElementById('edit-schedule-plan').value   = s.plan;
  document.getElementById('edit-schedule-actual').value = s.actual;
  document.getElementById('edit-schedule-status').value = s.status;
  document.getElementById('edit-schedule-note').value   = s.note;
  openModal('modal-edit-schedule');
}

async function submitEditSchedule(e) {
  e.preventDefault();
  const body = {
    id:     editingScheduleId,
    plan:   document.getElementById('edit-schedule-plan').value,
    actual: document.getElementById('edit-schedule-actual').value,
    status: document.getElementById('edit-schedule-status').value,
    note:   document.getElementById('edit-schedule-note').value,
  };
  showSpinner();
  const res = await api('updateSchedule', body);
  hideSpinner();
  if (res.success) {
    showToast('更新しました', 'success');
    closeModal('modal-edit-schedule');
    loadSchedules();
    logAction('スケジュール更新');
  } else showToast('更新に失敗しました', 'error');
}

async function deleteSchedule(id) {
  if (!confirm('この記録を削除しますか？')) return;
  showSpinner();
  const res = await api('deleteSchedule', { id });
  hideSpinner();
  if (res.success) { showToast('削除しました'); loadSchedules(); logAction('スケジュール削除'); }
  else showToast('削除に失敗しました', 'error');
}

// ---- Members ----
async function loadMembers() {
  showSpinner();
  const res = await api('getMembers');
  hideSpinner();
  if (!res.success) return showToast('取得に失敗しました', 'error');
  state.members = res.data;
  populateMemberSelects();
  renderMembers();
}

function renderMembers() {
  const grid = document.getElementById('members-grid');
  grid.innerHTML = state.members.map(m => `
    <div class="member-card">
      <div class="member-avatar">${escapeHtml(m.name[0])}</div>
      <div class="member-name">${escapeHtml(m.name)}</div>
      <div class="member-role">${escapeHtml(m.role)}</div>
      ${m.email ? `<div class="member-email">${escapeHtml(m.email)}</div>` : ''}
      <div style="margin-top:12px">
        <button class="btn btn-sm btn-danger" onclick="deleteMember('${m.id}')">削除</button>
      </div>
    </div>`).join('');
}

async function submitMember(e) {
  e.preventDefault();
  const body = {
    name:  document.getElementById('member-name').value,
    role:  document.getElementById('member-role').value,
    email: document.getElementById('member-email').value,
  };
  showSpinner();
  const res = await api('addMember', body);
  hideSpinner();
  if (res.success) {
    showToast('メンバーを追加しました', 'success');
    closeModal('modal-member');
    loadMembers();
  } else showToast('追加に失敗しました', 'error');
}

async function deleteMember(id) {
  if (!confirm('このメンバーを削除しますか？')) return;
  showSpinner();
  const res = await api('deleteMember', { id });
  hideSpinner();
  if (res.success) { showToast('削除しました'); loadMembers(); }
  else showToast('削除に失敗しました', 'error');
}

// ---- Boot ----
document.addEventListener('DOMContentLoaded', async () => {
  // Set default schedule filter dates
  const today = new Date().toISOString().slice(0,10);
  const firstOfMonth = today.slice(0,7) + '-01';
  const dfEl = document.getElementById('schedule-date-from');
  const dtEl = document.getElementById('schedule-date-to');
  if (dfEl) dfEl.value = firstOfMonth;
  if (dtEl) dtEl.value = today;

  // Year options for goals
  const y = new Date().getFullYear();
  const yearSel = document.getElementById('goal-filter-year');
  const goalYear = document.getElementById('goal-year');
  [y-1, y, y+1].forEach(yr => {
    [yearSel, goalYear].forEach(el => {
      if (el) { const o = document.createElement('option'); o.value = yr; o.textContent = yr + '年'; if (yr === y) o.selected = true; el.appendChild(o); }
    });
  });

  // Auto-login if session exists
  if (sessionStorage.getItem('auth') && sessionStorage.getItem('memberId')) {
    const res = await api('getMembers');
    if (res.success) {
      state.members = res.data;
      const member = state.members.find(m => m.id === sessionStorage.getItem('memberId'));
      if (member) {
        state.currentMember = member;
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('app').style.display = 'flex';
        document.getElementById('user-name').textContent = member.name;
        document.getElementById('user-avatar').textContent = member.name[0];
        populateMemberSelects();
        navigate('dashboard');
        return;
      }
    }
    sessionStorage.clear();
  }
});
