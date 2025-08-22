var testApp = angular.module('testApp', ['ui.bootstrap']);

// Filtro translate: legge da window.I18N[window.CURRENT_LANG]
testApp.filter('translate', [function () {
  return function (key) {
    try {
      var lang = window.CURRENT_LANG || 'en';
      var dict = (window.I18N && window.I18N[lang]) || {};
      if (typeof key !== 'string') return key;

      // supporto chiavi annidate tipo "pages.fileBatchGenerator.title"
      var parts = key.split('.');
      var cur = dict;
      for (var i = 0; i < parts.length; i++) {
        if (cur && Object.prototype.hasOwnProperty.call(cur, parts[i])) {
          cur = cur[parts[i]];
        } else {
          return key; // fallback: mostra la chiave
        }
      }
      return (typeof cur === 'string') ? cur : key;
    } catch (e) {
      return key;
    }
  };
}]);
