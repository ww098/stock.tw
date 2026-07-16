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
