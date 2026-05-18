(function() {
  'use strict';

  if (localStorage.getItem('cookie-consent')) return;

  var banner = document.createElement('div');
  banner.className = 'cookie-consent';
  banner.innerHTML =
    '<div class="cookie-consent-content">' +
    '<p class="cookie-consent-text">本网站使用 Cookie 和 Google AdSense 提供个性化广告和访问分析。继续浏览即表示您同意使用 Cookie。</p>' +
    '<div class="cookie-consent-actions">' +
    '<a href="/privacy.html" class="cookie-consent-link">隐私政策</a>' +
    '<button type="button" class="cookie-consent-btn">同意</button>' +
    '</div>' +
    '</div>';

  document.body.appendChild(banner);

  banner.querySelector('.cookie-consent-btn').addEventListener('click', function() {
    localStorage.setItem('cookie-consent', '1');
    banner.parentNode.removeChild(banner);
  });
})();
