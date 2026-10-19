const DEFAULTS = { salary: 29500, age: 20, meal: 40 };

function monthsOfSalary(amount, salary) { return amount / salary; }
function perPerson(amount, population) { return amount / population; }
function bowlsOfRice(amount, price) { return amount / price; }
function ageAtYear(age, targetYear, baseYear = new Date().getFullYear()) { return age + (targetYear - baseYear); }

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
}
function safeUrl(url) {
  return /^https?:\/\//i.test(url || '') ? url : '';
}

function formatNumber(value, maximumFractionDigits = 0) {
  return new Intl.NumberFormat('zh-TW', { maximumFractionDigits, minimumFractionDigits: 0 }).format(value);
}
function formatMoney(value) {
  if (value >= 100000000) return `${(value / 100000000).toLocaleString('zh-TW', { maximumFractionDigits: 2 })} 億元`;
  if (value >= 10000) return `${(value / 10000).toLocaleString('zh-TW', { maximumFractionDigits: 2 })} 萬元`;
  return `${formatNumber(value)} 元`;
}
function formatMonths(value) {
  if (value < 0.1) return `${value.toFixed(2)} 個月`;
  if (value < 10) return `${value.toFixed(1)} 個月`;
  return `${formatNumber(value, 0)} 個月`;
}
function validNewsItem(item) {
  return item && safeUrl(item.source) && item.checkedAt;
}
function statusClass(status) {
  const text = String(status || '');
  if (text.includes('草案')) return 'draft';
  if (text.includes('預報')) return 'forecast';
  if (text.includes('通過') || text.includes('核定') || text.includes('公布')) return 'approved';
  return 'draft';
}
function getSettings() {
  const read = (id) => { const raw = document.getElementById(id).value; return raw === '' ? NaN : Number(raw); };
  const salary = read('salary'), age = read('age'), meal = read('meal');
  return {
    salary: salary > 0 ? salary : DEFAULTS.salary,
    age: age >= 0 ? age : DEFAULTS.age,
    meal: meal > 0 ? meal : DEFAULTS.meal
  };
}
function hasAmount(item) {
  return typeof item.amount === 'number' && Number.isFinite(item.amount) && item.amount > 0;
}
function renderCard(item, settings, population) {
  // 沒有金額的新聞（例如颱風預報）只放標題、說明和來源，不做換算
  const convertible = hasAmount(item);
  const showPerPerson = convertible && item.perCapita && population > 0;
  const lines = [];
  if (convertible) {
    lines.push(['換成月薪', formatMonths(monthsOfSalary(item.amount, settings.salary))]);
    if (showPerPerson) lines.push(['攤到每人＊', `約 ${formatMoney(perPerson(item.amount, population))}`]);
    lines.push(['換成滷肉飯', `${formatNumber(bowlsOfRice(item.amount, settings.meal), 0)} 碗`]);
  }
  if (item.targetYear) lines.push(['到那一年，你', `${ageAtYear(settings.age, item.targetYear)} 歲`]);
  const source = safeUrl(item.source);
  const sourceLabel = source ? '查看原始來源 ↗' : '來源待補';
  const checked = item.checkedAt ? `核對於 ${item.checkedAt}` : '尚未核對';
  const perPersonNote = '＊每人金額是比喻尺度，不是每個人實際要付的錢。';
  const copyText = [
    item.title,
    convertible ? formatMoney(item.amount) : item.note,
    ...lines.map(([label, value]) => `→ ${label}：${value}`),
    showPerPerson ? perPersonNote : '',
    source
  ].filter(Boolean).join('\n');
  return `<article class="news-card${convertible ? '' : ' info-card'}">
    <div class="card-top"><span class="card-index">NO. ${escapeHtml(String(item.id || '').toUpperCase())}</span><span class="status ${statusClass(item.status)}">${escapeHtml(item.status || '草稿')}</span></div>
    <h3 class="card-title">${escapeHtml(item.title)}</h3>
    ${convertible ? `<div class="raw-number">${formatMoney(item.amount)} <small>原始數字</small></div>` : ''}
    ${item.note ? `<p class="card-note">${escapeHtml(item.note)}</p>` : ''}
    ${lines.length ? `<div class="translations">${lines.map(([label, value]) => `<div class="translation"><span>→ ${label}</span><strong>${value}</strong></div>`).join('')}</div>` : ''}
    ${showPerPerson ? `<p class="card-footnote">${perPersonNote}</p>` : ''}
    <div class="card-foot"><span>${escapeHtml(checked)}</span><span>${source ? `<a href="${escapeHtml(source)}" target="_blank" rel="noreferrer">${sourceLabel}</a>` : sourceLabel} · <button class="copy-btn" data-copy="${encodeURIComponent(copyText)}">複製這張卡</button></span></div>
  </article>`;
}
function renderEmptyState() {
  return `<div class="empty-state"><div class="empty-icon">— / —</div><h3>已核對的新聞正在排隊</h3><p>目前資料檔還沒有同時填好「原始來源」與「核對日期」的項目。先用上方參數設定你的尺度，資料一到就會自動翻譯。</p></div>`;
}
function showNotice(message) {
  const notice = document.getElementById('data-notice');
  notice.textContent = message;
  notice.hidden = false;
}
function render(items, population) {
  const settings = getSettings();
  const cards = document.getElementById('cards');
  const count = document.getElementById('item-count');
  const verified = items.filter(validNewsItem);
  count.textContent = `${verified.length} 則已核對`;
  const latest = verified.map((item) => String(item.checkedAt)).sort().pop();
  document.getElementById('last-checked').textContent = latest ? `資料最後核對：${latest}` : '資料尚未核對';
  cards.innerHTML = verified.length ? verified.map((item) => renderCard(item, settings, population)).join('') : renderEmptyState();
  cards.querySelectorAll('[data-copy]').forEach((button) => button.addEventListener('click', async () => {
    const text = decodeURIComponent(button.dataset.copy);
    try { await navigator.clipboard.writeText(text); showToast('這張卡的文字已複製'); }
    catch { showToast('瀏覽器不允許複製，請手動選取'); }
  }));
}
function showToast(message) { const toast = document.getElementById('toast'); toast.textContent = message; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 1800); }

