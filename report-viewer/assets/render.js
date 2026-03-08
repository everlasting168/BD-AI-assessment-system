/* render.js: Supports Interactive Tooltips */
(function(){
  function esc(s){
    return String(s ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }

// 升級版：支援 URL 智慧比對與 Fallback 機制
  function richText(s, refs = []){
    if (!s) return '<span style="color:var(--muted)">N/A</span>';
    let t = esc(s);

    t = t.replace(/\[(\d+)\]\((https?:\/\/[^\s)]+)\)/g, (m, num, url) => {
      // 1. 優先透過 URL 智慧搜尋該區塊的 References，避免依賴絕對數字索引
      let matchedRef = null;
      for (let r of refs) {
        if (typeof r === 'string' && r.includes(url)) { matchedRef = r; break; }
        else if (typeof r === 'object' && JSON.stringify(r).includes(url)) { matchedRef = r; break; }
      }

      // 2. 如果 URL 找不到，退回使用數字索引 (相容舊版寫法)
      if (!matchedRef) {
        const refIdx = parseInt(num, 10) - 1;
        if (refs[refIdx]) matchedRef = refs[refIdx];
      }

      // 3. 組裝 Tooltip 文字
      let tooltip = '';
      if (matchedRef) {
        if (typeof matchedRef === 'string') {
          // 清除字串中的 Markdown 連結語法，保持 Tooltip 乾淨
          tooltip = matchedRef.replace(/\[.*?\]\(.*?\)/g, '').substring(0, 150) + '...';
        } else {
          tooltip = `[${matchedRef.Classification || 'Ref'}] ${matchedRef.Citation}`;
        }
      } else {
        // 4. 終極退路：如果都找不到，直接顯示來源網址
        tooltip = `External Source:\n${url}`;
      }

      return `<a href="${esc(url)}" target="_blank" class="citation-link" data-tooltip="${esc(tooltip)}">[${num}]</a>`;
    });

    t = t.replace(/\*\*(.+?)\*\*/gs, '<strong>$1</strong>');
    t = t.replace(/\n/g, '<br>');
    return `<div class="prose" style="line-height:1.6;">${t}</div>`;
  }

  function getStatusClass(type) {
    const t = String(type || '').toLowerCase();
    if (t.includes('positive')) return 'b-ok';
    if (t.includes('negative')) return 'b-bad';
    if (t.includes('hypothetical')) return 'b-warn';
    return 'b-gray';
  }

  function renderScoreGrid(scoringData) {
    if(!scoringData) return '';
    const keys = Object.keys(scoringData).filter(k => k !== 'TotalScore' && typeof scoringData[k] === 'object' && scoringData[k].Score);
    return `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin-top: 15px;">
        ${keys.map(key => {
          const score = scoringData[key].Score;
          let color = 'var(--muted)';
          if (score === '○') color = 'var(--ok)';
          if (score === '△') color = 'var(--warn)';
          if (score === '×') color = 'var(--bad)';
          return `
            <div style="background: var(--panel2); border: 1px solid var(--border); padding: 12px; border-radius: 8px; text-align: center;">
              <div style="font-size: 0.65rem; color: var(--muted); text-transform: uppercase; margin-bottom: 5px; height: 2.5em; display:flex; align-items:center; justify-content:center;">
                ${key.replace(/([A-Z])/g, ' $1')}
              </div>
              <div style="font-size: 1.8rem; font-weight: bold; color: ${color};">${esc(score)}</div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  function renderGenericDetails(obj, refs = []) {
    if (obj === null || obj === undefined) return '';
    if (typeof obj !== 'object') return richText(String(obj), refs);
    if (Array.isArray(obj)) {
      return `<ul style="margin: 0; padding-left: 20px; color: var(--text);">
        ${obj.map(item => `<li style="margin-bottom:4px;">${renderGenericDetails(item, refs)}</li>`).join('')}
      </ul>`;
    }
    return Object.entries(obj).map(([k, v]) => `
      <div style="margin-bottom: 12px; padding: 12px; background: rgba(255,255,255,0.02); border-radius: 8px; border-left: 3px solid var(--border);">
        <div style="font-size:0.7rem; color:var(--muted); font-weight:bold; text-transform:uppercase; margin-bottom:6px; letter-spacing:0.5px;">${k.replace(/([A-Z])/g, ' $1')}</div>
        <div style="font-size: 0.95rem; color: var(--text);">${renderGenericDetails(v, refs)}</div>
      </div>
    `).join('');
  }

  function renderStandardizedSections(category) {
    const refs = category.References || [];
    const discNotes = category.DiscrepancyNotes || (typeof category.Discrepancy === 'string' && category.Discrepancy !== 'No' && category.Discrepancy !== 'Yes' ? [category.Discrepancy] : []);
    const hasDiscrepancy = category.Discrepancy === 'Yes' || discNotes.length > 0;

    const metaData = { ...category };
    delete metaData.Score; delete metaData.Rationale; delete metaData.References; 
    delete metaData.ClassificationSummary; delete metaData.Discrepancy; delete metaData.DiscrepancyNotes;

    let html = '';
    if (Object.keys(metaData).length > 0) html += `<div style="margin-bottom: 20px;">${renderGenericDetails(metaData, refs)}</div>`;

    if (category.Rationale) {
      html += `
        <div style="margin-bottom: 25px; padding: 15px; background: rgba(106, 169, 255, 0.05); border-left: 4px solid var(--accent); border-radius: 6px;">
          <div style="font-size:0.75rem; color:var(--accent); font-weight:bold; margin-bottom:8px; text-transform:uppercase;">Core Rationale</div>
          ${richText(category.Rationale, refs)}
        </div>
      `;
    }

    if (hasDiscrepancy) {
      html += `
        <div style="margin-bottom: 25px; padding: 15px; background: rgba(245, 158, 11, 0.1); border-left: 4px solid var(--warn); border-radius: 6px;">
          <div style="font-size:0.75rem; color:var(--warn); font-weight:bold; margin-bottom:8px; text-transform:uppercase;">Evidence Discrepancy / Gap Analysis</div>
          <ul style="margin:0; padding-left:20px; color:var(--text); font-size:0.95rem;">
            ${discNotes.map(note => `<li style="margin-bottom:6px;">${richText(note, refs)}</li>`).join('')}
          </ul>
        </div>
      `;
    }

    if (refs.length > 0) {
      html += `<div style="display:flex; flex-direction:column; gap:20px; break-inside: avoid;">`;
      html += refs.map((ref) => {
        if (typeof ref === 'string') {
          return `
            <div class="reviewer-card" style="border: 1px solid var(--border); border-radius: 8px; background: var(--panel2); padding: 15px 18px; font-size: 0.95rem;">
              <div style="font-size:0.6rem; color:var(--muted); font-weight:bold; text-transform:uppercase; margin-bottom:6px;">Citation</div>
              ${richText(ref)}
            </div>
          `;
        }
        return `
          <div class="reviewer-card" style="border: 1px solid var(--border); border-radius: 8px; background: var(--panel2); overflow: hidden; break-inside: avoid;">
            <div style="padding: 12px 18px; background: rgba(0,0,0,0.2); border-bottom: 1px solid var(--border); display:flex; justify-content:space-between; align-items:center;">
              <div>
                 <div style="font-size:0.6rem; color:var(--muted); font-weight:bold; text-transform:uppercase; margin-bottom:4px;">Citation</div>
                 <div style="font-weight:700; color:var(--text); font-size: 0.95rem;">${esc(ref.Citation)}</div>
              </div>
              ${ref.Classification ? `<span class="badge ${getStatusClass(ref.Classification)}">${esc(ref.Classification).toUpperCase()}</span>` : ''}
            </div>
            <div style="padding: 15px 18px;">
              <div style="font-size: 0.95rem; color: var(--text);">
                ${richText(ref.ClassificationRationale || ref.Rationale, refs)}
              </div>
            </div>
          </div>
        `;
      }).join('');
      html += `</div>`;
    }
    return html;
  }

  function renderIndicationView(data) {
    const scoring = data.DiseaseScoring || {};
    const total = data.TotalScore || {};
    const keys = Object.keys(scoring).filter(k => k !== 'TotalScore' && scoring[k].Score);
    const totalMax = total.Note ? total.Note.match(/out of (\d+)|(\d+)\/(\d+)|(\d+) possible/i)?.[3] || total.Note.match(/out of (\d+)|(\d+)\/(\d+)|(\d+) possible/i)?.[2] || '14' : '14';

    let html = `
      <div class="report-header" style="margin-bottom:30px;">
        <div class="badge b-gray" style="margin-bottom:10px;">INDICATION PROFILE</div>
        <h1 style="margin:0; font-size:2rem; color:var(--accent);">${esc(data.Name)}</h1>
        <p style="margin:10px 0 0 0; font-size:1.05rem; line-height:1.5; opacity:0.9;">${richText(data.Description)}</p>
      </div>
      <div class="card" style="margin-bottom: 30px; border-left: 6px solid var(--accent); background: var(--panel);">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 10px;">
          <h3 style="margin:0; text-transform: uppercase; letter-spacing:1px; font-size:0.9rem;">Disease Evaluation Score</h3>
          <div style="font-size: 1.2rem; font-weight: bold;">TOTAL: <span style="color:var(--ok)">${total.value || 0}/${totalMax}</span></div>
        </div>
        ${renderScoreGrid(scoring)}
      </div>
      <div class="card radar-container" style="margin-bottom:40px; background:var(--panel2); text-align:center;">
        <canvas id="radarChart" width="400" height="250"></canvas>
      </div>
    `;

    keys.forEach(key => {
      const category = scoring[key];
      html += `
        <div class="major-item-frame" style="border: 2px solid var(--border); border-radius: 12px; margin-bottom: 40px; background: var(--panel); overflow: hidden; break-inside: avoid;">
          <div style="background: var(--border); padding: 15px 25px; display: flex; justify-content: space-between; align-items: center;">
            <h2 style="margin:0; font-size: 1.1rem; letter-spacing: 1px; font-weight: 800; color: #fff;">${key.replace(/([A-Z])/g, ' $1').toUpperCase()}</h2>
            <div style="display:flex; align-items:center; gap:12px;">
              <span style="font-size: 1.6rem; font-weight: 900; color: var(--accent); line-height:1;">${esc(category.Score)}</span>
            </div>
          </div>
          <div style="padding: 25px;">${renderStandardizedSections(category)}</div>
        </div>
      `;
    });
    return html;
  }

  function renderAssetView(data) {
    const scoring = data.AssetScoring || {};
    const total = data.TotalScore || {};
    const keys = Object.keys(scoring).filter(k => k !== 'TotalScore' && scoring[k].Score);

    let html = `
      <div class="report-header" style="margin-bottom:30px;">
        <div class="badge b-ok" style="margin-bottom:10px;">ASSET PROFILE</div>
        <h1 style="margin:0; font-size:2rem; color:var(--accent);">${esc(data.Name)}</h1>
        <p style="margin:5px 0; font-size:1.1rem; opacity:0.8;">Target: <strong>${esc(data.Indication)}</strong> | Sponsor: ${esc(data.Sponsor)}</p>
      </div>
      <div class="card" style="margin-bottom: 30px; border-left: 6px solid var(--accent); background: var(--panel);">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 10px;">
          <h3 style="margin:0; text-transform: uppercase; letter-spacing:1px; font-size:0.9rem;">Asset Capability Score</h3>
          <div style="font-size: 1.2rem; font-weight: bold;">TOTAL: <span style="color:var(--ok)">${total.value || 0}/12</span></div>
        </div>
        ${renderScoreGrid(scoring)}
      </div>
      <div class="card radar-container" style="margin-bottom:40px; background:var(--panel2); text-align:center;">
        <canvas id="radarChart" width="400" height="250"></canvas>
      </div>
    `;

    keys.forEach(key => {
      const category = scoring[key];
      html += `
        <div class="major-item-frame" style="border: 2px solid var(--border); border-radius: 12px; margin-bottom: 40px; background: var(--panel); overflow: hidden; break-inside: avoid;">
          <div style="background: var(--border); padding: 15px 25px; display: flex; justify-content: space-between; align-items: center;">
            <h2 style="margin:0; font-size: 1.1rem; letter-spacing: 1px; font-weight: 800; color: #fff;">${key.replace(/([A-Z])/g, ' $1').toUpperCase()}</h2>
            <div style="display:flex; align-items:center; gap:12px;">
              <span style="font-size: 1.6rem; font-weight: 900; color: var(--accent); line-height:1;">${esc(category.Score)}</span>
            </div>
          </div>
          <div style="padding: 25px;">${renderStandardizedSections(category)}</div>
        </div>
      `;
    });
    return html;
  }

  function drawChart(scoringData) {
    const canvas = document.getElementById('radarChart');
    if (canvas && window.RadarChart && scoringData) {
      const labels = Object.keys(scoringData).filter(k => k !== 'TotalScore' && scoringData[k].Score);
      const scores = labels.map(l => scoringData[l].Score);
      window.RadarChart.draw(canvas, labels, scores);
    }
  }

  window.ReportRender = { 
    renderIndicationView, renderAssetView,
    afterRenderIndication: (data) => drawChart(data.DiseaseScoring),
    afterRenderAsset: (data) => drawChart(data.AssetScoring)
  };
})();