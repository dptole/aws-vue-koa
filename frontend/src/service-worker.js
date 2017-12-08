var cache_prefix = 'CACHE_';
var cache_version = cache_prefix + getCacheVersion();
var cached_files = [
  '/',
  '/css/app.css',
  '/js/bootstrap.js',
  '/js/app.js',
  '/components/s3-read/s3-read.js',
  '/components/s3-write/s3-write.js'
];

function getCache() {
  return caches.open(cache_version);
}

function getCacheVersion() {
  return 1;
}

self.addEventListener('fetch', function(event) {
  console.log('sw fetch');
  console.log(event);
  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
    })
  );
})

self.addEventListener('error', function(event) {
  console.log('sw error');
  console.log(event);
})

self.addEventListener('activate', function(event) {
  console.log('sw activate');
  console.log(event);
})

self.addEventListener('install', function(event) {
  console.log('sw install');
  console.log(event);
  skipWaiting();
  getCache().then(function(cache) {
    return cache.addAll(cached_files);
  });
 })
