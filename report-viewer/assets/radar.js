/* radar.js: Optimized for symbolic scores */
(function(){
  function scoreToNum(s){
    const v = String(s ?? '').trim();
    if (v === '○') return 2;
    if (v === '△') return 1;
    return 0;
  }

  function draw(canvas, labels, rawScores){
    const ctx = canvas.getContext('2d');
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const radius = 100;
    const scores = rawScores.map(scoreToNum);
    const numPoints = labels.length;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 1. Draw Web/Grid
    ctx.strokeStyle = '#223457';
    ctx.setLineDash([2, 2]);
    for(let r=1; r<=2; r++) {
      ctx.beginPath();
      for(let i=0; i<numPoints; i++) {
        const ang = (i * 2 * Math.PI / numPoints) - Math.PI/2;
        const x = cx + (radius * (r/2)) * Math.cos(ang);
        const y = cy + (radius * (r/2)) * Math.sin(ang);
        if(i===0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // 2. Draw Data Area
    ctx.fillStyle = 'rgba(106, 169, 255, 0.4)';
    ctx.strokeStyle = '#6aa9ff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for(let i=0; i<numPoints; i++) {
      const ang = (i * 2 * Math.PI / numPoints) - Math.PI/2;
      const r = (scores[i] / 2) * radius; // Normalize 0-2 score to radius
      const x = cx + r * Math.cos(ang);
      const y = cy + r * Math.sin(ang);
      if(i===0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 3. Labels
    ctx.fillStyle = '#a9b8d6';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    for(let i=0; i<numPoints; i++) {
      const ang = (i * 2 * Math.PI / numPoints) - Math.PI/2;
      const x = cx + (radius + 15) * Math.cos(ang);
      const y = cy + (radius + 15) * Math.sin(ang);
      const label = labels[i].replace(/([A-Z])/g, ' $1').trim();
      ctx.fillText(label, x, y);
    }
  }

  window.RadarChart = { draw };
})();