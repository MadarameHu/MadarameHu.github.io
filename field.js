(() => {
  'use strict';

  const canvas = document.querySelector('.intelligence-field');
  if (!canvas || typeof canvas.getContext !== 'function') return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const compactViewport = window.matchMedia('(max-width: 680px)');
  const frameInterval = 1000 / 30;
  const tau = Math.PI * 2;
  const green = [196, 255, 99];
  const silver = [191, 205, 198];

  let width = 0;
  let height = 0;
  let pixelRatio = 1;
  let compact = compactViewport.matches;
  let points = [];
  let guideLoops = [];
  let frameId = 0;
  let lastPaint = 0;
  let elapsed = 0;
  let visible = !('IntersectionObserver' in window);

  // A regular toroidal lattice gives the field a readable structure, without noise.
  function torusPoint(majorAngle, minorAngle) {
    const radius = 1 + 0.31 * Math.cos(minorAngle);
    return {
      x: radius * Math.cos(majorAngle),
      y: radius * Math.sin(majorAngle),
      z: 0.31 * Math.sin(minorAngle)
    };
  }

  function buildGeometry() {
    const majorSteps = compact ? 48 : 80;
    const minorSteps = compact ? 12 : 18;
    points = [];
    guideLoops = [];

    for (let row = 0; row < minorSteps; row += 1) {
      const minorAngle = (row / minorSteps) * tau;
      for (let column = 0; column < majorSteps; column += 1) {
        const majorAngle = ((column + (row % 2) * 0.5) / majorSteps) * tau;
        points.push({
          ...torusPoint(majorAngle, minorAngle),
          majorAngle,
          minorAngle,
          accent: row === 1 || row === Math.floor(minorSteps / 2) + 1,
          screenX: 0,
          screenY: 0,
          depth: 0,
          perspective: 1
        });
      }
    }

    // Three faint latitude loops connect the points without becoming a wireframe.
    for (const minorAngle of [0, Math.PI, Math.PI * 1.5]) {
      const loop = [];
      for (let index = 0; index <= 96; index += 1) {
        loop.push(torusPoint((index / 96) * tau, minorAngle));
      }
      guideLoops.push(loop);
    }
  }

  function draw() {
    if (width <= 0 || height <= 0) return;
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const tilt = 0.92 + Math.sin(elapsed * 0.13) * 0.11;
    const turn = 0.27 + Math.sin(elapsed * 0.09) * 0.3;
    const spin = -0.42 + elapsed * 0.055;
    const cosTilt = Math.cos(tilt);
    const sinTilt = Math.sin(tilt);
    const cosTurn = Math.cos(turn);
    const sinTurn = Math.sin(turn);
    const cosSpin = Math.cos(spin);
    const sinSpin = Math.sin(spin);
    const scale = Math.min(width * 0.3, height * 0.39);
    const centerX = width * 0.5;
    const centerY = height * 0.5;

    function project(point, target) {
      const rotatedX = point.x * cosSpin - point.y * sinSpin;
      const rotatedY = point.x * sinSpin + point.y * cosSpin;
      const tiltedY = rotatedY * cosTilt - point.z * sinTilt;
      const tiltedZ = rotatedY * sinTilt + point.z * cosTilt;
      const finalX = rotatedX * cosTurn + tiltedZ * sinTurn;
      const finalZ = -rotatedX * sinTurn + tiltedZ * cosTurn;
      const perspective = 4.6 / (4.6 + finalZ);
      target.screenX = centerX + finalX * scale * perspective;
      target.screenY = centerY + tiltedY * scale * perspective;
      target.depth = finalZ;
      target.perspective = perspective;
    }

    ctx.lineWidth = 0.65;
    ctx.strokeStyle = 'rgba(196, 255, 99, 0.075)';
    const guidePoint = {};
    for (const loop of guideLoops) {
      ctx.beginPath();
      for (let index = 0; index < loop.length; index += 1) {
        project(loop[index], guidePoint);
        if (index === 0) ctx.moveTo(guidePoint.screenX, guidePoint.screenY);
        else ctx.lineTo(guidePoint.screenX, guidePoint.screenY);
      }
      ctx.stroke();
    }

    for (const point of points) project(point, point);
    points.sort((a, b) => b.depth - a.depth);

    for (const point of points) {
      const depth = Math.max(0, Math.min(1, (1.35 - point.depth) / 2.7));
      const sweep = Math.pow(
        (Math.cos(point.majorAngle * 2 - point.minorAngle + elapsed * 0.18) + 1) / 2,
        8
      );
      const highlight = point.accent || sweep > 0.77;
      const color = highlight ? green : silver;
      const opacity = Math.min(0.96, 0.2 + depth * 0.5 + (highlight ? 0.2 : 0));
      const radius = (compact ? 0.77 : 0.64) * point.perspective
        + depth * 0.34 + (point.accent ? 0.14 : 0);

      ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${opacity})`;
      ctx.beginPath();
      ctx.arc(point.screenX, point.screenY, radius, 0, tau);
      ctx.fill();
    }
  }

  function canAnimate() {
    return visible && !document.hidden && !motionPreference.matches
      && width > 0 && height > 0;
  }

  function tick(timestamp) {
    frameId = 0;
    if (!canAnimate()) return;

    if (lastPaint === 0) lastPaint = timestamp;
    const delta = timestamp - lastPaint;
    if (delta >= frameInterval) {
      elapsed += Math.min(delta, 100) / 1000;
      lastPaint = timestamp;
      draw();
    }
    frameId = window.requestAnimationFrame(tick);
  }

  function syncAnimation() {
    if (frameId) window.cancelAnimationFrame(frameId);
    frameId = 0;
    lastPaint = 0;
    if (canAnimate()) frameId = window.requestAnimationFrame(tick);
  }

  function resize() {
    const bounds = canvas.getBoundingClientRect();
    const nextWidth = Math.max(0, bounds.width);
    const nextHeight = Math.max(0, bounds.height);
    const nextRatio = Math.min(window.devicePixelRatio || 1, 1.5);
    const nextCompact = compactViewport.matches;
    if (nextWidth === width && nextHeight === height
      && nextRatio === pixelRatio && nextCompact === compact && points.length) return;

    width = nextWidth;
    height = nextHeight;
    pixelRatio = nextRatio;
    if (nextCompact !== compact || !points.length) {
      compact = nextCompact;
      buildGeometry();
    }
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    draw();
    syncAnimation();
  }

  function onMotionPreferenceChange() {
    // A reduced-motion visitor always receives the same composed static frame.
    if (motionPreference.matches) {
      elapsed = 0;
      draw();
    }
    syncAnimation();
  }

  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);
  window.addEventListener('resize', resize, { passive: true });
  document.addEventListener('visibilitychange', syncAnimation);
  if (typeof motionPreference.addEventListener === 'function') {
    motionPreference.addEventListener('change', onMotionPreferenceChange);
  } else {
    motionPreference.addListener(onMotionPreferenceChange);
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      visible = entries.some((entry) => entry.isIntersecting && entry.intersectionRatio > 0);
      syncAnimation();
    }, { threshold: 0.01 }).observe(canvas);
  }

  resize();
})();
