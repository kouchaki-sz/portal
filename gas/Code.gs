// ============================================================
// 情報共有ポータル - Google Apps Script バックエンド
// 1. このファイルをApps Scriptエディタに貼り付ける
// 2. SPREADSHEET_ID を自分のスプレッドシートIDに変更する
// 3. 「ウェブアプリとしてデプロイ」→ 実行者:自分、アクセス:全員
// ============================================================

const SPREADSHEET_ID = '1l1A_K1-1srbUhA5dtwCwZjmnNHd3uDNvnwfGWleyztw';

function getSheet(name) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    initSheet(sheet, name);
  }
  return sheet;
}

function initSheet(sheet, name) {
  const headers = {
    Settings:   [['key', 'value'], ['access_code', 'portal2024']],
    Members:    [['id', 'name', 'role', 'email', 'joinDate']],
    Notices:    [['id', 'title', 'content', 'author', 'date', 'priority']],
    Events:     [['id', 'title', 'startDate', 'endDate', 'startTime', 'endTime', 'description', 'category', 'author']],
    Goals:      [['id', 'memberId', 'memberName', 'type', 'year', 'month', 'content', 'status', 'createdAt']],
    Schedules:  [['id', 'memberId', 'memberName', 'date', 'plan', 'actual', 'status', 'note']]
  };
  if (headers[name]) {
    sheet.getRange(1, 1, headers[name].length, headers[name][0].length)
         .setValues(headers[name]);
  }
}

// ---- CORS helper ----
function createResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  const action = e.parameter.action;
  try {
    const result = dispatch(action, e.parameter, null);
    return createResponse(result);
  } catch (err) {
    return createResponse({ success: false, error: err.message });
  }
}

function doPost(e) {
  let body = {};
  try { body = JSON.parse(e.postData.contents); } catch(_) {}
  try {
    const result = dispatch(body.action, null, body);
    return createResponse(result);
  } catch (err) {
    return createResponse({ success: false, error: err.message });
  }
}

function dispatch(action, params, body) {
  const p = params || body || {};
  switch (action) {
    // Auth
    case 'verify':        return verifyCode(p.code);
    // Notices
    case 'getNotices':    return getNotices();
    case 'addNotice':     return addNotice(body);
    case 'deleteNotice':  return deleteRow('Notices', body.id);
    // Events
    case 'getEvents':     return getEvents();
    case 'addEvent':      return addEvent(body);
    case 'deleteEvent':   return deleteRow('Events', body.id);
    case 'updateEvent':   return updateEvent(body);
    // Goals
    case 'getGoals':      return getGoals(p);
    case 'addGoal':       return addGoal(body);
    case 'updateGoal':    return updateGoal(body);
    case 'deleteGoal':    return deleteRow('Goals', body.id);
    // Members
    case 'getMembers':    return getMembers();
    case 'addMember':     return addMember(body);
    case 'deleteMember':  return deleteRow('Members', body.id);
    // Schedules
    case 'getSchedules':  return getSchedules(p);
    case 'addSchedule':   return addSchedule(body);
    case 'updateSchedule':return updateSchedule(body);
    case 'deleteSchedule':return deleteRow('Schedules', body.id);
    default:              return { success: false, error: 'Unknown action: ' + action };
  }
}

// ---- Auth ----
function verifyCode(code) {
  const sheet = getSheet('Settings');
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === 'access_code') {
      return { success: data[i][1] === code };
    }
  }
  return { success: false };
}

// ---- Utility ----
function generateId() {
  return Utilities.getUuid().split('-')[0];
}

function sheetToObjects(sheetName) {
  const sheet = getSheet(sheetName);
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => {
      const v = row[i];
      obj[h] = (v instanceof Date)
        ? Utilities.formatDate(v, 'Asia/Tokyo', 'yyyy-MM-dd')
        : v;
    });
    return obj;
  });
}

function deleteRow(sheetName, id) {
  const sheet = getSheet(sheetName);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { success: false, error: 'Not found' };
}

