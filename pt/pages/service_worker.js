var CACHE = 'network-or-cache';
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return cache.addAll([
        'index.html',
        'css/main.css',
        'js/module_testing_tool.js',
        'js/controller_testing_tool.js',
        'en/pages/modalInfo.html',
        'en/pages/modalHelp.html',
        'en/pages/modalTextFormatHelper.html',
        'en/pages/modalDateFormatHelper.html',
        'en/pages/modalNumberFormatHelper.html',
        'resources/datapolicy.txt',
        'resources/history.txt',
        'img/logo.svg',
        'img/batch.svg',
        'img/favicon.ico',
        'img/header_background.png'
      ]);
    })
  );
});

self.addEventListener('fetch', function(event) {
	event.respondWith(fromNetwork(event.request, 400).catch(function () {
		return fromCache(event.request);
	}));
});
function fromNetwork(request, timeout) {
	return new Promise(function (fulfill, reject) {
		var timeoutId = setTimeout(reject, timeout);
		fetch(request).then(function (response) {
			clearTimeout(timeoutId);
			fulfill(response); 
		}, reject);
  });
}
 
function fromCache(request) {
	return caches.open(CACHE).then(function (cache) {
		return cache.match(request).then(function (matching) {
			return matching || Promise.reject('no-match');
		});
	});
}