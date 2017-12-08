!function() {
  window.addEventListener('DOMContentLoaded', function() {
    var service_worker_script_url = '/service-worker.js';

    function getRegistrations() {
      return navigator.serviceWorker.getRegistrations();
    }

    function getRegistration(service_worker_script_url) {
      return getRegistrations().then(function(registrations) {
        var registration = registrations.find(function(registration) {
          return registration && registration.active && registration.active.scriptURL && registration.active.scriptURL.endsWith(service_worker_script_url);
        });

        if(!registration)
          return Promise.reject(new Error('Service worker not installed'));

        registration.old = true;

        return registration;
      });
    }

    function registerServiceWorker(service_worker_script_url) {
      return getRegistration(service_worker_script_url).catch(function() {
        console.log('registering a new service worker');
        return navigator.serviceWorker.register(service_worker_script_url);
      });
    }

    // @if NODE_ENV='dev'
    importScripts(['/js/app.js'])
    // @endif
    
    // @if NODE_ENV='production'
    registerServiceWorker(service_worker_script_url).then(function(registration) {
      if(!registration.old) return location = location;
      return importScripts(['/js/app.js']);
    })
    // @endif

    .catch(function(error) {
      var div = document.querySelector('.page-loading');
      if(div) div.textContent = error.message;
    });
  });

  function importScripts(urls) {
    return Promise.all(
      urls.map(function(url) {
        return new Promise(function(resolve, reject) {
          var script = document.createElement('script');
          script.src = url;
          document.body.appendChild(script);
          script.onerror = reject;
          script.onload = resolve;
        })
      })
    );
  }

  window.importScripts = importScripts;
}()