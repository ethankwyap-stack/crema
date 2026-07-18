// Scroll-reveal: elements with [data-reveal] fade/slide in when they enter the
// viewport. Stagger via inline --d (seconds). No-JS fallback: everything stays
// visible because the hiding styles are gated behind the .js class added here.
document.documentElement.classList.add('js');
var io = new IntersectionObserver(function (entries) {
  entries.forEach(function (e) {
    if (!e.isIntersecting) return;
    var t = e.target;
    io.unobserve(t);
    var d = parseFloat(getComputedStyle(t).getPropertyValue('--d')) || 0;
    setTimeout(function () { t.classList.add('in'); }, d * 1000);
  });
}, { rootMargin: '0px 0px -10% 0px' });
document.querySelectorAll('[data-reveal]').forEach(function (el) { io.observe(el); });