async function init() {
  let data;
  try {
    const response = await fetch('data/news.json');
    if (!response.ok) throw new Error('資料讀取失敗');
    data = await response.json();
    if (!data.population || !safeUrl(data.populationSource)) showNotice('提醒：目前資料仍在建置中。只有完成來源與日期核對的新聞，才會出現在翻譯卡片裡。');
  } catch (error) {
    showNotice('資料檔暫時讀不到，請用本機伺服器開啟此頁面（例如 python3 -m http.server 8000）。');
    data = { items: [], population: null };
  }
  // 人口數要有內政部來源才拿來算「攤到每人」
  const population = data.population > 0 && safeUrl(data.populationSource) ? data.population : null;
  renderPopulation(population, data.populationSource, data.populationAsOf);
  document.getElementById('settings-form').addEventListener('input', () => render(data.items || [], population));
  render(data.items || [], population);
}
function renderPopulation(population, source, asOf) {
  const el = document.getElementById('population-info');
  if (!population) { el.textContent = '台灣人口數與內政部來源待補，補上前不顯示「攤到每人」。'; return; }
  const when = asOf ? `（${escapeHtml(asOf)}）` : '';
  el.innerHTML = `計算用的台灣人口：${formatNumber(population)} 人${when}，<a href="${escapeHtml(safeUrl(source))}" target="_blank" rel="noreferrer">內政部來源 ↗</a>`;
}

if (typeof window !== 'undefined' && document.getElementById('cards')) init();
if (typeof window !== 'undefined') Object.assign(window, { monthsOfSalary, perPerson, bowlsOfRice, ageAtYear });
