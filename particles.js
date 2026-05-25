/**
 * particles.js — Antigravity-style dot grid effect
 *
 * Faithfully recreates the Google Antigravity dot grid:
 *   - Precise, uniform dot grid (not random)
 *   - Cursor reveals & illuminates nearby dots (radial falloff)
 *   - Dots softly repel from cursor (antigravity displacement)
 *   - Smooth underglow beneath cursor
 *   - 60fps requestAnimationFrame loop
 *   - Dark/Light mode aware
 */

(function () {
    'use strict';

    const canvas = document.getElementById('particle-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    let width = 0, height = 0;
    let mouseX = -9999, mouseY = -9999;
    let animId;
    let dots = [];
    let dpr = 1;

    // ── Configuration ──────────────────────────────────────────────────
    const CFG = {
        spacing: 28,            // Slightly tighter grid for more detail
        dotRadius: 1.8,         // Slightly larger peak dot radius
        baseAlpha: 0.0,         // COMPLETELY HIDDEN by default
        peakAlpha: 0.70,        // Softer reveal
        influenceR: 240,        // Larger influence for a "smoother" reveal
        repelR: 120,            // Larger repel for more "antigravity" feel
        maxRepel: 18,           // More dramatic push
        repelFalloff: 2.5,
        returnSpeed: 0.08,      // Slower return for more "liquid" feel
        glowR: 400,             // More atmospheric underglow
        glowPeak: 0.08,
        glowMidStop: 0.5,
        glowMidAlpha: 0.03,
    };

    // ── Dot object factory ─────────────────────────────────────────────
    function buildGrid(w, h) {
        const list = [];
        const colsExtra = Math.ceil(w / CFG.spacing) + 2;
        const rowsExtra = Math.ceil(h / CFG.spacing) + 2;
        const offX = (w - (colsExtra - 1) * CFG.spacing) / 2;
        const offY = (h - (rowsExtra - 1) * CFG.spacing) / 2;

        for (let row = 0; row < rowsExtra; row++) {
            for (let col = 0; col < colsExtra; col++) {
                const bx = offX + col * CFG.spacing;
                const by = offY + row * CFG.spacing;
                list.push({
                    bx,       // base (resting) x
                    by,       // base (resting) y
                    cx: bx,   // current x (animated)
                    cy: by,   // current y (animated)
                });
            }
        }
        return list;
    }

    // ── Resize ─────────────────────────────────────────────────────────
    function resize() {
        const hero = canvas.parentElement;
        width  = hero.offsetWidth;
        height = hero.offsetHeight;
        dpr    = Math.min(window.devicePixelRatio || 1, 2);

        canvas.width  = width  * dpr;
        canvas.height = height * dpr;
        canvas.style.width  = width  + 'px';
        canvas.style.height = height + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        dots = buildGrid(width, height);
    }

    // ── Theme helpers ──────────────────────────────────────────────────
    function isLight() {
        return document.documentElement.getAttribute('data-theme') === 'light';
    }

    // ── Render loop ────────────────────────────────────────────────────
    function render() {
        ctx.clearRect(0, 0, width, height);

        const light = isLight();

        // --- 1. Underglow: soft radial gradient that follows cursor ----
        if (mouseX > -1000) {
            const g = ctx.createRadialGradient(
                mouseX, mouseY, 0,
                mouseX, mouseY, CFG.glowR
            );
            if (light) {
                g.addColorStop(0,                  `rgba(0, 102, 210, ${CFG.glowPeak})`);
                g.addColorStop(CFG.glowMidStop,    `rgba(0,  80, 200, ${CFG.glowMidAlpha})`);
                g.addColorStop(1,                   'rgba(0, 0, 0, 0)');
            } else {
                g.addColorStop(0,                  `rgba(100, 180, 255, ${CFG.glowPeak})`);
                g.addColorStop(CFG.glowMidStop,    `rgba( 60, 140, 255, ${CFG.glowMidAlpha})`);
                g.addColorStop(1,                   'rgba(0, 0, 0, 0)');
            }
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, width, height);
        }

        // --- 2. Dots ---------------------------------------------------
        for (let i = 0; i < dots.length; i++) {
            const d = dots[i];

            // Distance from dot's *base* position to mouse
            const dx = d.bx - mouseX;
            const dy = d.by - mouseY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // --- Repulsion (antigravity displacement) ---
            if (mouseX > -1000 && dist < CFG.repelR) {
                const t = 1 - dist / CFG.repelR;
                const force = Math.pow(t, CFG.repelFalloff) * CFG.maxRepel;
                const angle = Math.atan2(dy, dx);
                const targetX = d.bx + Math.cos(angle) * force;
                const targetY = d.by + Math.sin(angle) * force;
                d.cx += (targetX - d.cx) * 0.25;
                d.cy += (targetY - d.cy) * 0.25;
            } else {
                // Ease back to resting position
                d.cx += (d.bx - d.cx) * CFG.returnSpeed;
                d.cy += (d.by - d.cy) * CFG.returnSpeed;
            }

            // --- Illumination falloff (reveal) ---
            const rawIllum = mouseX > -1000
                ? Math.max(0, 1 - dist / CFG.influenceR)
                : 0;
            
            // Apply a power curve for a more "morphing" feel
            const illum = Math.pow(rawIllum, 1.5);

            const alpha  = CFG.baseAlpha + illum * (CFG.peakAlpha - CFG.baseAlpha);
            const radius = illum * CFG.dotRadius;

            // --- Underglow Refinement (DPR aware) ---
            let r, g, b;
            if (light) {
                r = Math.round(lerp(100,  40,  illum));
                g = Math.round(lerp(100, 150,  illum));
                b = Math.round(lerp(100, 255,  illum));
            } else {
                r = Math.round(lerp(255, 120,  illum));
                g = Math.round(lerp(255, 180,  illum));
                b = Math.round(lerp(255, 255,  illum));
            }

            // --- Drawing (Morphing shapes) ---
            ctx.beginPath();
            
            // Randomly draw a plus sign for every 10th dot to add "things"
            if (i % 10 === 0) {
                const len = radius * 1.5;
                ctx.moveTo(d.cx - len, d.cy);
                ctx.lineTo(d.cx + len, d.cy);
                ctx.moveTo(d.cx, d.cy - len);
                ctx.lineTo(d.cx, d.cy + len);
                ctx.lineWidth = radius * 0.5;
                ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
                ctx.stroke();
            } else {
                ctx.arc(d.cx, d.cy, radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
                ctx.fill();
            }
        }

        animId = requestAnimationFrame(render);
    }

    function lerp(a, b, t) { return a + (b - a) * t; }

    // ── Mouse / touch tracking ─────────────────────────────────────────
    function onMove(e) {
        const rect = canvas.getBoundingClientRect();
        const src  = e.touches ? e.touches[0] : e;
        mouseX = src.clientX - rect.left;
        mouseY = src.clientY - rect.top;
    }

    function onLeave() {
        mouseX = -9999;
        mouseY = -9999;
    }

    // Also track mouse across the whole page so the glow "enters" from
    // outside the hero before the cursor is detected on the canvas
    function onPageMove(e) {
        if (!canvas.parentElement) return;
        const rect = canvas.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
    }

    // ── Init ───────────────────────────────────────────────────────────
    function init() {
        resize();

        window.addEventListener('resize', () => {
            cancelAnimationFrame(animId);
            resize();
            render();
        });

        // hero-level listeners for mouse leave
        canvas.parentElement.addEventListener('mouseleave', onLeave);
        canvas.parentElement.addEventListener('touchstart', onMove, { passive: true });
        canvas.parentElement.addEventListener('touchmove',  onMove, { passive: true });
        canvas.parentElement.addEventListener('touchend',   onLeave);

        // Full-window move so glow tracks even before entering hero
        window.addEventListener('mousemove', onPageMove);

        render();
    }

    // Boot
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
