const fmt = (value) => `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
const klass = (value) => value >= 0 ? 'up' : 'down';
let market;

async function loadData() {
  const response = await fetch(`data/market_data.json?ts=${Date.now()}`, { cache: 'no-store' });
  if (!response.ok) throw new Error('找不到市場資料；請先執行更新程式。');
  market = await response.json();
  document.querySelector('#as-of').textContent = `資料截至 ${market.as_of} 收盤 · 更新於 ${new Date(market.generated_at).toLocaleString('zh-TW')}`;
  renderSummary(); renderRanking(); renderBenchmarks(); selectSector(market.groups.sort((a,b) => b.week_return-a.week_return)[0].name);
}
function renderSummary() { const sorted=[...market.groups].sort((a,b)=>b.week_return-a.week_return); document.querySelector('#strongest').textContent=`${sorted[0].name} ${fmt(sorted[0].week_return)}`; document.querySelector('#weakest').textContent=`${sorted.at(-1).name} ${fmt(sorted.at(-1).week_return)}`; document.querySelector('#coverage').textContent=`${market.groups.length} 個板塊／${market.groups.reduce((n,g)=>n+g.stocks.length,0)} 檔`; }
function renderRanking() { const max=Math.max(...market.groups.map(g=>Math.abs(g.week_return)),1); document.querySelector('#ranking').innerHTML=[...market.groups].sort((a,b)=>b.week_return-a.week_return).map(g=>`<button class="rank-row" data-sector="${g.name}" aria-pressed="false"><span>${g.name}</span><span class="bar-track"><span class="bar ${g.week_return>=0?'positive':'negative'}" style="width:${Math.abs(g.week_return)/max*100}%"></span></span><strong class="return ${klass(g.week_return)}">${fmt(g.week_return)}</strong></button>`).join(''); document.querySelectorAll('[data-sector]').forEach(b=>b.addEventListener('click',()=>selectSector(b.dataset.sector))); }
function selectSector(name) { const group=market.groups.find(g=>g.name===name); document.querySelectorAll('[data-sector]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.sector===name))); document.querySelector('#selected-title').textContent=group.name; const value=document.querySelector('#selected-return'); value.textContent=fmt(group.week_return); value.className=klass(group.week_return); document.querySelector('#selected-day').textContent=`今日 ${fmt(group.day_return)}`; document.querySelector('#holdings').innerHTML=group.stocks.map(s=>`<div class="holding"><div><strong>${s.name}（${s.code}）</strong><small>收盤 ${s.close}</small></div><div class="${klass(s.week_return)}">本週 ${fmt(s.week_return)}<br><small>今日 ${fmt(s.day_return)}</small></div></div>`).join(''); const trend=group.stocks[0].trend; const max=Math.max(...trend.map(p=>Math.abs(p.return)),1); document.querySelector('#trend').innerHTML=trend.map(p=>`<div class="trend-column"><span class="${klass(p.return)}">${fmt(p.return)}</span><div class="trend-bar ${p.return>=0?'positive':'negative'}" style="height:${Math.max(8,Math.abs(p.return)/max*165)}px"></div><span>${p.date}</span></div>`).join(''); }
function renderBenchmarks() { document.querySelector('#benchmarks').innerHTML=market.benchmarks.map(s=>`<article><strong>${s.name}（${s.code}）</strong><p class="${klass(s.week_return)}">本週 ${fmt(s.week_return)}</p><small>今日 ${fmt(s.day_return)} · 收盤 ${s.close}</small></article>`).join(''); }
document.querySelector('#reload').addEventListener('click',()=>loadData().catch(showError));
function showError(error) { document.querySelector('#as-of').textContent=error.message; }
loadData().catch(showError);
// app.js (完整版)
const fmt = (value) => `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
const klass = (value) => value >= 0 ? 'up' : 'down';
let market;

