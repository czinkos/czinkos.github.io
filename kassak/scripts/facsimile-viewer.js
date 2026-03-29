document.addEventListener('DOMContentLoaded', () => {
  const dataElement = document.getElementById('facsimile-data');
  const viewerElement = document.getElementById('osd-viewer');
  const galleryElement = document.getElementById('facsimile-gallery');
  const teiContainer = document.querySelector('.tei-container');
  const fragmentOverlay = document.getElementById('image-fragment-overlay');
  const fragmentImg = document.getElementById('fragment-img');
  const tooltip = document.getElementById('facsimile-tooltip');

  if (!dataElement || !teiContainer) return;

  const facsimiles = JSON.parse(dataElement.textContent);
  if (!facsimiles || facsimiles.length === 0) {
    if (galleryElement) galleryElement.innerHTML = '<p class="text-xs italic text-gray-400">Nincs elérhető fakszimilé.</p>';
    if (viewerElement) viewerElement.classList.add('hidden');
    return;
  }

  let viewer = null;
  let activeOverlays = [];

  // Map zoneId to the line element
  const zoneToLine = {};
  document.querySelectorAll('.line[data-facs]').forEach(line => {
    zoneToLine[line.getAttribute('data-facs')] = line;
  });

  // Function to safely change page and update UI
  const goToPage = (index, onReady) => {
    if (!viewer) return;
    if (viewer.currentPageIndex === index) {
      if (onReady) onReady();
      return;
    }
    
    const openHandler = () => {
      viewer.removeHandler('open', openHandler);
      drawZones(index);
      if (onReady) onReady();
    };
    viewer.addHandler('open', openHandler);
    
    viewer.open({
      type: 'image',
      url: facsimiles[index].url
    });
    viewer.currentPageIndex = index;

    if (galleryElement) {
      const thumbs = galleryElement.querySelectorAll('.facsimile-thumb');
      thumbs.forEach((t, i) => {
        if (i === index) {
          t.classList.add('border-black');
          t.classList.remove('border-transparent');
        } else {
          t.classList.remove('border-black');
          t.classList.add('border-transparent');
        }
      });
    }
  };

  const drawZones = (index) => {
    if (!viewer) return;
    
    // Clear old overlays
    activeOverlays.forEach(o => viewer.removeOverlay(o));
    activeOverlays = [];

    const mode = teiContainer.getAttribute('data-mode');
    if (mode !== 'full-facsimile') return;

    const facs = facsimiles[index];
    Object.keys(facs.zones).forEach(zoneId => {
      const zone = facs.zones[zoneId];
      const normX = zone.ulx / facs.lrx;
      const normY = zone.uly / facs.lrx;
      const normW = (zone.lrx - zone.ulx) / facs.lrx;
      const normH = (zone.lry - zone.uly) / facs.lrx;

      const overlayEl = document.createElement('div');
      overlayEl.className = 'osd-zone-overlay cursor-pointer transition-colors hover:bg-black/10';
      overlayEl.dataset.zoneId = zoneId;

      viewer.addOverlay({
        element: overlayEl,
        location: new OpenSeadragon.Rect(normX, normY, normW, normH)
      });
      activeOverlays.push(overlayEl);

      overlayEl.addEventListener('mouseenter', (e) => {
        const line = zoneToLine[zoneId];
        if (line) {
          const content = line.querySelector('.line-content').innerHTML;
          tooltip.innerHTML = content;
          tooltip.style.display = 'block';
          
          const updateTooltip = (ev) => {
            tooltip.style.left = (ev.clientX + 20) + 'px';
            tooltip.style.top = (ev.clientY + 20) + 'px';
          };
          window.addEventListener('mousemove', updateTooltip);
          overlayEl._updateTooltip = updateTooltip;
        }
      });

      overlayEl.addEventListener('mouseleave', () => {
        tooltip.style.display = 'none';
        if (overlayEl._updateTooltip) {
          window.removeEventListener('mousemove', overlayEl._updateTooltip);
        }
      });
    });
  };

  const initOSD = () => {
    if (viewer) return;
    try {
      viewer = OpenSeadragon({
        id: "osd-viewer",
        prefixUrl: "/scripts/osd-images/",
        tileSources: {
          type: 'image',
          url: facsimiles[0].url,
          buildPyramid: false
        },
        showPaginationControl: false,
        showNavigationControl: true,
        gestureSettingsMouse: { clickToZoom: true }
      });
      viewer.currentPageIndex = 0;
      viewer.addHandler('open', () => drawZones(viewer.currentPageIndex));
    } catch (e) { console.error("OSD Init Failed:", e); }
  };

  const updateMode = (mode) => {
    teiContainer.setAttribute('data-mode', mode);
    if (mode === 'side-by-side' || mode === 'full-facsimile') {
      if (!viewer) {
        requestAnimationFrame(() => requestAnimationFrame(() => initOSD()));
      } else {
        requestAnimationFrame(() => {
          viewer.viewport.resize();
          viewer.viewport.goHome();
          drawZones(viewer.currentPageIndex);
        });
      }
    }
    fragmentOverlay.style.display = 'none';
    tooltip.style.display = 'none';
  };

  const modeTabs = document.querySelectorAll('.mode-tab');
  modeTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      modeTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      updateMode(tab.getAttribute('data-mode'));
    });
  });

  // Render Thumbnails
  if (galleryElement) {
    galleryElement.innerHTML = '';
    facsimiles.forEach((facs, index) => {
      const thumb = document.createElement('div');
      thumb.className = `facsimile-thumb cursor-pointer border-2 transition-all ${index === 0 ? 'border-black' : 'border-transparent'}`;
      const img = document.createElement('img');
      img.src = facs.url;
      img.className = 'w-full h-auto grayscale hover:grayscale-0 transition-all';
      thumb.appendChild(img);
      galleryElement.appendChild(thumb);
      thumb.addEventListener('click', () => {
        const mode = teiContainer.getAttribute('data-mode');
        if (mode !== 'side-by-side' && mode !== 'full-facsimile') {
          const sbsTab = document.querySelector('[data-mode="side-by-side"]');
          modeTabs.forEach(t => t.classList.remove('active'));
          sbsTab.classList.add('active');
          updateMode('side-by-side');
          setTimeout(() => goToPage(index), 150);
        } else {
          goToPage(index);
        }
      });
    });
  }

  // Hover sync from Text to Facsimile
  const zoneToPage = {};
  facsimiles.forEach((facs, index) => {
    Object.keys(facs.zones).forEach(zoneId => { zoneToPage[zoneId] = index; });
  });

  const lines = document.querySelectorAll('.line[data-facs]');
  let currentOSDOverlay = null;

  lines.forEach(line => {
    line.addEventListener('mouseenter', (e) => {
      const mode = teiContainer.getAttribute('data-mode');
      if (mode === 'full-facsimile') return;

      const zoneId = line.getAttribute('data-facs');
      const pageIndex = zoneToPage[zoneId];
      if (pageIndex === undefined) return;
      const facs = facsimiles[pageIndex];
      const zone = facs.zones[zoneId];
      if (!zone) return;

      if (mode === 'side-by-side' && viewer) {
        goToPage(pageIndex, () => {
          const normX = zone.ulx / facs.lrx;
          const normY = zone.uly / facs.lrx;
          const normW = (zone.lrx - zone.ulx) / facs.lrx;
          const normH = (zone.lry - zone.uly) / facs.lrx;
          if (currentOSDOverlay) viewer.removeOverlay(currentOSDOverlay);
          currentOSDOverlay = document.createElement('div');
          currentOSDOverlay.className = 'osd-line-highlight border-2 border-black bg-black/5 pointer-events-none';
          viewer.addOverlay({ element: currentOSDOverlay, location: new OpenSeadragon.Rect(normX, normY, normW, normH) });
          viewer.viewport.fitBounds(new OpenSeadragon.Rect(normX, normY, normW, normH), false);
        });
      } else if (mode !== 'side-by-side') {
        fragmentImg.src = facs.url;
        const scale = window.innerWidth / facs.lrx;
        fragmentImg.style.width = window.innerWidth + 'px';
        fragmentOverlay.style.display = 'block';
        if (mode === 'stripe-hover') {
          const rect = line.getBoundingClientRect();
          const stripeH = (zone.lry - zone.uly) * scale;
          fragmentOverlay.style.height = stripeH + 'px';
          fragmentOverlay.style.top = (rect.top - stripeH) + 'px';
          fragmentImg.style.marginTop = -(zone.uly * scale) + 'px';
          
          // Reset curtains
          const curtainTop = document.getElementById('context-curtain-top');
          const curtainBottom = document.getElementById('context-curtain-bottom');
          if (curtainTop && curtainBottom) {
            curtainTop.style.height = '0';
            curtainBottom.style.height = '0';
          }
        } else if (mode === 'context-hover') {
          const contextH = 256;
          fragmentOverlay.style.height = contextH + 'px';
          const lineCenterY = (zone.uly + zone.lry) / 2;
          const marginTop = -(lineCenterY * scale) + (contextH / 2);
          fragmentImg.style.marginTop = marginTop + 'px';
          fragmentOverlay.style.top = e.clientY > window.innerHeight / 2 ? '0' : 'auto';
          fragmentOverlay.style.bottom = e.clientY > window.innerHeight / 2 ? 'auto' : '0';

          // Update curtains
          const curtainTop = document.getElementById('context-curtain-top');
          const curtainBottom = document.getElementById('context-curtain-bottom');
          if (curtainTop && curtainBottom) {
            const lineTopInOverlay = (zone.uly * scale) + marginTop;
            const lineBottomInOverlay = (zone.lry * scale) + marginTop;
            curtainTop.style.height = Math.max(0, lineTopInOverlay) + 'px';
            curtainBottom.style.height = Math.max(0, contextH - lineBottomInOverlay) + 'px';
          }
        }
      }
      line.classList.add('bg-black/5');
    });

    line.addEventListener('mouseleave', () => {
      line.classList.remove('bg-black/5');
      fragmentOverlay.style.display = 'none';
      if (currentOSDOverlay && viewer) {
        viewer.removeOverlay(currentOSDOverlay);
        currentOSDOverlay = null;
      }
    });
  });
});
