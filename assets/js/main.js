// Loaded in <head> without defer so the "js" class is set before the first paint.
document.documentElement.classList.add('js');

(function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.addEventListener('DOMContentLoaded', function () {
    trackTopbarHeight();
    revealSections();
    setupPaperToggles();
    setupCopyButtons();
    showPublishDate();
    pauseHeroWhenOffscreen();
    setupWaveDog();
  });

  // Keep --topbar-h up to date so anchor links land just below the sticky top bar.
  function trackTopbarHeight() {
    var bar = document.querySelector('.topbar');
    if (!bar) return;
    function update() {
      document.documentElement.style.setProperty('--topbar-h', bar.offsetHeight + 'px');
    }
    update();
    if ('ResizeObserver' in window) new ResizeObserver(update).observe(bar);
    else window.addEventListener('resize', update);
  }

  // Grow the bar under each section title the first time the section scrolls into view.
  function revealSections() {
    var sections = document.querySelectorAll('main section');
    if (reduceMotion || !('IntersectionObserver' in window)) {
      sections.forEach(function (s) { s.classList.add('in-view'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px' });
    sections.forEach(function (s) { io.observe(s); });
  }

  // Abstract / BibTeX buttons. Only one panel per paper is open at a time.
  function setupPaperToggles() {
    function panelOf(btn) { return document.getElementById(btn.getAttribute('aria-controls')); }
    document.querySelectorAll('.pub-toggle').forEach(function (btn) {
      if (!panelOf(btn)) return;
      btn.addEventListener('click', function () {
        var panel = panelOf(btn);
        var opening = panel.hidden;
        btn.parentElement.querySelectorAll('.pub-toggle').forEach(function (other) {
          var p = panelOf(other);
          if (p) p.hidden = true;
          other.setAttribute('aria-expanded', 'false');
        });
        panel.hidden = !opening;
        btn.setAttribute('aria-expanded', String(opening));
      });
    });
  }

  // Copy buttons in the BibTeX panels.
  function setupCopyButtons() {
    document.querySelectorAll('.copy-btn').forEach(function (btn) {
      var pre = btn.parentElement.querySelector('pre');
      if (!pre) return;
      var resetTimer = null;
      btn.addEventListener('click', function () {
        var text = pre.textContent;
        function done() {
          btn.textContent = 'Copied!';
          clearTimeout(resetTimer);
          resetTimer = setTimeout(function () { btn.textContent = 'Copy'; }, 1500);
        }
        // For older browsers or pages not served over HTTPS.
        function fallback() {
          var area = document.createElement('textarea');
          area.value = text;
          area.setAttribute('readonly', '');
          area.style.position = 'fixed';
          area.style.opacity = '0';
          document.body.appendChild(area);
          area.select();
          try { if (document.execCommand('copy')) done(); } catch (e) { /* ignore */ }
          document.body.removeChild(area);
        }
        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(text).then(done, fallback);
        } else {
          fallback();
        }
      });
    });
  }

  // Footer month and year follow the page's publish date. The text in the HTML is the fallback.
  function showPublishDate() {
    var when = new Date(document.lastModified);
    if (isNaN(when.getTime())) return;
    var month = document.querySelector('[data-last-updated]');
    var year = document.querySelector('[data-published-year]');
    if (month) month.textContent = when.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    if (year) year.textContent = String(when.getFullYear());
  }

  // Pause the hero animations while the hero is off screen.
  function pauseHeroWhenOffscreen() {
    var hero = document.querySelector('.hero');
    if (!hero || !('IntersectionObserver' in window)) return;
    new IntersectionObserver(function (entries) {
      hero.classList.toggle('is-offscreen', !entries[0].isIntersecting);
    }).observe(hero);
  }

  // The dog riding the front wave. It only moves up and down (with a small tilt)
  // and stays below the photo, or below the buttons on phones.
  function setupWaveDog() {
    var hero = document.querySelector('.hero');
    var wrap = document.querySelector('.avatar-wrap');
    if (!hero || !wrap) return;

    var dog = document.createElement('span');
    dog.className = 'wave-dog';
    dog.setAttribute('aria-hidden', 'true');
    hero.appendChild(dog);

    var phone = window.matchMedia('(max-width: 720px)');
    var PAW_Y = 0.97;      // paws are at 97% of the image height
    var MIN_SINK = 4;      // paws sit at least this far below the wave surface
    var GAP = 6;           // min gap below the photo / buttons
    var TILT = 0.45;       // how much of the wave's slope the dog tilts with
    var EDGE = 24;         // desktop: dog's right edge sits this far right of the photo
    var SIDE = 4;          // but always at least this far inside the card, even tilted
    var PHONE_RIGHT = 74;  // phone: dog's center sits this far from the card's right edge

    // Must match --wave in style.css: WAVE_COPIES copies of
    // "M0 50 Q100 25 200 50 T400 50 T600 50 T800 50" in a 100-unit-tall viewBox.
    var CREST = 0.375;     // highest point, as a fraction of the band height
    var TROUGH = 0.625;    // lowest point
    var BOB = 6;           // wave-bob in style.css moves the wave down by up to 6px
    var WAVE_COPIES = 4;

    // Height and slope of the wave surface at x.
    function surface(x, offset, tile, bandH) {
      var u = ((x - offset) % tile + tile) % tile;
      var X = u / tile * 800;
      var k = Math.floor(X / 200);
      var s = (X - k * 200) / 200;
      var c = k % 2 === 0 ? 25 : 75;
      var y = 50 + 2 * s * (1 - s) * (c - 50);
      var dyds = 2 * (1 - 2 * s) * (c - 50);
      return { y: y / 100 * bandH, slope: (dyds / 100 * bandH) / (200 / 800 * tile) };
    }

    // Sizes only change on resize, so they are measured then instead of every frame.
    var layout = null;
    function measure() {
      var box = hero.getBoundingClientRect();
      var left = box.left + hero.clientLeft, top = box.top + hero.clientTop;
      var w = dog.offsetWidth, h = dog.offsetHeight;
      var x, obstacle;
      if (phone.matches) {
        x = hero.clientWidth - PHONE_RIGHT;
        obstacle = 0;
        hero.querySelectorAll('.links .pill').forEach(function (p) {
          obstacle = Math.max(obstacle, p.getBoundingClientRect().bottom - top);
        });
      } else {
        var photo = wrap.getBoundingClientRect();
        x = photo.right - left + EDGE - w / 2;
        obstacle = photo.bottom - top;
      }
      var band = getComputedStyle(hero, '::after');
      var bandH = parseFloat(band.height) || 96;
      var tile = (parseFloat(band.maskSize || band.webkitMaskSize) || 2080) / WAVE_COPIES;
      var bandTop = hero.clientHeight - bandH;

      // Keep the right edge inside the card at the steepest tilt (the wave is steepest at x = 0).
      var maxTilt = Math.atan(Math.abs(surface(0, 0, tile, bandH).slope)) * TILT;
      var reach = w / 2 * Math.cos(maxTilt) + h * PAW_Y * Math.sin(maxTilt);
      x = Math.min(x, hero.clientWidth - reach - SIDE);

      // Sink deep enough to clear the photo at the highest crest, but not so deep that
      // the dog leaves the card at the lowest trough. If both can't hold, stay inside.
      var highestTop = bandTop + CREST * bandH - h * PAW_Y;
      var lowestBottom = bandTop + TROUGH * bandH + BOB + h * (1 - PAW_Y);
      var clearPhoto = Math.max(MIN_SINK, obstacle + GAP - highestTop);
      var stayInside = hero.clientHeight - 2 - lowestBottom;
      layout = {
        x: x, w: w, h: h, bandH: bandH, tile: tile, bandTop: bandTop,
        sink: Math.min(clearPhoto, stayInside)
      };
    }

    // Vertical offset of a computed transform. Parsed as a matrix because tiny values
    // come back in exponent form (e.g. "7.8e-06").
    function translateY(transform) {
      if (!transform || transform === 'none') return 0;
      if (window.DOMMatrixReadOnly) return new DOMMatrixReadOnly(transform).m42;
      var nums = transform.match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi);
      return nums && nums.length >= 6 ? parseFloat(nums[5]) : 0;
    }

    function place() {
      if (!layout) measure();
      var band = getComputedStyle(hero, '::after');
      var offset = parseFloat(band.maskPosition || band.webkitMaskPosition) || 0;
      var bob = translateY(band.transform);
      var surf = surface(layout.x, offset, layout.tile, layout.bandH);
      var y = layout.bandTop + surf.y + bob - layout.h * PAW_Y + layout.sink;
      var angle = Math.atan(surf.slope) * 180 / Math.PI * TILT;
      dog.style.transform = 'translate(' + (layout.x - layout.w / 2) + 'px,' + y + 'px) rotate(' + angle.toFixed(2) + 'deg)';
    }

    // Animate only while the hero is on screen.
    var running = false;
    function loop() {
      if (!running) return;
      place();
      requestAnimationFrame(loop);
    }
    function start() { if (!running && !reduceMotion) { running = true; requestAnimationFrame(loop); } }
    function stop() { running = false; }

    // Re-measure when the hero changes size (resize, fonts or the photo loading).
    function relayout() { measure(); place(); }
    relayout();
    if ('ResizeObserver' in window) new ResizeObserver(relayout).observe(hero);
    window.addEventListener('resize', relayout);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout);
    window.addEventListener('load', relayout);
    if (reduceMotion) return;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) start(); else stop();
      }).observe(hero);
    } else {
      start();
    }
  }
})();