async function loadData() {
  try {
    const response = await fetch(`data/market_data.json?ts=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error('找不到市場資料；請先執行更新程式。');
    market = await response.json();
    document.querySelector('#as-of').textContent = `資料截至 ${market.as_of} 收盤 · 更新於 ${new Date(market.generated_at).toLocaleString('zh-TW')}`;
    renderSummary(); 
    renderRanking(); 
    renderBenchmarks(); 
    selectSector(market.groups.sort((a,b) => b.week_return - a.week_return)[0].name);
  } catch (err) {
    document.querySelector('#as-of').textContent = err.message;
  }
}

function renderSummary() { 
  const sorted = [...market.groups].sort((a,b) => b.week_return - a.week_return); 
  document.querySelector('#strongest').textContent = `${sorted[0].name} ${fmt(sorted[0].week_return)}`; 
  document.querySelector('#weakest').textContent = `${sorted.at(-1).name} ${fmt(sorted.at(-1).week_return)}`; 
  document.querySelector('#coverage').textContent = `${market.groups.length} 個板塊／${market.groups.reduce((n,g)=>n+g.stocks.length,0)} 檔`; 
}

function renderRanking() { 
  const max = Math.max(...market.groups.map(g => Math.abs(g.week_return)), 1); 
  document.querySelector('#ranking').innerHTML = market.groups
    .sort((a,b) => b.week_return - a.week_return)
    .map(g => `
      <div class="rank-row" onclick="selectSector('${g.name}')" style="cursor:pointer;">
        <span>${g.name}</span>
        <div class="bar-track">
          <div class="bar ${klass(g.week_return)}" style="width:${Math.abs(g.week_return)/max * 100}%"></div>
        </div>
        <span class="return ${klass(g.week_return)}">${fmt(g.week_return)}</span>
      </div>
    `).join('');
}

function renderBenchmarks() {
  // 若有 Benchmark 面板可於此渲染，此處保留與原始 app.js 的相容
}

function selectSector(name) {
  const group = market.groups.find(g => g.name === name);
  if (!group) return;
  document.querySelector('#selected-title').textContent = group.name; 
  const value = document.querySelector('#selected-return'); 
  value.textContent = fmt(group.week_return); 
  value.className = klass(group.week_return); 
  document.querySelector('#selected-day').textContent = `今日 ${fmt(group.day_return)}`; 
  
  document.querySelector('#holdings').innerHTML = group.stocks.map(s => `
    <div class="holding">
      <div><strong>${s.name}（${s.code}）</strong><small>收盤 ${s.close}</small></div>
      <div class="${klass(s.week_return)}">本週 ${fmt(s.week_return)}<br><small>今日 ${fmt(s.day_return)}</small></div>
    </div>
  `).join(''); 
  
  const trend = group.stocks[0].trend; 
  const maxTrend = Math.max(...trend.map(p => Math.abs(p.return)), 1); 
  document.querySelector('#trend').innerHTML = trend.map(p => `
    <div class="trend-column">
      <span class="${klass(p.return)}">${fmt(p.return)}</span>
      <div class="trend-bar ${p.return >= 0 ? 'positive' : 'negative'}" style="height:${Math.max(8, Math.abs(p.return)/maxTrend * 165)}px"></div>
      <span>${p.date}</span>
    </div>
  `).join(''); 
}

// 綁定按鈕監聽器
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  
  document.querySelector('#reload').addEventListener('click', loadData);
  
  // 切換管理面板顯示
  const toggleBtn = document.querySelector('#toggle-panel');
  const mgmtPanel = document.querySelector('#management-panel');
  toggleBtn.addEventListener('click', () => {
    mgmtPanel.style.display = mgmtPanel.style.display === 'none' ? 'block' : 'none';
  });

  // 處理新增股票表單提交
  const form = document.querySelector('#add-stock-form');
  const msg = document.querySelector('#msg');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.style.color = 'var(--blue)';
    msg.textContent = '正在寫入名單並重新抓取市場數據...';

    const group = document.querySelector('#input-group').value.trim();
    const code = document.querySelector('#input-code').value.trim();
    const name = document.querySelector('#input-name').value.trim();

    try {
      const response = await fetch('/api/add-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group, code, name })
      });
      const result = await response.json();
      if (response.ok) {
        msg.style.color = 'var(--green)';
        msg.textContent = `成功加入 ${name}(${code}) 並且更新完成！`;
        form.reset();
        loadData(); // 重新載入畫面資料
      } else {
        throw new Error(result.error || '更新失敗');
      }
    } catch (err) {
      msg.style.color = 'var(--red)';
      msg.textContent = `錯誤：${err.message}`;
    }
  });
});
