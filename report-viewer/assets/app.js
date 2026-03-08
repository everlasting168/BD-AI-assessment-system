/* app.js: Integrated Controller with Persistence & Comparison */
(function(){
  const state = { indications: [], assets: [], activeIndicationId: null, activeAssetId: null, activeTab: 'indication' };

  const els = {
    fileInput: document.getElementById('fileInput'),
    indSelect: document.getElementById('indicationSelect'),
    assSelect: document.getElementById('assetSelect'),
    compLeft: document.getElementById('compareLeft'),
    compRight: document.getElementById('compareRight'),
    btnCompare: document.getElementById('btnCompare'),
    btnClear: document.getElementById('btnClear'),
    btnPrint: document.getElementById('btnPrintPdf'),
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

  // 2. File Uploading
  els.fileInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target.result);
          const id = Math.random().toString(16).slice(2);
          if (json.Indication) {
            state.indications.push({ id, name: json.Indication.Name, data: json.Indication });
            state.activeIndicationId = id;
            if (state.activeTab.startsWith('raw') || state.activeTab === 'compare') setTab('indication');
          } else if (json.Asset) {
            state.assets.push({ id, name: json.Asset.Name, data: json.Asset });
            state.activeAssetId = id;
            if (state.indications.length === 0) setTab('asset');
          }
          saveState(); refreshSelectors(); render();
        } catch (err) { els.contentRoot.innerHTML = `<div style="color:red; padding:20px;">Error: ${err.message}</div>`; }
      };
      reader.readAsText(file);
    });
    e.target.value = '';
  });

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