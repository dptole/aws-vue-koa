const cache_version = getCacheVersion()
const initial_cache = [
  '/',
  '/css/app.css',
  '/components/login/avk-login.js',
  '/components/buckets/avk-buckets.js',
  '/fonts/roboto/Roboto-Bold.woff2',
  '/fonts/roboto/Roboto-Regular.woff2',
  '/images/logo-192x192.png',
  '/images/logo-144x144.png',
  '/images/logo-128x128.png',
  '/js/bootstrap.js',
  '/js/app.js'
]
const req_search_origin = '/* @echo REQUEST_SEARCH_ORIGIN */'
const req_search_target = '/* @echo REQUEST_SEARCH_TARGET */'
const req_search_outside = '/* @echo REQUEST_SEARCH_OUTSIDE */'
const req_search_inside = '/* @echo REQUEST_SEARCH_INSIDE */'

function getCache() {
  return caches.open(cache_version)
}

function getCacheVersion() {
  return '/* @echo CACHE_VERSION */';
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
    cloned_response.headers.set(req_search_origin, value)
    return cloned_response
  }
}

function cacheFetched(request, response, response_blob) {
  if(request.method === 'GET')
    getCache().then(function(cache) {
      cache.put(request, cloneResponseFromBlob(response_blob, response))
    })

  return insertXFEFromHeader(req_search_outside)(response_blob, response)
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
      return insertXFEFromHeader(req_search_inside)(blob, cache_response)
    }

    return getResponseFromNetwork(event)
  })
}

onfetch = async function(event) {
  console.log('sw fetch');
  console.log(event);

  /* @if NODE_ENV='dev' */
  return getResponseFromNetwork(event)
  /* @endif */

  /* @if NODE_ENV='production' */
  event.respondWith(
    event.request.headers.get(req_search_target) === req_search_outside
      ? getResponseFromNetwork(event)
      : getResponseFromCache(event)
  );
  /* @endif */
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
    return cache.addAll(initial_cache)
  })
}
