const lessonCount = 12;
const legacyLessonCount = 14;
const completionPercent = 90;
const saveInterval = 2500;
const storeName = 'progress';
const statusLabels = {
  pending: '영상 준비 중',
  unavailable: '상태 확인 필요',
  unwatched: '미시청',
  watching: '시청 중',
  completed: '시청 완료'
};
const dateFormat = new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short' });

const player = document.getElementById('classroom-player');
const video = document.getElementById('lesson-video');
const playerTitle = document.getElementById('current-lesson-title');
const playerStatus = document.getElementById('current-lesson-status');
const playerMessage = document.getElementById('player-message');
const messageTitle = document.getElementById('player-message-title');
const messageDetail = document.getElementById('player-message-detail');
const resumeNote = document.getElementById('resume-note');
const completedCount = document.getElementById('completed-count');
const completedMeter = document.getElementById('completed-meter');
const lessonList = document.getElementById('lesson-list');
const recordList = document.getElementById('lesson-records');
const lessonTemplate = document.getElementById('lesson-item-template');
const recordTemplate = document.getElementById('record-item-template');
const exportForm = document.getElementById('progress-export');
const studentNumber = document.getElementById('progress-student-id');
const exportButton = document.getElementById('progress-export-button');
const exportStatus = document.getElementById('progress-export-status');

const progressRecords = new Map();
let database;
let lessons = [];
let activeLesson;
let lastSaved;

async function loadCatalog() {
  const response = await fetch('./lessons.json', { cache: 'no-cache' });
  if (!response.ok) throw new Error('Failed to load lesson catalog');
  const entries = await response.json();
  if (!Array.isArray(entries) || ![lessonCount, legacyLessonCount].includes(entries.length)) {
    throw new Error('Invalid lesson catalog');
  }
  const catalog = new Map(entries.map(entry => [entry.id, entry]));
  for (let id = 1; id <= entries.length; id += 1) {
    if (!catalog.has(id)) throw new Error('Missing lesson in catalog');
  }
  return catalog;
}

function mediaSource(path) {
  if (!path) return null;
  try {
    const url = new URL(path, location.href);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return null;
    if (url.protocol !== 'https:' && url.origin !== location.origin) return null;
    url.hash = '';
    return url.href;
  } catch {
    return null;
  }
}

function mergeRanges(ranges, duration) {
  const ordered = ranges
    .map(([start, end]) => [Math.max(0, start), Math.min(duration, end)])
    .filter(([start, end]) => Number.isFinite(start) && Number.isFinite(end) && start < end)
    .sort(([start], [nextStart]) => start - nextStart);
  const merged = [];
  for (const range of ordered) {
    const last = merged.at(-1);
    if (last && range[0] <= last[1]) last[1] = Math.max(last[1], range[1]);
    else merged.push(range);
  }
  return merged;
}

function mergeProgress(previous, incoming) {
  if (!previous) return incoming;
  const latest = previous.updatedAt > incoming.updatedAt ? previous : incoming;
  if (Math.abs(previous.duration - incoming.duration) > 0.5) return latest;
  return { ...latest, ranges: mergeRanges([...previous.ranges, ...incoming.ranges], latest.duration) };
}

function playedSeconds(ranges) {
  return ranges.reduce((total, [start, end]) => total + end - start, 0);
}

function watchPercent(record) {
  return record ? Math.min(100, Math.floor(100 * playedSeconds(record.ranges) / record.duration)) : 0;
}

function lessonState(lesson, record, percent) {
  if (!lesson.source) return lesson.unavailable ? 'unavailable' : 'pending';
  if (percent >= completionPercent) return 'completed';
  return record ? 'watching' : 'unwatched';
}

function setStatus(element, state) {
  element.dataset.state = state;
  element.textContent = statusLabels[state];
}

function displayProgress() {
  let completed = 0;
  for (const lesson of lessons) {
    const record = progressRecords.get(lesson.key);
    const percent = watchPercent(record);
    const state = lessonState(lesson, record, percent);
    if (state === 'completed') completed += 1;
    setStatus(lesson.listStatus, state);
    setStatus(lesson.recordStatus, state);
    if (lesson === activeLesson) setStatus(playerStatus, state);
    lesson.meter.hidden = !lesson.source;
    lesson.meter.value = percent;
    lesson.percent.textContent = lesson.source ? `${percent}%` : '—';
    lesson.lastWatched.hidden = !record;
    if (record) {
      const date = new Date(record.updatedAt);
      lesson.lastWatched.dateTime = date.toISOString();
      lesson.lastWatched.textContent = dateFormat.format(date);
    }
  }
  completedCount.textContent = String(completed);
  completedMeter.value = completed;
}

