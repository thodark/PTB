document.addEventListener('DOMContentLoaded', function () {

  // ── Constants ────────────────────────────────────────────────
  const PHOTO_COUNTDOWN = 7;
  const MAX_PHOTOS      = 10;

  const LAYOUTS = {
    '2x2':   { cols: 2, rows: 2, orientation: 'landscape', count: 4 },
    'strip': { cols: 4, rows: 1, orientation: 'landscape', count: 4 },  // 4 ngang
    'film':  { cols: 1, rows: 3, orientation: 'portrait',  count: 3, isFilm: true }
  };

  // ── Filter definitions ───────────────────────────────────────
  const FILTER_DEFS = {
    none:       { css: () => 'none', apply: () => {} },
    bw:         { css: (o) => `grayscale(${o}) contrast(${1 + 0.2*o})`,
                  apply: (ctx, w, h, o) => applyCSS(ctx, w, h, `grayscale(${o}) contrast(${1 + 0.2*o})`) },
    sepia:      { css: (o) => `sepia(${o}) contrast(${1 + 0.1*o}) brightness(${1 - 0.05*o})`,
                  apply: (ctx, w, h, o) => { applyCSS(ctx, w, h, `sepia(${o}) contrast(${1 + 0.1*o}) brightness(${1 - 0.05*o})`); addGrain(ctx, w, h, 18 * o); } },
    hicontrast: { css: (o) => `contrast(${1 + 0.8*o}) brightness(${1 - 0.1*o}) saturate(${1 + 0.3*o})`,
                  apply: (ctx, w, h, o) => applyCSS(ctx, w, h, `contrast(${1 + 0.8*o}) brightness(${1 - 0.1*o}) saturate(${1 + 0.3*o})`) },
    grain:      { css: (o) => `contrast(1.05) brightness(${1 - 0.05*o}) saturate(${1 - 0.15*o})`,
                  apply: (ctx, w, h, o) => { applyCSS(ctx, w, h, `contrast(1.05) brightness(${1 - 0.05*o}) saturate(${1 - 0.15*o})`); addGrain(ctx, w, h, 40 * o); } },
    lightleak:  { css: (o) => `contrast(${1 + 0.1*o}) brightness(${1 + 0.15*o}) saturate(${1 + 0.2*o})`,
                  apply: (ctx, w, h, o) => { applyCSS(ctx, w, h, `contrast(${1 + 0.1*o}) brightness(${1 + 0.15*o}) saturate(${1 + 0.2*o})`); addLightLeak(ctx, w, h, o); } },
    polaroid:   { css: (o) => `contrast(${1 - 0.1*o}) brightness(${1 + 0.1*o}) saturate(${1 - 0.2*o}) sepia(${0.15*o})`,
                  apply: (ctx, w, h, o) => { applyCSS(ctx, w, h, `contrast(${1 - 0.1*o}) brightness(${1 + 0.1*o}) saturate(${1 - 0.2*o}) sepia(${0.15*o})`); addGrain(ctx, w, h, 10 * o); addVignette(ctx, w, h, 0.25 * o); } },
    softglow:   { css: (o) => `brightness(${1 + 0.1*o}) contrast(${1 - 0.1*o}) saturate(${1 + 0.15*o})`,
                  apply: (ctx, w, h, o) => { applyCSS(ctx, w, h, `brightness(${1 + 0.1*o}) contrast(${1 - 0.1*o}) saturate(${1 + 0.15*o})`); addGlow(ctx, w, h, o); } },
    rosy:       { css: (o) => `saturate(${1 + 0.3*o}) brightness(${1 + 0.08*o}) hue-rotate(${-10*o}deg)`,
                  apply: (ctx, w, h, o) => { applyCSS(ctx, w, h, `saturate(${1 + 0.3*o}) brightness(${1 + 0.08*o}) hue-rotate(${-10*o}deg)`); addColorTint(ctx, w, h, 255, 150, 160, 0.08 * o); } },
    cold:       { css: (o) => `hue-rotate(${18*o}deg) saturate(${1 + 0.2*o}) brightness(${1 + 0.05*o})`,
                  apply: (ctx, w, h, o) => { applyCSS(ctx, w, h, `hue-rotate(${18*o}deg) saturate(${1 + 0.2*o}) brightness(${1 + 0.05*o})`); addColorTint(ctx, w, h, 140, 180, 255, 0.08 * o); } },
    warm:       { css: (o) => `saturate(${1 + 0.2*o}) brightness(${1 + 0.08*o}) sepia(${0.2*o})`,
                  apply: (ctx, w, h, o) => { applyCSS(ctx, w, h, `saturate(${1 + 0.2*o}) brightness(${1 + 0.08*o}) sepia(${0.2*o})`); addColorTint(ctx, w, h, 255, 200, 120, 0.06 * o); } }
  };

  // ── Canvas FX helpers ────────────────────────────────────────
  function applyCSS(ctx, w, h, filterStr) {
    const tmp = document.createElement('canvas'); tmp.width = w; tmp.height = h;
    const tCtx = tmp.getContext('2d'); tCtx.filter = filterStr; tCtx.drawImage(ctx.canvas, 0, 0);
    ctx.clearRect(0, 0, w, h); ctx.drawImage(tmp, 0, 0);
  }
  function addGrain(ctx, w, h, intensity) {
    if (intensity <= 0) return;
    const imgData = ctx.getImageData(0, 0, w, h); const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = (Math.random() - 0.5) * intensity * 2;
      d[i]   = Math.max(0, Math.min(255, d[i]   + n));
      d[i+1] = Math.max(0, Math.min(255, d[i+1] + n));
      d[i+2] = Math.max(0, Math.min(255, d[i+2] + n));
    }
    ctx.putImageData(imgData, 0, 0);
  }
  function addLightLeak(ctx, w, h, opacity) {
    if (opacity <= 0) return;
    const leak = ctx.createLinearGradient(0, 0, w * 0.6, h * 0.5);
    leak.addColorStop(0,   `rgba(255,140,30,${0.55 * opacity})`);
    leak.addColorStop(0.3, `rgba(255,80,0,${0.30 * opacity})`);
    leak.addColorStop(0.6, `rgba(255,200,80,${0.15 * opacity})`);
    leak.addColorStop(1,   `rgba(255,255,200,0)`);
    ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = leak; ctx.fillRect(0, 0, w, h);
    const leak2 = ctx.createLinearGradient(w, h, w * 0.4, h * 0.3);
    leak2.addColorStop(0,   `rgba(200,0,80,${0.25 * opacity})`);
    leak2.addColorStop(0.5, `rgba(255,50,30,${0.12 * opacity})`);
    leak2.addColorStop(1,   `rgba(255,120,0,0)`);
    ctx.fillStyle = leak2; ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';
  }
  function addVignette(ctx, w, h, strength) {
    if (strength <= 0) return;
    const grad = ctx.createRadialGradient(w/2, h/2, h*0.35, w/2, h/2, h*0.85);
    grad.addColorStop(0, 'rgba(0,0,0,0)'); grad.addColorStop(1, `rgba(0,0,0,${strength})`);
    ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
  }
  function addGlow(ctx, w, h, opacity) {
    if (opacity <= 0) return;
    const tmp = document.createElement('canvas'); tmp.width = w; tmp.height = h;
    const tCtx = tmp.getContext('2d');
    tCtx.filter = `blur(${Math.round(w * 0.008)}px) brightness(1.3) saturate(1.2)`;
    tCtx.drawImage(ctx.canvas, 0, 0);
    ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = 0.28 * opacity;
    ctx.drawImage(tmp, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  }
  function addColorTint(ctx, w, h, r, g, b, alpha) {
    if (alpha <= 0) return; ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`; ctx.fillRect(0, 0, w, h);
  }

  // ── State ────────────────────────────────────────────────────
  let photoCount       = 0;
  let isSessionActive  = false;
  let currentFilterKey = 'none';
  let filterOpacity    = 1.0;
  let currentLayout    = '2x2';  // default, will be overridden by picker

  // ── DOM ──────────────────────────────────────────────────────
  const video               = document.getElementById('video');
  const canvas              = document.getElementById('canvas');
  const ctx                 = canvas.getContext('2d');
  const photoGallery        = document.getElementById('photoGallery');
  const startButton         = document.getElementById('startButton');
  const restartButton       = document.getElementById('restartButton');
  const downloadButton      = document.getElementById('downloadButton');
  const timerDisplay        = document.getElementById('timerDisplay');
  const photoCountDisplay   = document.getElementById('photoCountDisplay');
  const selectedCount       = document.getElementById('selectedCount');
  const selectedCountStat   = document.getElementById('selectedCountStat');
  const selectionMessage    = document.getElementById('selectionMessage');
  const countdownDisplay    = document.getElementById('countdownDisplay');
  const flash               = document.getElementById('flash');
  const progressBar         = document.getElementById('progressBar');
  const cameraHint          = document.getElementById('cameraHint');
  const filterButtons       = document.querySelectorAll('.filter-btn');
  const opacitySlider       = document.getElementById('opacitySlider');
  const opacityValue        = document.getElementById('opacityValue');
  const opacityRow          = document.getElementById('opacityRow');
  const videoContainer      = document.getElementById('videoContainer');
  const layoutPickerOverlay = document.getElementById('layoutPickerOverlay');
  const confirmLayoutBtn    = document.getElementById('confirmLayoutBtn');
  const changeLayoutBtn     = document.getElementById('changeLayoutBtn');
  const currentLayoutBadge  = document.getElementById('currentLayoutBadge');
  const layoutCards         = document.querySelectorAll('.layout-card');

  function getMaxSelections() { return LAYOUTS[currentLayout]?.count || 4; }

  // ── Layout badge label ───────────────────────────────────────
  const LAYOUT_LABELS = { '2x2': '⊞ Grid 2×2', 'strip': '▥ Strip ×4', 'film': '🎞 Film 35mm' };

  // ── Layout Picker ─────────────────────────────────────────────
  function showLayoutPicker() {
    layoutPickerOverlay.classList.remove('hidden');
    // Reset card selection to current layout
    layoutCards.forEach(c => {
      c.classList.toggle('selected', c.dataset.layout === currentLayout);
    });
    confirmLayoutBtn.disabled = false;
  }

  function hideLayoutPicker() {
    layoutPickerOverlay.classList.add('hidden');
  }

  layoutCards.forEach(card => {
    card.addEventListener('click', () => {
      layoutCards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      confirmLayoutBtn.disabled = false;
    });
  });

  confirmLayoutBtn.addEventListener('click', () => {
    const selected = document.querySelector('.layout-card.selected');
    if (!selected) return;
    const newLayout = selected.dataset.layout;
    setLayout(newLayout);
    hideLayoutPicker();
  });

  changeLayoutBtn.addEventListener('click', () => {
    if (isSessionActive) {
      if (!confirm('Đổi khung sẽ xoá hết ảnh đã chụp. Tiếp tục?')) return;
      isSessionActive = false;
    }
    showLayoutPicker();
  });

  function setLayout(layout) {
    currentLayout = layout;
    currentLayoutBadge.textContent = LAYOUT_LABELS[layout] || layout;

    // Adjust video container aspect ratio
    if (layout === 'strip') {
      // Strip: preview dọc 9:16 để dễ canh người
      videoContainer.className = 'video-container portrait';
    } else {
      // Grid + Film: preview ngang 16:9
      videoContainer.className = 'video-container landscape';
    }

    // Restart camera with optimal constraints for orientation
    restartCameraForLayout(layout);

    // Reset selection UI
    const max = getMaxSelections();
    if (selectedCount) selectedCount.textContent = `0/${max}`;
    if (selectedCountStat) selectedCountStat.textContent = `0/${max}`;
    document.querySelectorAll('.photo-checkbox').forEach(cb => { cb.checked = false; });
    document.querySelectorAll('.photo-card').forEach(c => c.classList.remove('selected'));
    if (selectionMessage) selectionMessage.textContent = '';
    downloadButton.disabled = true;
    photoGallery.innerHTML = '';
    photoCount = 0;
    photoCountDisplay.textContent = '0';
    progressBar.style.width = '0%';
    timerDisplay.textContent = PHOTO_COUNTDOWN;
    startButton.classList.remove('hidden');
    restartButton.classList.add('hidden');
    resetUI(false);
  }

  // ── Live filter preview ──────────────────────────────────────
  function updateVideoFilter() {
    const def = FILTER_DEFS[currentFilterKey];
    video.style.filter = (def && currentFilterKey !== 'none') ? def.css(filterOpacity) : 'none';
  }

  // ── Camera ───────────────────────────────────────────────────
  let currentStream = null;

  async function startCamera() {
    await startCameraWithConstraints(currentLayout);
  }

  async function restartCameraForLayout(layout) {
    // Stop existing stream first
    if (currentStream) {
      currentStream.getTracks().forEach(t => t.stop());
      currentStream = null;
    }
    await startCameraWithConstraints(layout);
  }

  async function startCameraWithConstraints(layout) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showError('Camera not supported on this device.'); return;
    }
    if (location.protocol === 'file:') {
      showError('📷 Camera requires a local server — not file://\n\nOptions:\n• VS Code: Right-click index.html → "Open with Live Server"\n• Python:  python -m http.server 8080\n• Node:    npx serve .\n\nThen open http://localhost:8080');
      if (cameraHint) cameraHint.textContent = '⚠️ Open via a local server to use camera'; return;
    }
    try {
      // For strip (portrait preview): request portrait dimensions for better FOV
      // For others: request landscape
      let videoConstraints;
      if (layout === 'strip') {
        // Portrait orientation: wider FOV by requesting tall resolution
        videoConstraints = {
          facingMode: 'user',
          width:  { ideal: 1080, min: 720 },
          height: { ideal: 1920, min: 1280 },
        };
      } else {
        // Landscape
        videoConstraints = {
          facingMode: 'user',
          width:  { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 },
        };
      }

      const stream = await navigator.mediaDevices.getUserMedia({ video: videoConstraints, audio: false });
      currentStream = stream;
      video.srcObject = stream;
      video.play().catch(e => console.warn('Video play error:', e));
      if (cameraHint) cameraHint.style.display = 'none';
    } catch (err) {
      console.warn('Preferred constraints failed, trying fallback:', err);
      try {
        // Fallback: basic facingMode only
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false
        });
        currentStream = stream;
        video.srcObject = stream;
        video.play().catch(e => console.warn('Video play error:', e));
        if (cameraHint) cameraHint.style.display = 'none';
      } catch (err2) {
        showError('Could not access camera. Please allow permissions.');
      }
    }
  }

  // ── Session ──────────────────────────────────────────────────
  function startSession() {
    if (isSessionActive) return;
    isSessionActive = true;
    startButton.classList.add('hidden');
    restartButton.classList.remove('hidden');
    if (cameraHint) cameraHint.style.display = 'none';
    startPhotoCountdown();
  }

  function restartSession() {
    if (!confirm('Delete all photos and start over? 😊')) return;
    isSessionActive = false;
    resetUI(true);
  }

  function endSession() {
    isSessionActive = false;
    timerDisplay.textContent = 'Done!';
    restartButton.classList.add('hidden');
    enableCheckboxes(true);
    showNotification('Session complete! Select your best photos ✨');
    updateSelectedCount();
  }

  // ── Countdown ────────────────────────────────────────────────
  function startPhotoCountdown() {
    if (!isSessionActive) return;
    let countdown = PHOTO_COUNTDOWN;
    const interval = setInterval(() => {
      if (!isSessionActive) { clearInterval(interval); return; }
      countdownDisplay.textContent = countdown;
      timerDisplay.textContent = countdown;
      countdownDisplay.classList.remove('pop');
      void countdownDisplay.offsetWidth;
      countdownDisplay.classList.add('pop');
      setTimeout(() => countdownDisplay.classList.remove('pop'), 950);
      countdown--;
      if (countdown < 0) {
        clearInterval(interval);
        takePhoto();
        if (photoCount < MAX_PHOTOS) startPhotoCountdown();
        else endSession();
      }
    }, 1000);
  }

  // ── Capture ──────────────────────────────────────────────────
  function takePhoto() {
    photoCount++;
    photoCountDisplay.textContent = photoCount;
    progressBar.style.width = (photoCount / MAX_PHOTOS * 100) + '%';
    flash.classList.add('active');
    setTimeout(() => flash.classList.remove('active'), 300);

    // Capture at native video resolution for best quality
    const vW = video.videoWidth  || 1280;
    const vH = video.videoHeight || 720;

    canvas.width  = vW;
    canvas.height = vH;

    // Mirror the captured image (scaleX(-1)) — same as preview
    ctx.save();
    ctx.translate(vW, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, vW, vH);
    ctx.restore();

    const def = FILTER_DEFS[currentFilterKey];
    if (def && currentFilterKey !== 'none') def.apply(ctx, vW, vH, filterOpacity);

    addPhotoToGallery(canvas.toDataURL('image/jpeg', 0.95), photoCount);
  }

  // ── Gallery ──────────────────────────────────────────────────
  function addPhotoToGallery(dataURL, number) {
    const card = document.createElement('div');
    card.className = 'photo-card';
    card.innerHTML = `
      <button class="delete-photo-btn" title="Delete photo">×</button>
      <img src="${dataURL}" alt="Photo ${number}">
      <div class="photo-info">
        <span class="photo-number">#${number}</span>
        <input type="checkbox" class="photo-checkbox" disabled>
      </div>`;
    card.querySelector('.photo-checkbox').addEventListener('change', updateSelectedCount);
    card.querySelector('.delete-photo-btn').addEventListener('click', () => { card.remove(); updateSelectedCount(); });
    card.addEventListener('click', (e) => {
      if (e.target.classList.contains('delete-photo-btn')) return;
      const cb = card.querySelector('.photo-checkbox');
      if (!cb.disabled) { cb.checked = !cb.checked; updateSelectedCount(); }
    });
    photoGallery.appendChild(card);
  }

  function updateSelectedCount() {
    const MAX_SEL = getMaxSelections();
    const checked = document.querySelectorAll('.photo-checkbox:checked').length;
    const label = `${checked}/${MAX_SEL}`;
    if (selectedCount) selectedCount.textContent = label;
    if (selectedCountStat) selectedCountStat.textContent = label;
    if (checked > MAX_SEL) {
      selectionMessage.textContent = `Maximum ${MAX_SEL} photos!`;
      setTimeout(() => { selectionMessage.textContent = ''; }, 2000);
    } else {
      selectionMessage.textContent = checked === MAX_SEL ? 'Ready to download! 🎉' : '';
    }
    downloadButton.disabled = !(checked === MAX_SEL && !isSessionActive);
    document.querySelectorAll('.photo-card').forEach(c => {
      const cb = c.querySelector('.photo-checkbox');
      c.classList.toggle('selected', cb && cb.checked);
    });
  }

  function enableCheckboxes(enabled) {
    document.querySelectorAll('.photo-checkbox').forEach(cb => cb.disabled = !enabled);
  }

  // ── Reset ────────────────────────────────────────────────────
  function resetUI(clearPhotos = true) {
    isSessionActive = false;
    if (clearPhotos) { photoGallery.innerHTML = ''; photoCount = 0; }
    timerDisplay.textContent = PHOTO_COUNTDOWN;
    photoCountDisplay.textContent = photoCount;
    const lbl = `0/${getMaxSelections()}`;
    if (selectedCount) selectedCount.textContent = lbl;
    if (selectedCountStat) selectedCountStat.textContent = lbl;
    if (selectionMessage) selectionMessage.textContent = '';
    progressBar.style.width = '0%';
    startButton.classList.remove('hidden');
    restartButton.classList.add('hidden');
    downloadButton.disabled = true;
    filterButtons.forEach(b => b.classList.remove('active'));
    document.querySelector('[data-filter="none"]')?.classList.add('active');
    currentFilterKey = 'none';
    filterOpacity = 1.0;
    if (opacitySlider) { opacitySlider.value = 100; if (opacityValue) opacityValue.textContent = '100%'; }
    if (opacityRow) opacityRow.style.display = 'none';
    updateVideoFilter();
    enableCheckboxes(false);
    if (cameraHint && location.protocol !== 'file:') cameraHint.style.display = 'none';
  }

  // ── Collage ──────────────────────────────────────────────────
  async function downloadCollage() {
    const MAX_SEL = getMaxSelections();
    const checkedBoxes = document.querySelectorAll('.photo-checkbox:checked');
    if (checkedBoxes.length !== MAX_SEL) { showNotification(`Select exactly ${MAX_SEL} photos first! 🎯`); return; }

    const selectedImgEls = Array.from(checkedBoxes).map(cb => cb.closest('.photo-card').querySelector('img'));
    const layout = LAYOUTS[currentLayout] || LAYOUTS['2x2'];
    const isFilm = !!layout.isFilm;

    // Output canvas sizes (native resolution output)
    let cW, cH;
    if (isFilm)                       { cW = 1080; cH = 1920; }  // portrait film strip
    else if (currentLayout === '2x2') { cW = 2400; cH = 1350; }  // 16:9 landscape grid, high res
    else                              { cW = 3200; cH = 900;  }   // strip 4 ngang, ultra wide

    const finalCanvas = document.createElement('canvas');
    const fCtx = finalCanvas.getContext('2d');
    finalCanvas.width = cW; finalCanvas.height = cH;

    const loadedImgs = await Promise.all(selectedImgEls.map(img =>
      new Promise(res => {
        if (img.complete && img.naturalWidth) { res(img); return; }
        const tmp = new Image();
        tmp.onload = () => res(tmp);
        tmp.onerror = () => res(null);
        tmp.src = img.src;
      })
    ));

    if (isFilm)                       drawFilmLayout(fCtx, cW, cH, loadedImgs);
    else if (currentLayout === '2x2') drawGridLayout(fCtx, cW, cH, loadedImgs);
    else                              drawStripLayout(fCtx, cW, cH, loadedImgs);

    const a = document.createElement('a');
    a.href = finalCanvas.toDataURL('image/png', 1.0);
    a.download = `photobooth_${currentLayout}_${Date.now()}.png`;
    a.click();
    showNotification('Collage downloaded! 🎉');
  }

  // ── Frame helpers ────────────────────────────────────────────

  // Vẽ background đẹp kiểu hồng pastel có pattern chấm bi / lưới
  function drawPrettyBackground(fCtx, cW, cH, style) {
    // Base gradient
    if (style === 'warm') {
      const bg = fCtx.createLinearGradient(0, 0, cW, cH);
      bg.addColorStop(0,   '#ffd6e8');
      bg.addColorStop(0.5, '#ffb3d4');
      bg.addColorStop(1,   '#f9a8d4');
      fCtx.fillStyle = bg;
    } else if (style === 'soft') {
      const bg = fCtx.createLinearGradient(0, 0, cW, cH);
      bg.addColorStop(0,   '#ffe4f0');
      bg.addColorStop(0.4, '#fce7f3');
      bg.addColorStop(1,   '#fbcfe8');
      fCtx.fillStyle = bg;
    } else {
      // default pink
      const bg = fCtx.createLinearGradient(0, cH, cW, 0);
      bg.addColorStop(0,   '#fda4af');
      bg.addColorStop(0.5, '#f9a8d4');
      bg.addColorStop(1,   '#e879f9');
      fCtx.fillStyle = bg;
    }
    fCtx.fillRect(0, 0, cW, cH);

    // Dot pattern overlay
    const dotSpacing = Math.round(Math.min(cW, cH) * 0.04);
    const dotR = dotSpacing * 0.12;
    fCtx.fillStyle = 'rgba(255,255,255,0.22)';
    for (let x = dotSpacing; x < cW; x += dotSpacing) {
      for (let y = dotSpacing; y < cH; y += dotSpacing) {
        fCtx.beginPath();
        fCtx.arc(x, y, dotR, 0, Math.PI * 2);
        fCtx.fill();
      }
    }

    // Subtle corner decorations
    const cornerR = Math.min(cW, cH) * 0.08;
    fCtx.strokeStyle = 'rgba(255,255,255,0.35)';
    fCtx.lineWidth = Math.round(Math.min(cW, cH) * 0.005);
    // top-left corner arc
    fCtx.beginPath();
    fCtx.arc(0, 0, cornerR, 0, Math.PI * 0.5);
    fCtx.stroke();
    // top-right
    fCtx.beginPath();
    fCtx.arc(cW, 0, cornerR, Math.PI * 0.5, Math.PI);
    fCtx.stroke();
    // bottom-right
    fCtx.beginPath();
    fCtx.arc(cW, cH, cornerR, Math.PI, Math.PI * 1.5);
    fCtx.stroke();
    // bottom-left
    fCtx.beginPath();
    fCtx.arc(0, cH, cornerR, Math.PI * 1.5, Math.PI * 2);
    fCtx.stroke();
  }

  // ── Grid 2×2 ─────────────────────────────────────────────────
  function drawGridLayout(fCtx, cW, cH, imgs) {
    drawPrettyBackground(fCtx, cW, cH, 'soft');

    const pad = Math.round(cW * 0.032);
    const gap = Math.round(cW * 0.018);
    const cols = 2, rows = 2;
    const pW = cW - pad * 2, pH = cH - pad * 2;
    const cellW = (pW - gap) / 2;
    const cellH = (pH - gap) / 2;

    let idx = 0;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const img = imgs[idx++]; if (!img) continue;
        const x = pad + col * (cellW + gap);
        const y = pad + row * (cellH + gap);

        // Drop shadow under each cell
        fCtx.save();
        fCtx.shadowColor = 'rgba(0,0,0,0.18)';
        fCtx.shadowBlur  = gap * 2;
        fCtx.shadowOffsetY = gap * 0.5;
        fCtx.fillStyle = '#fff';
        fCtx.beginPath(); rr(fCtx, x, y, cellW, cellH, 10); fCtx.fill();
        fCtx.restore();

        // White polaroid-style border
        const bord = Math.round(cellW * 0.025);
        fCtx.fillStyle = '#fff';
        fCtx.beginPath(); rr(fCtx, x - bord, y - bord, cellW + bord * 2, cellH + bord * 2, 14); fCtx.fill();

        drawCell(fCtx, img, x, y, cellW, cellH, 8);
      }
    }

    // Logo bottom center
    const logoY = cH - pad * 0.5;
    fCtx.font = `bold ${Math.round(cH * 0.03)}px "Dancing Script", cursive`;
    fCtx.fillStyle = 'rgba(180,60,120,0.7)';
    fCtx.textAlign = 'center'; fCtx.textBaseline = 'bottom';
    fCtx.fillText('✨ PhotoBooth ✨', cW / 2, logoY);
  }

  // ── Strip 4 ngang (landscape) ────────────────────────────────
  function drawStripLayout(fCtx, cW, cH, imgs) {
    drawPrettyBackground(fCtx, cW, cH, 'warm');

    const rows  = 4;
    const padV  = Math.round(cH * 0.08);  // top/bottom padding
    const padH  = Math.round(cW * 0.016); // left/right padding
    const gap   = Math.round(cW * 0.014); // gap between photos

    const cellH = cH - padV * 2;
    const totalCellW = cW - padH * 2 - gap * (rows - 1);
    const cellW = Math.round(totalCellW / rows);

    for (let i = 0; i < rows; i++) {
      const img = imgs[i]; if (!img) continue;
      const x = padH + i * (cellW + gap);
      const y = padV;

      // White border (polaroid style)
      const bord = Math.round(cellH * 0.022);
      fCtx.save();
      fCtx.shadowColor = 'rgba(0,0,0,0.15)';
      fCtx.shadowBlur  = bord * 3;
      fCtx.shadowOffsetY = bord;
      fCtx.fillStyle = '#fff';
      fCtx.beginPath(); rr(fCtx, x - bord, y - bord, cellW + bord * 2, cellH + bord * 2 + bord * 1.5, 10); fCtx.fill();
      fCtx.restore();

      drawCell(fCtx, img, x, y, cellW, cellH, 6);

      // Little number sticker on bottom
      const numY = y + cellH + bord * 1.2;
      fCtx.font = `bold ${Math.round(bord * 1.8)}px "Poppins", sans-serif`;
      fCtx.fillStyle = 'rgba(200,80,130,0.7)';
      fCtx.textAlign = 'center'; fCtx.textBaseline = 'middle';
      fCtx.fillText(`${i + 1}`, x + cellW / 2, numY);
    }

    // Date + logo
    const now = new Date();
    const dateStr = now.toLocaleDateString('vi-VN', { year: 'numeric', month: 'short', day: 'numeric' });
    fCtx.font = `bold ${Math.round(cH * 0.07)}px "Dancing Script", cursive`;
    fCtx.fillStyle = 'rgba(180,60,120,0.65)';
    fCtx.textAlign = 'right'; fCtx.textBaseline = 'bottom';
    fCtx.fillText(`✨ PhotoBooth`, cW - padH, cH - Math.round(cH * 0.04));
    fCtx.font = `${Math.round(cH * 0.04)}px "Poppins", sans-serif`;
    fCtx.fillStyle = 'rgba(180,60,120,0.5)';
    fCtx.fillText(dateStr, cW - padH, cH - Math.round(cH * 0.01));
  }

  // ── Film 1×3 (portrait) ──────────────────────────────────────
  function drawFilmLayout(fCtx, cW, cH, imgs) {
    // Dark film base
    fCtx.fillStyle = '#1a1a1a'; fCtx.fillRect(0, 0, cW, cH);

    // Film edge strips
    const edgeW = Math.round(cW * 0.06);
    fCtx.fillStyle = '#111'; fCtx.fillRect(0, 0, edgeW, cH); fCtx.fillRect(cW - edgeW, 0, edgeW, cH);

    // Sprocket holes
    const hW = Math.round(edgeW * 0.55), hH = Math.round(hW * 0.6), hR = 3;
    const hCount = 22;
    fCtx.fillStyle = '#2a2a2a';
    for (let i = 0; i < hCount; i++) {
      const hy = (cH / hCount) * i + (cH / hCount) / 2 - hH / 2;
      fCtx.beginPath(); fCtx.roundRect(Math.round(edgeW * 0.2), hy, hW, hH, hR); fCtx.fill();
      fCtx.beginPath(); fCtx.roundRect(cW - edgeW + Math.round(edgeW * 0.25), hy, hW, hH, hR); fCtx.fill();
    }

    // Film label top
    fCtx.font = `bold ${Math.round(cW * 0.04)}px monospace`;
    fCtx.fillStyle = '#f5c518';
    fCtx.textAlign = 'center'; fCtx.textBaseline = 'middle';
    fCtx.fillText('PHOTOBOOTH  ✦  35mm', cW / 2, Math.round(cH * 0.022));

    // Photo cells
    const filmPad = edgeW + Math.round(cW * 0.02);
    const topPad  = Math.round(cH * 0.04);
    const botPad  = Math.round(cH * 0.04);
    const cellX   = filmPad;
    const cellW   = cW - filmPad * 2;
    const totalH  = cH - topPad - botPad;
    const rows = 3, gapY = Math.round(cH * 0.018);
    const cellH = (totalH - gapY * (rows - 1)) / rows;

    for (let i = 0; i < rows; i++) {
      const img = imgs[i];
      const y   = topPad + i * (cellH + gapY);

      if (!img) {
        fCtx.strokeStyle = '#333'; fCtx.lineWidth = 1;
        fCtx.strokeRect(cellX, y, cellW, cellH);
        continue;
      }

      // Subtle white border
      fCtx.fillStyle = 'rgba(255,255,255,0.05)';
      fCtx.fillRect(cellX - 2, y - 2, cellW + 4, cellH + 4);

      drawCell(fCtx, img, cellX, y, cellW, cellH, 4);

      // Frame number
      fCtx.font = `bold ${Math.round(cW * 0.03)}px monospace`;
      fCtx.fillStyle = '#f5c518';
      fCtx.textAlign = 'left'; fCtx.textBaseline = 'bottom';
      fCtx.fillText(`▲ ${i + 1}A`, cellX + 4, y - 3);
    }

    fCtx.font = `bold ${Math.round(cW * 0.035)}px monospace`;
    fCtx.fillStyle = '#555'; fCtx.textAlign = 'center'; fCtx.textBaseline = 'middle';
    fCtx.fillText('✨ PHOTOBOOTH ✨', cW / 2, cH - Math.round(cH * 0.018));
  }

  // ── drawCell — cover crop, no stretch ────────────────────────
  function drawCell(fCtx, img, x, y, cellW, cellH, radius) {
    fCtx.save();
    fCtx.beginPath(); rr(fCtx, x, y, cellW, cellH, radius); fCtx.clip();

    // Cover fit: maintain aspect ratio, crop to fill
    const imgRatio = img.naturalWidth / img.naturalHeight;
    const cRatio   = cellW / cellH;
    let sx, sy, sw, sh;
    if (imgRatio > cRatio) {
      // image is wider — crop sides
      sh = img.naturalHeight; sw = sh * cRatio;
      sx = (img.naturalWidth - sw) / 2; sy = 0;
    } else {
      // image is taller — crop top/bottom
      sw = img.naturalWidth; sh = sw / cRatio;
      sx = 0; sy = (img.naturalHeight - sh) / 2;
    }
    fCtx.drawImage(img, sx, sy, sw, sh, x, y, cellW, cellH);
    fCtx.restore();
  }

  function rr(c, x, y, w, h, r) {
    if (c.roundRect) { c.roundRect(x, y, w, h, r); return; }
    c.beginPath();
    c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.quadraticCurveTo(x + w, y, x + w, y + r);
    c.lineTo(x + w, y + h - r); c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    c.lineTo(x + r, y + h); c.quadraticCurveTo(x, y + h, x, y + h - r); c.lineTo(x, y + r);
    c.quadraticCurveTo(x, y, x + r, y); c.closePath();
  }

  function showNotification(msg) {
    const n = document.createElement('div');
    n.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,var(--primary),var(--secondary));color:#fff;padding:12px 28px;border-radius:50px;box-shadow:0 4px 20px rgba(0,0,0,0.25);z-index:9999;font-family:Poppins,sans-serif;font-weight:500;animation:nbIn 0.4s ease;white-space:nowrap;';
    n.textContent = msg; document.body.appendChild(n);
    setTimeout(() => { n.style.animation = 'nbOut 0.4s ease forwards'; setTimeout(() => n.remove(), 400); }, 3000);
  }

  function showError(msg) {
    const d = document.createElement('div');
    d.style.cssText = 'background:rgba(220,38,38,0.1);border:1px solid rgba(220,38,38,0.3);border-radius:12px;padding:16px 20px;margin:12px 0;white-space:pre-wrap;font-family:Poppins,sans-serif;font-size:14px;color:#ff8080;';
    d.textContent = msg;
    const b = document.querySelector('.booth-wrapper'), cont = document.querySelector('.container');
    if (cont && b) cont.insertBefore(d, b); else document.body.prepend(d);
  }

  const styleEl = document.createElement('style');
  styleEl.textContent = '@keyframes nbIn{from{opacity:0;transform:translate(-50%,-16px)}to{opacity:1;transform:translate(-50%,0)}} @keyframes nbOut{from{opacity:1;transform:translate(-50%,0)}to{opacity:0;transform:translate(-50%,-16px)}}';
  document.head.appendChild(styleEl);

  // ── Events ───────────────────────────────────────────────────
  startButton.addEventListener('click', startSession);
  restartButton.addEventListener('click', restartSession);
  downloadButton.addEventListener('click', downloadCollage);

  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilterKey = btn.dataset.filter;
      updateVideoFilter();
      if (opacityRow) opacityRow.style.display = currentFilterKey === 'none' ? 'none' : 'flex';
    });
  });

  if (opacitySlider) {
    opacitySlider.addEventListener('input', () => {
      filterOpacity = opacitySlider.value / 100;
      if (opacityValue) opacityValue.textContent = opacitySlider.value + '%';
      updateVideoFilter();
    });
  }

  // ── Init: show layout picker first ───────────────────────────
  showLayoutPicker();
  startCamera();
  resetUI(true);
});
