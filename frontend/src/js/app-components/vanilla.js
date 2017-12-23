dragndrop_layer.ondragleave = function(event) {
  vue_app.app_dragover = 'false';
};

document.documentElement.ondragover = function(event) {
  event.preventDefault();
  if(vue_app.$route.name === 'upload' || vue_app.$route.name === 'buckets-objects')
    vue_app.app_dragover = 'true';
};

document.documentElement.ondrop = function(event) {
  event.preventDefault();
  vue_app.app_dragover = 'false';

  if(vue_app.$route.name === 'upload' || vue_app.$route.name === 'buckets-objects') {
    vue_app.navbarGoTo('/upload');
    vue_app.listDropToUpload(event).then(function() {
      vue_app.startMaterialSelect();
    });
  } else
    Materialize.toast('You cannot upload files from here.', 3000);
};

window.onbeforeinstallprompt = function(event) {
  event.preventDefault();
  console.log(event);

  vue_app.pwa_install_event = event;
  vue_app.pwa_install_event.userChoice = event.userChoice.then(function(choice) {
    vue_app.pwa_install_event = null;
    return choice;
  }).catch(function(error) {
    console.log(error);
    return error;
  });

  return false;
}

window.ononline = function(event) { vue_app.is_online = true; }
window.onoffline = function(event) { vue_app.is_online = false; }

// Bugfix: if the hash does not start with "#/" vue-router will not process it properly.
window.addEventListener('hashchange', function(event) {
  if(!/#\//.test(event.newURL))
    location = event.newURL.replace(/#(.)/, '#/$1');
});