function storageUnavailable() {
  database?.close();
  database = undefined;
  const notice = document.getElementById('storage-notice');
  notice.textContent = '이 브라우저에서 내 시청 기록을 저장할 수 없습니다. 이 화면을 열어 둔 동안의 시청 기록은 확인할 수 있습니다.';
  notice.hidden = false;
}

function refreshProgress() {
  return new Promise((resolve, reject) => {
    const request = database.transaction(storeName).objectStore(storeName).getAll();
    request.onsuccess = () => {
      for (const record of request.result) {
        progressRecords.set(record.key, mergeProgress(progressRecords.get(record.key), record));
      }
      displayProgress();
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

async function openProgressStorage() {
  try {
    database = await new Promise((resolve, reject) => {
      const request = indexedDB.open('kcli-iso-19011-classroom', 1);
      request.onupgradeneeded = () => request.result.createObjectStore(storeName, { keyPath: 'key' });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error('Progress storage is blocked'));
    });
    database.onversionchange = storageUnavailable;
    await refreshProgress();
  } catch {
    storageUnavailable();
  }
}

function recordPlayback(snapshot) {
  const updated = mergeProgress(progressRecords.get(snapshot.key), snapshot);
  progressRecords.set(snapshot.key, updated);
  displayProgress();
  if (!database) return;

  try {
    const transaction = database.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const existing = store.get(updated.key);
    let saved;
    // Merge inside the write transaction so another tab's watched ranges are retained.
    existing.onsuccess = () => {
      saved = mergeProgress(existing.result, updated);
      store.put(saved);
    };
    transaction.oncomplete = () => {
      progressRecords.set(saved.key, mergeProgress(progressRecords.get(saved.key), saved));
      displayProgress();
    };
    transaction.onabort = storageUnavailable;
  } catch {
    storageUnavailable();
  }
}

function savePlayback(force = false) {
  const lesson = activeLesson;
  const { duration, currentTime, played } = video;
  if (!lesson?.source || video.currentSrc !== lesson.source || !Number.isFinite(duration) || duration <= 0 || !played.length) return;

  const now = Date.now();
  if (!force && lastSaved && now - lastSaved.updatedAt < saveInterval) return;
  const ranges = mergeRanges(Array.from({ length: played.length }, (_, index) => [played.start(index), played.end(index)]), duration);
  const seconds = playedSeconds(ranges);
  if (seconds <= 0 || (lastSaved?.position === currentTime && lastSaved?.seconds === seconds)) return;
  lastSaved = { position: currentTime, seconds, updatedAt: now };
  recordPlayback({ key: lesson.key, duration, position: currentTime, ranges, updatedAt: now });
}

function showPlayerMessage(title, detail) {
  messageTitle.textContent = title;
  messageDetail.textContent = detail;
  video.hidden = true;
  playerMessage.hidden = false;
  resumeNote.hidden = true;
}

function selectLesson(lesson, moveFocus = false) {
  if (lesson !== activeLesson || video.error) {
    savePlayback(true);
    activeLesson?.button.removeAttribute('aria-current');
    activeLesson = lesson;
    lastSaved = undefined;
    lesson.button.setAttribute('aria-current', 'true');
    playerTitle.textContent = lesson.name;
    resumeNote.hidden = true;
    if (lesson.source) {
      video.src = lesson.source;
      video.load();
      video.hidden = false;
      playerMessage.hidden = true;
    } else {
      if (video.hasAttribute('src')) {
        video.removeAttribute('src');
        video.load();
      }
      showPlayerMessage(
        lesson.unavailable ? `${lesson.id}교시 영상 확인 필요` : `${lesson.id}교시 영상 준비 중`,
        lesson.unavailable ? '잠시 후 다시 접속해 주세요.' : '영상이 등록되면 재생할 수 있습니다.'
      );
    }
    displayProgress();
  }
  if (moveFocus) {
    playerTitle.focus({ preventScroll: true });
    player.scrollIntoView({ block: 'start' });
  }
}

function addLessonControls(lesson) {
  const item = lessonTemplate.content.cloneNode(true);
  lesson.button = item.querySelector('button');
  lesson.listStatus = item.querySelector('.classroom-status');
  item.querySelector('.classroom-lesson-name').textContent = lesson.name;
  lesson.button.addEventListener('click', () => selectLesson(lesson, true));
  lessonList.append(item);

  const row = recordTemplate.content.cloneNode(true);
  const recordLink = row.querySelector('button');
  recordLink.textContent = `${lesson.id}교시`;
  recordLink.addEventListener('click', () => selectLesson(lesson, true));
  lesson.meter = row.querySelector('progress');
  lesson.meter.setAttribute('aria-label', `${lesson.id}교시 재생 비율`);
  lesson.percent = row.querySelector('.classroom-record-progress span');
  lesson.recordStatus = row.querySelector('.classroom-status');
  lesson.lastWatched = row.querySelector('time');
  recordList.append(row);
}

video.addEventListener('loadedmetadata', () => {
  if (video.currentSrc !== activeLesson?.source) return;
  const record = progressRecords.get(activeLesson.key);
  if (!record || Math.abs(record.duration - video.duration) > 0.5 || record.position <= 0 || record.position >= video.duration - 0.5) return;
  video.currentTime = record.position;
  const seconds = Math.floor(record.position);
  resumeNote.textContent = `지난 시청 위치 ${Math.floor(seconds / 60)}분 ${seconds % 60}초에서 이어 볼 수 있습니다.`;
  resumeNote.hidden = false;
});
video.addEventListener('play', () => { resumeNote.hidden = true; });
video.addEventListener('timeupdate', () => savePlayback());
video.addEventListener('pause', () => savePlayback(true));
video.addEventListener('ended', () => savePlayback(true));
video.addEventListener('error', () => {
  if (activeLesson?.source && video.currentSrc === activeLesson.source) {
    showPlayerMessage('영상을 재생할 수 없습니다', '잠시 후 강의 목록에서 이 교시를 다시 선택해 주세요.');
  }
});
window.addEventListener('pagehide', () => savePlayback(true));
document.addEventListener('visibilitychange', () => {
  if (document.hidden) savePlayback(true);
  else if (database) refreshProgress().catch(storageUnavailable);
});

async function videoFingerprint(source) {
  if (!source) return null;
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(source));
  return Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('');
}

exportForm.addEventListener('submit', async event => {
  event.preventDefault();
  const studentId = studentNumber.value.trim().normalize('NFC');
  if (!studentId || /[\u0000-\u001f\u007f]/u.test(studentId)) {
    exportStatus.textContent = 'KCLI에서 받은 수강생 번호를 입력하세요.';
    exportStatus.hidden = false;
    return;
  }
  exportButton.disabled = true;
  try {
    savePlayback(true);
    if (database) await refreshProgress().catch(storageUnavailable);
    const records = await Promise.all(lessons.map(async lesson => {
      const record = progressRecords.get(lesson.key);
      return {
        id: lesson.id,
        title: lesson.name,
        videoId: await videoFingerprint(lesson.source),
        duration: record?.duration ?? null,
        ranges: record?.ranges ?? [],
        watchedAt: record?.updatedAt ?? null
      };
    }));
    const report = { format: 'kcli.iso19011.progress', version: 1, studentId, exportedAt: Date.now(), lessons: records };
    const file = new Blob([JSON.stringify(report)], { type: 'application/json' });
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    const filenameId = studentId.replace(/[^\p{L}\p{N}._-]/gu, '_');
    link.href = url;
    link.download = `KCLI_ISO19011_${filenameId}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    exportStatus.textContent = '참고용 시청 기록 파일을 저장했습니다. 공식 기록이 아니며, 담당자가 요청한 비공개 경로로만 제출하세요.';
  } catch {
    exportStatus.textContent = '시청 기록 파일을 저장하지 못했습니다. 다시 시도해 주세요.';
  } finally {
    exportStatus.hidden = false;
    exportButton.disabled = false;
  }
});

async function startClassroom() {
  const [catalog] = await Promise.all([loadCatalog().catch(() => null), openProgressStorage()]);
  if (!catalog) {
    const error = document.getElementById('classroom-error');
    error.textContent = '강의 목록을 불러오지 못했습니다. 페이지를 새로고침해 주세요.';
    error.hidden = false;
  }
  lessons = Array.from({ length: lessonCount }, (_, index) => {
    const id = index + 1;
    const entry = catalog?.get(id);
    const title = typeof entry?.title === 'string' ? entry.title.trim() : '';
    const path = typeof entry?.videoUrl === 'string' ? entry.videoUrl.trim() : '';
    const source = mediaSource(path);
    const name = title ? `${id}교시 · ${title}` : `${id}교시`;
    return { id, name, source, key: source ? `${id}:${source}` : null, unavailable: !catalog || Boolean(path && !source) };
  });
  lessons.forEach(addLessonControls);
  const available = lessons.filter(lesson => lesson.source);
  document.getElementById('available-count').textContent = catalog
    ? `${available.length} / ${lessonCount}교시 공개`
    : '공개 상태 확인 필요';

  const lastWatched = available.reduce((latest, lesson) => {
    const record = progressRecords.get(lesson.key);
    if (!record) return latest;
    return !latest || record.updatedAt > progressRecords.get(latest.key).updatedAt ? lesson : latest;
  }, null);
  selectLesson(lastWatched ?? available[0] ?? lessons[0]);
  exportButton.disabled = !catalog;
}

startClassroom();