// ---- Notices ----
function getNotices() {
  const items = sheetToObjects('Notices');
  items.sort((a, b) => new Date(b.date) - new Date(a.date));
  return { success: true, data: items };
}

function addNotice(body) {
  const sheet = getSheet('Notices');
  const now = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd HH:mm');
  sheet.appendRow([generateId(), body.title, body.content, body.author, now, body.priority || 'normal']);
  return { success: true };
}

// ---- Events ----
function getEvents() {
  const items = sheetToObjects('Events');
  items.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
  return { success: true, data: items };
}

function addEvent(body) {
  const sheet = getSheet('Events');
  sheet.appendRow([generateId(), body.title, body.startDate, body.endDate || body.startDate, body.startTime || '', body.endTime || '', body.description || '', body.category || 'その他', body.author || '']);
  return { success: true };
}

function updateEvent(body) {
  const sheet = getSheet('Events');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(body.id)) {
      ['title','startDate','endDate','startTime','endTime','description','category'].forEach(field => {
        if (body[field] !== undefined) {
          const idx = headers.indexOf(field);
          if (idx >= 0) sheet.getRange(i + 1, idx + 1).setValue(body[field]);
        }
      });
      return { success: true };
    }
  }
  return { success: false, error: 'Not found' };
}

// ---- Goals ----
function getGoals(params) {
  let items = sheetToObjects('Goals');
  if (params.memberId) items = items.filter(g => String(g.memberId) === String(params.memberId));
  if (params.type)     items = items.filter(g => g.type === params.type);
  if (params.year)     items = items.filter(g => String(g.year) === String(params.year));
  if (params.month)    items = items.filter(g => String(g.month) === String(params.month));
  return { success: true, data: items };
}

function addGoal(body) {
  const sheet = getSheet('Goals');
  const now = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd');
  sheet.appendRow([generateId(), body.memberId, body.memberName, body.type, body.year, body.month || '', body.content, 'active', now]);
  return { success: true };
}

function updateGoal(body) {
  const sheet = getSheet('Goals');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const statusIdx = headers.indexOf('status');
  const contentIdx = headers.indexOf('content');
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(body.id)) {
      if (body.status !== undefined)  sheet.getRange(i + 1, statusIdx + 1).setValue(body.status);
      if (body.content !== undefined) sheet.getRange(i + 1, contentIdx + 1).setValue(body.content);
      return { success: true };
    }
  }
  return { success: false, error: 'Not found' };
}

// ---- Members ----
function getMembers() {
  const items = sheetToObjects('Members');
  return { success: true, data: items };
}

function addMember(body) {
  const sheet = getSheet('Members');
  const today = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd');
  sheet.appendRow([generateId(), body.name, body.role || 'メンバー', body.email || '', today]);
  return { success: true };
}

// ---- Schedules ----
function getSchedules(params) {
  let items = sheetToObjects('Schedules');
  if (params.memberId)  items = items.filter(s => String(s.memberId) === String(params.memberId));
  if (params.dateFrom)  items = items.filter(s => s.date >= params.dateFrom);
  if (params.dateTo)    items = items.filter(s => s.date <= params.dateTo);
  items.sort((a, b) => a.date < b.date ? -1 : 1);
  return { success: true, data: items };
}

function addSchedule(body) {
  const sheet = getSheet('Schedules');
  sheet.appendRow([generateId(), body.memberId, body.memberName, body.date, body.plan || '', body.actual || '', body.status || 'planned', body.note || '']);
  return { success: true };
}

function updateSchedule(body) {
  const sheet = getSheet('Schedules');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(body.id)) {
      ['plan', 'actual', 'status', 'note'].forEach(field => {
        if (body[field] !== undefined) {
          const idx = headers.indexOf(field);
          if (idx >= 0) sheet.getRange(i + 1, idx + 1).setValue(body[field]);
        }
      });
      return { success: true };
    }
  }
  return { success: false, error: 'Not found' };
}
