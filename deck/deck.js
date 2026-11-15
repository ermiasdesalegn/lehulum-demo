(function () {
  'use strict';
  var slides = Array.prototype.slice.call(document.querySelectorAll('.slide'));
  var counter = document.getElementById('counter');
  var prev = document.getElementById('prev');
  var next = document.getElementById('next');
  var index = 0;
  slides.forEach(function (s, k) {
    var st = s.querySelector('.stage');
    if (st) { st.setAttribute('data-n', (k + 1) + ' / ' + slides.length); }
  });

  function fromHash() {
    var n = parseInt((location.hash || '').replace('#', ''), 10);
    return n >= 1 && n <= slides.length ? n - 1 : 0;
  }

  function show(i, moveFocus) {
    index = Math.max(0, Math.min(slides.length - 1, i));
    slides.forEach(function (s, k) {
      s.classList.toggle('is-current', k === index);
      if (k === index) { s.removeAttribute('hidden'); } else { s.setAttribute('hidden', ''); }
    });
    var h = slides[index].querySelector('h1, h2');
    counter.textContent = 'Slide ' + (index + 1) + ' of ' + slides.length + ': ' + (h ? h.textContent : '');
    var bar = document.getElementById('bar');
    if (bar) { bar.max = slides.length; bar.value = index + 1; }
    prev.disabled = index === 0;
    next.disabled = index === slides.length - 1;
    try { history.replaceState(null, '', '#' + (index + 1)); } catch (e) { /* file: pages may refuse */ }
    document.title = (h ? h.textContent + ' | ' : '') + 'Lehulum pitch deck';
    if (moveFocus && h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: false }); }
    window.scrollTo(0, 0);
  }

  prev.addEventListener('click', function () { show(index - 1, true); });
  next.addEventListener('click', function () { show(index + 1, true); });

  document.addEventListener('keydown', function (e) {
    if (e.altKey || e.ctrlKey || e.metaKey) { return; }
    var t = e.target;
    // Leave keys alone when focus is on a control that uses them (buttons use Space and Enter themselves).
    var onButton = t && t.tagName === 'BUTTON';
    switch (e.key) {
      case 'ArrowRight':
      case 'PageDown':
        e.preventDefault(); show(index + 1, true); break;
      case 'ArrowLeft':
      case 'PageUp':
        e.preventDefault(); show(index - 1, true); break;
      case ' ':
        if (!onButton) { e.preventDefault(); show(index + 1, true); }
        break;
      case 'Home':
        e.preventDefault(); show(0, true); break;
      case 'End':
        e.preventDefault(); show(slides.length - 1, true); break;
      default: break;
    }
  });

  window.addEventListener('hashchange', function () { show(fromHash(), false); });
  show(fromHash(), false);
})();
