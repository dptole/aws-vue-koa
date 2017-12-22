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

    registerServiceWorker(service_worker_script_url).then(function(registration) {
      if(!registration.old) return setTimeout(function() { location = '/'; }, 1000);
      app.classList.remove('sw-phase');
      return importScripts(['/js/app.js']);
    }).catch(function(error) {
      var div = document.querySelector('.page-loading');
      if(div && error) div.textContent = error.message;
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

  function importComponent(component_url) {
    var component_full_url = '/components/' + component_url + '.js'
      , vue_component_name = component_url.replace(/^[^\/]+\//, '')
    ;

    return function() {
      var vue_component = Vue.component(vue_component_name);
      return vue_component
        ? Promise.resolve(vue_component)
        : importScripts([component_full_url]).then(function() {
            return Vue.component(vue_component_name);
          })
      ;
    }
  }

  window.importComponent = importComponent;
  window.importScripts = importScripts;
}()