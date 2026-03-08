/* app.js: Integrated Controller with Persistence, Comparison, Paste Support, and HTML Export */
(function(){
  const state = { indications: [], assets: [], activeIndicationId: null, activeAssetId: null, activeTab: 'indication' };

  const els = {
    fileInput: document.getElementById('fileInput'),
    pasteBox: document.getElementById('jsonPasteBox'),
    btnPaste: document.getElementById('btnProcessPaste'),
    indSelect: document.getElementById('indicationSelect'),
    assSelect: document.getElementById('assetSelect'),
    compLeft: document.getElementById('compareLeft'),
    compRight: document.getElementById('compareRight'),
    btnCompare: document.getElementById('btnCompare'),
    btnClear: document.getElementById('btnClear'),
    btnPrint: document.getElementById('btnPrintPdf'),
    btnExport: document.getElementById('btnExportHtml'), // 補回這行
    contentRoot: document.getElementById('contentRoot'),
    tabs: document.querySelectorAll('.tab')
  };

  // 1. LocalStorage Persistence
  function saveState() {
    localStorage.setItem('bd_reviewer_indications', JSON.stringify(state.indications));
    localStorage.setItem('bd_reviewer_assets', JSON.stringify(state.assets));
  }
  function loadState() {
    try {
      const inds = localStorage.getItem('bd_reviewer_indications');
      const asts = localStorage.getItem('bd_reviewer_assets');
      if (inds) state.indications = JSON.parse(inds);
      if (asts) state.assets = JSON.parse(asts);
      if (state.indications.length) state.activeIndicationId = state.indications[0].id;
      if (state.assets.length) state.activeAssetId = state.assets[0].id;
      refreshSelectors();
      if(state.indications.length || state.assets.length) render();
    } catch(e) { console.error("Storage err", e); }
  }

  // 2. 核心 JSON 處理邏輯
  function processParsedJson(json, fallbackName = "Report") {
    const id = Math.random().toString(16).slice(2);
    let isIndication = false;
    let reportName = fallbackName;

    if (json.Indication) {
      isIndication = true;
      reportName = json.Indication.Name || fallbackName;
      state.indications.push({ id, name: reportName, data: json.Indication });
      state.activeIndicationId = id;
      if (state.activeTab.startsWith('raw') || state.activeTab === 'compare' || state.activeTab === 'asset') setTab('indication');
    } else if (json.Asset) {
      reportName = json.Asset.Name || fallbackName;
      state.assets.push({ id, name: reportName, data: json.Asset });
      state.activeAssetId = id;
      if (state.indications.length === 0 || state.activeTab.startsWith('raw') || state.activeTab === 'compare') setTab('asset');
    } else {
      throw new Error("Invalid format: Root node must be 'Indication' or 'Asset'.");
    }

    saveState(); refreshSelectors(); render();
    return { isIndication, reportName };
  }

  // 3. File Uploading
  els.fileInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target.result);
          processParsedJson(json, file.name.replace('.json', ''));
        } catch (err) { els.contentRoot.innerHTML = `<div style="color:red; padding:20px;">Parse Error: ${err.message}</div>`; }
      };
      reader.readAsText(file);
    });
    e.target.value = '';
  });

  // 4. Paste JSON Logic
  if (els.btnPaste) {
    els.btnPaste.addEventListener('click', () => {
      const rawText = els.pasteBox.value.trim();
      if (!rawText) return alert("Please paste some JSON code first.");
      try {
        const json = JSON.parse(rawText);
        const { reportName } = processParsedJson(json, "AI_Generated_Report");

        const safeFileName = `${reportName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_export.json`;
        const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = safeFileName; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
        els.pasteBox.value = '';
      } catch (err) {
        els.contentRoot.innerHTML = `<div style="color:red; padding:20px;">Paste Error: Invalid JSON Format.<br><br>${err.message}</div>`;
      }
    });
  }

  // 5. UI Updates
  function refreshSelectors() {
    const indOpts = state.indications.map(r => `<option value="${r.id}" ${r.id===state.activeIndicationId?'selected':''}>${r.name}</option>`).join('');
    els.indSelect.innerHTML = indOpts || `<option value="">-- None --</option>`;
    
    const assOpts = state.assets.map(r => `<option value="${r.id}" ${r.id===state.activeAssetId?'selected':''}>${r.name}</option>`).join('');
    els.assSelect.innerHTML = assOpts || `<option value="">-- None --</option>`;
    
    const compOpts = state.assets.map(r => `<option value="${r.id}">${r.name}</option>`).join('');
    els.compLeft.innerHTML = compOpts || `<option value="">-- Select Asset A --</option>`;
    els.compRight.innerHTML = compOpts || `<option value="">-- Select Asset B --</option>`;
  }

  function setTab(tabName) {
    state.activeTab = tabName;
    els.tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tabName));
    render();
  }

  els.tabs.forEach(t => t.addEventListener('click', () => setTab(t.dataset.tab)));
  els.indSelect.addEventListener('change', (e) => { state.activeIndicationId = e.target.value; setTab('indication'); });
  els.assSelect.addEventListener('change', (e) => { state.activeAssetId = e.target.value; setTab('asset'); });
  
  els.btnCompare.addEventListener('click', () => {
    if (!els.compLeft.value || !els.compRight.value) return alert("Please upload and select two assets.");
    setTab('compare');
  });

  els.btnClear.addEventListener('click', () => {
    if(confirm("Clear all loaded reports?")){
      state.indications = []; state.assets = [];
      state.activeIndicationId = null; state.activeAssetId = null;
      localStorage.clear(); refreshSelectors();
      els.contentRoot.innerHTML = `<div class="empty"><h3>Cleared</h3><p>Upload files to begin.</p></div>`;
    }
  });

  els.btnPrint.addEventListener('click', () => window.print());

  // 6. Export HTML Logic (修復並升級此區塊)
  if (els.btnExport) {
    els.btnExport.addEventListener('click', () => {
      if (!els.contentRoot.innerHTML || els.contentRoot.innerHTML.includes('No report loaded')) {
        return alert("Please load a report to export first.");
      }

      // 將 Radar 畫布轉成圖片，讓匯出後的 HTML 也能看到圖表
      const canvas = document.getElementById('radarChart');
      let radarImg = '';
      if (canvas) {
        const dataUrl = canvas.toDataURL("image/png");
        radarImg = `<img src="${dataUrl}" style="width:100%; max-width:500px; display:block; margin:20px auto; border-radius:12px; border:1px solid #223457; background:#101f3a;" />`;
      }

      // 提取深色主題的關鍵 CSS
      const css = `
        :root { --bg: #0b1220; --panel: #0f1b31; --panel2: #101f3a; --text: #e6eefc; --muted: #a9b8d6; --border: #223457; --accent: #6aa9ff; --ok: #22c55e; --warn: #f59e0b; --bad: #ef4444; }
        body { background: var(--bg); color: var(--text); font-family: ui-sans-serif, system-ui, sans-serif; padding: 40px; margin:0; }
        .major-item-frame { border: 2px solid var(--border); border-radius: 12px; margin-bottom: 50px; background: var(--panel); overflow: hidden; }
        .reviewer-card { border: 1px solid var(--border); border-radius: 10px; background: var(--panel2); overflow: hidden; margin-bottom: 20px; }
        .badge { padding: 3px 12px; border-radius: 4px; font-size: 11px; font-weight: bold; display: inline-block; text-transform: uppercase; border: 1px solid transparent; }
        .b-ok { background: rgba(34,197,94,.15); color: var(--ok); border-color: var(--ok); }
        .b-warn { background: rgba(245,158,11,.15); color: var(--warn); border-color: var(--warn); }
        .b-bad { background: rgba(239,68,68,.15); color: var(--bad); border-color: var(--bad); }
        .b-gray { background: rgba(148,163,184,.12); color: var(--muted); border-color: rgba(148,163,184,.28); }
        .prose { line-height: 1.6; }
        h1, h2, h3 { color: var(--accent); }
        a.ref-link, a.citation-link { color: var(--accent); text-decoration: none; font-weight: bold; }
        .card { background: var(--panel); border: 1px solid var(--border); border-radius: 14px; padding: 16px; margin-bottom: 30px; }
      `;

      let bodyHtml = els.contentRoot.innerHTML;
      
      // 將空的 canvas 區塊替換成剛剛截取的圖檔
      if (canvas) {
        bodyHtml = bodyHtml.replace(/<div class="card radar-container"[\s\S]*?<\/div>/, 
          `<div class="card" style="text-align:center; border-left:none;"><h3>Performance Radar</h3>${radarImg}</div>`);
      }

      // 決定匯出的檔名
      let fileName = "BD_Report_Export.html";
      if(state.activeTab === 'indication' && state.activeIndicationId) {
          fileName = `Indication_${state.indications.find(r=>r.id===state.activeIndicationId)?.name}.html`;
      } else if(state.activeTab === 'asset' && state.activeAssetId) {
          fileName = `Asset_${state.assets.find(r=>r.id===state.activeAssetId)?.name}.html`;
      } else if(state.activeTab === 'compare') {
          fileName = "Asset_Comparison.html";
      }

      const finalOutput = `<!DOCTYPE html>\n<html>\n<head>\n  <meta charset="utf-8">\n  <title>Export: ${fileName.replace('.html','')}</title>\n  <style>${css}</style>\n</head>\n<body>\n  <div style="max-width: 1000px; margin: auto;">\n    ${bodyHtml}\n  </div>\n</body>\n</html>`;

      const blob = new Blob([finalOutput], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName.replace(/[^a-z0-9_.]/gi, '_');
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }

  // 7. Main Render Routing
  function render() {
    const activeInd = state.indications.find(r => r.id === state.activeIndicationId);
    const activeAss = state.assets.find(r => r.id === state.activeAssetId);

    if (state.activeTab === 'indication') {
      if (!activeInd) return els.contentRoot.innerHTML = '<div class="empty">Please load an Indication JSON.</div>';
      els.contentRoot.innerHTML = window.ReportRender.renderIndicationView(activeInd.data);
      if (window.ReportRender.afterRenderIndication) window.ReportRender.afterRenderIndication(activeInd.data);
    } else if (state.activeTab === 'asset') {
      if (!activeAss) return els.contentRoot.innerHTML = '<div class="empty">Please load an Asset JSON.</div>';
      els.contentRoot.innerHTML = window.ReportRender.renderAssetView(activeAss.data);
      if (window.ReportRender.afterRenderAsset) window.ReportRender.afterRenderAsset(activeAss.data);
    } else if (state.activeTab === 'compare') {
      const rL = state.assets.find(r => r.id === els.compLeft.value);
      const rR = state.assets.find(r => r.id === els.compRight.value);
      if(!rL || !rR) return els.contentRoot.innerHTML = '<div class="empty">Select two assets to compare.</div>';
      els.contentRoot.innerHTML = window.ReportDiff.renderDiff(rL, rR);
    } else if (state.activeTab === 'raw_indication') {
      if (!activeInd) return els.contentRoot.innerHTML = '<div class="empty">No Indication.</div>';
      els.contentRoot.innerHTML = `<pre style="padding:20px; background:#000; color:#0f0; overflow:auto; border-radius:12px;">${JSON.stringify(activeInd.data, null, 2)}</pre>`;
    } else if (state.activeTab === 'raw_asset') {
      if (!activeAss) return els.contentRoot.innerHTML = '<div class="empty">No Asset.</div>';
      els.contentRoot.innerHTML = `<pre style="padding:20px; background:#000; color:#0f0; overflow:auto; border-radius:12px;">${JSON.stringify(activeAss.data, null, 2)}</pre>`;
    }
  }

  window.addEventListener('DOMContentLoaded', loadState);
})();
