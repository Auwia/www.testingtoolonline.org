(function () {
  var KEY = 'ttol.consent';
  var lang = (document.documentElement.getAttribute('lang') || 'en').toLowerCase();

  var T = {
    en: { msg: 'We use analytics cookies (Microsoft Clarity). Do you accept?', accept: 'Accept', decline: 'Decline' },
    it: { msg: 'Usiamo cookie di analisi (Microsoft Clarity). Accetti?', accept: 'Accetto', decline: 'Rifiuto' },
    de: { msg: 'Wir verwenden Analyse-Cookies (Microsoft Clarity). Akzeptieren Sie?', accept: 'Akzeptieren', decline: 'Ablehnen' },
    fr: { msg: 'Nous utilisons des cookies d’analyse (Microsoft Clarity). Acceptez-vous ?', accept: 'Accepter', decline: 'Refuser' },
    pt: { msg: 'Usamos cookies de análise (Microsoft Clarity). Aceita?', accept: 'Aceito', decline: 'Recusar' },
    ru: { msg: 'Мы используем аналитические cookie (Microsoft Clarity). Вы согласны?', accept: 'Согласен', decline: 'Отказать' },
    es: { msg: 'Usamos cookies de análisis (Microsoft Clarity). ¿Aceptas?', accept: 'Aceptar', decline: 'Rechazar' }
  };
  var TXT = T[lang] || T.en;

  function sendConsent(granted) {
    try { localStorage.setItem(KEY, granted ? 'granted' : 'denied'); } catch (e) {}

    try {
      if (typeof window.clarity !== 'function') {
        window.clarity = window.clarity || function () { (window.clarity.q = window.clarity.q || []).push(arguments); };
      }
      window.clarity('consentv2', {
        ad_Storage: granted ? 'granted' : 'denied',
        analytics_Storage: granted ? 'granted' : 'denied'
      });
      if (!granted) { window.clarity('consent', false); }
    } catch (e) {}

    if (!granted) {
      try {
        var parts = location.hostname.split('.');
        for (var i = 0; i < parts.length; i++) {
          var dom = '.' + parts.slice(i).join('.');
          document.cookie = "_clck=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=" + dom;
          document.cookie = "_clsk=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=" + dom;
        }
      } catch (e) {}
    }
  }

  function showBanner(show) {
    var el = document.getElementById('cookie-banner');
    if (el) el.style.display = show ? '' : 'none';
  }

  function mountBanner() {
    if (document.getElementById('cookie-banner')) return;

    var bar = document.createElement('div');
    bar.id = 'cookie-banner';
    bar.setAttribute('role', 'dialog');
    bar.setAttribute('aria-live', 'polite');
    bar.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:9999;background:#1f2937;color:#fff;padding:12px 16px;box-shadow:0 -2px 10px rgba(0,0,0,.2);display:none;';
    var inner = document.createElement('div');
    inner.style.cssText = 'max-width:980px;margin:0 auto;display:flex;align-items:center;gap:12px;flex-wrap:wrap;';
    var span = document.createElement('span'); span.textContent = TXT.msg;
    var spacer = document.createElement('span'); spacer.style.cssText = 'flex:1';
    var yes = document.createElement('button'); yes.type = 'button'; yes.textContent = TXT.accept; yes.className = 'btn';
    yes.style.cssText = 'background:#2d6cdf;color:#fff;border:0;padding:6px 10px;border-radius:4px;';
    var no = document.createElement('button'); no.type = 'button'; no.textContent = TXT.decline; no.className = 'btn';
    no.style.cssText = 'background:#6b7280;color:#fff;border:0;padding:6px 10px;border-radius:4px;margin-left:6px;';

    inner.appendChild(span); inner.appendChild(spacer); inner.appendChild(yes); inner.appendChild(no);
    bar.appendChild(inner); document.body.appendChild(bar);

    yes.onclick = function () { sendConsent(true); showBanner(false); };
    no.onclick  = function () { sendConsent(false); showBanner(false); };

    showBanner(true);

    window.ttolConsent = window.ttolConsent || {};
    window.ttolConsent.open = function () { showBanner(true); };
    window.ttolConsent.set  = function (v) { sendConsent(!!v); };
  }

  function init() {
    var saved = null;
    try { saved = localStorage.getItem(KEY); } catch (e) {}
    if (saved === 'granted' || saved === 'denied') {
      sendConsent(saved === 'granted');
    } else {
      mountBanner();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
