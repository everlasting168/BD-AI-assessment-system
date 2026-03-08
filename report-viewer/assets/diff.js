/* diff.js: Side-by-Side Asset Comparison */
(function(){
  function scoreToNum(s){
    const v = String(s ?? '').trim();
    if (v === '○') return 2; if (v === '△') return 1; if (v === '×') return 0;
    return isNaN(parseInt(v)) ? 0 : parseInt(v);
  }
  function esc(s){ return String(s ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }

  function renderDiff(reportL, reportR) {
    const sL = reportL.data.AssetScoring || {};
    const sR = reportR.data.AssetScoring || {};
    
    const totalL = sL.TotalScore?.value ?? reportL.data.TotalScore?.value ?? 0;
    const totalR = sR.TotalScore?.value ?? reportR.data.TotalScore?.value ?? 0;
    const totalDelta = totalR - totalL;

    const keys = Array.from(new Set([...Object.keys(sL), ...Object.keys(sR)])).filter(k => k !== 'TotalScore' && typeof sL[k] === 'object');

    let html = `
      <div class="major-item-frame" style="border: 2px solid var(--accent); border-radius: 12px; background: var(--panel); overflow: hidden; break-inside: avoid;">
        <div style="background: var(--accent); color: #000; padding: 15px 20px; font-weight: bold; text-transform: uppercase;">
          Comparative Analysis: ${esc(reportL.name)} vs ${esc(reportR.name)}
        </div>
        
        <div style="padding: 20px;">
          <div style="display: flex; gap: 15px; margin-bottom: 25px;">
            <div class="reviewer-card" style="flex:1; padding:15px; text-align:center; background: var(--panel2);">
              <div style="font-size:0.7rem; color:var(--muted); text-transform:uppercase;">Asset A: ${esc(reportL.name)}</div>
              <div style="font-size:2.2rem; font-weight:bold;">${totalL}/12</div>
            </div>
            <div class="reviewer-card" style="flex:1; padding:15px; text-align:center; background: var(--panel2);">
              <div style="font-size:0.7rem; color:var(--muted); text-transform:uppercase;">Asset B: ${esc(reportR.name)}</div>
              <div style="font-size:2.2rem; font-weight:bold;">${totalR}/12</div>
            </div>
            <div class="reviewer-card" style="flex:1; padding:15px; text-align:center; border-color: var(--accent); background: rgba(106, 169, 255, 0.05);">
              <div style="font-size:0.7rem; color:var(--muted); text-transform:uppercase;">Net Variance (B - A)</div>
              <div style="font-size:2.2rem; font-weight:bold; color: ${totalDelta > 0 ? 'var(--ok)' : totalDelta < 0 ? 'var(--bad)' : 'var(--text)'}">
                ${totalDelta > 0 ? '+' : ''}${totalDelta}
              </div>
            </div>
          </div>

          <table style="width:100%; border-collapse: collapse; background: var(--panel2); border-radius: 8px; overflow:hidden; border: 1px solid var(--border);">
            <thead>
              <tr style="background: rgba(0,0,0,0.3); color: var(--accent); text-align: left;">
                <th style="padding:15px; border-bottom: 1px solid var(--border);">Evaluation Criteria</th>
                <th style="padding:15px; text-align:center; border-bottom: 1px solid var(--border);">Asset A Score</th>
                <th style="padding:15px; text-align:center; border-bottom: 1px solid var(--border);">Asset B Score</th>
                <th style="padding:15px; text-align:center; border-bottom: 1px solid var(--border);">Delta</th>
              </tr>
            </thead>
            <tbody>
              ${keys.map(k => {
                const scL = sL[k]?.Score ?? '—'; const scR = sR[k]?.Score ?? '—';
                const d = scoreToNum(scR) - scoreToNum(scL);
                return `
                  <tr style="border-bottom: 1px solid var(--border);">
                    <td style="padding:15px; font-weight:600; color:var(--text);">${k.replace(/([A-Z])/g, ' $1')}</td>
                    <td style="padding:15px; text-align:center; font-size:1.4rem;">${esc(scL)}</td>
                    <td style="padding:15px; text-align:center; font-size:1.4rem;">${esc(scR)}</td>
                    <td style="padding:15px; text-align:center; font-weight:bold; font-size:1.2rem; color: ${d > 0 ? 'var(--ok)' : d < 0 ? 'var(--bad)' : 'var(--muted)'}">
                      ${d > 0 ? '▲' : d < 0 ? '▼' : '−'}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
    return html;
  }
  window.ReportDiff = { renderDiff };
})();