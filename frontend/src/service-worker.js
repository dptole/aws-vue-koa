const cache_prefix = 'CACHE_';
const cache_version = cache_prefix + getCacheVersion();
const cached_files = [
  '/',
  '/css/app.css',
  '/js/bootstrap.js',
  '/js/app.js',
  '/components/s3-read/s3-read.js',
  '/components/s3-write/s3-write.js'
]

function getCache() {
  return caches.open(cache_version)
}

function getCacheVersion() {
  return 1
}

function cloneResponseFromBlob(blob, response) {
  return new Response(blob, {
    headers: new Headers(response.headers),
    status: response.status,
    statusText: response.statusText
  })
}

function insertXFEFromHeader(value) {
  return function(blob, response) {
    const cloned_response = cloneResponseFromBlob(blob, response)
    cloned_response.headers.set('x-fe-from', value)
    return cloned_response
  }
}

function cacheFetched(request, response, response_blob) {
  if(request.method === 'GET')
    getCache().then(function(cache) {
      cache.put(request, cloneResponseFromBlob(response_blob, response))
    })

  return insertXFEFromHeader('network')(response_blob, response)
}

async function getResponseFromNetwork(event) {
  const response = await fetch(event.request)
  const blob = await response.blob()
  return await cacheFetched(event.request, response, blob)
}

function getResponseFromCache(event) {
  return caches.match(event.request).then(async function(cache_response) {
    if(cache_response) {
      const blob = await cache_response.blob()
      return insertXFEFromHeader('js-cache-api')(blob, cache_response)
    }

    return getResponseFromNetwork(event)
  })
}

onfetch = async function(event) {
  console.log('sw fetch');
  console.log(event);

  event.respondWith(
    event.request.headers.get('x-fe-to') === 'network'
      ? getResponseFromNetwork(event)
      : getResponseFromCache(event)
  );
}

onerror = function(event) {
  console.log('sw error')
  console.log(event)
}

onactivate = function(event) {
  console.log('sw activate')
  console.log(event)
}

oninstall = function(event) {
  console.log('sw install')
  console.log(event)
  skipWaiting()
  getCache().then(function(cache) {
    return cache.addAll(cached_files)
  })
}
