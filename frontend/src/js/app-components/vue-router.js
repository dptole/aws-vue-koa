var router = new VueRouter({
  routes: [{
    name: 'login',
    path: '/login',
    beforeEnter: function(to, from, next) {
      if(vue_app) {
        vue_app.access_key_id = localStorage.last_access_key_id || '';
        vue_app.secret_access_key = localStorage.last_secret_access_key || '';
        vue_app.region = localStorage.last_region || '';
      }
      next();
    },
    component: importComponent('login/avk-login')
  }, {
    name: 'logout',
    path: '/logout',
    beforeEnter: function(to, from, next) {
      vue_app.buckets = null;
      vue_app.state = 'normal';
      next('/login');
    }
  }, {
    name: 'dashboard',
    path: '/dashboard',
    beforeEnter: function(to, from, next) {
      if(from.name === 'login') {
        vue_app.state = 'normal';
        Materialize.toast('Welcome!', 2000);
      }

      if(vue_app)
        vue_app.buckets_objects = null;
      next();
    },
    components: {
      default: importComponent('buckets/avk-buckets'),
      nav: importComponent('nav/avk-nav')
    }
  }, {
    name: 'buckets-objects',
    path: '/buckets/:bucket',
    components: {
      default: importComponent('buckets-objects/avk-buckets-objects'),
      nav: importComponent('nav/avk-nav')
    }
  }, {
    name: 'about',
    path: '/about',
    beforeEnter: function(to, from, next) {
      if(from.name === 'login' && vue_app.pwa_install_event) {
        vue_app.installPWA();
        next(false);
      } else
        next();
    },
    components: {
      default: importComponent('about/avk-about'),
      nav: importComponent('nav/avk-nav')
    }
  }, {
    name: 'upload',
    path: '/upload',
    components: {
      default: importComponent('upload/avk-upload'),
      nav: importComponent('nav/avk-nav')
    }
  }]
});

router.beforeEach(function(to, from, next) {
  if(from.name === 'login' && to.name !== 'login' && !vue_app.buckets)
    next('/login');
  else
    next();
});

router.afterEach(function(to, from) {
  if(to.name === 'about' && vue_app.pwa_install_event) {
    requestAnimationFrame(function() {
      vue_app.flashInstallPWAButton();
      vue_app.toast_pwa.remove();
      vue_app.toast_pwa = null;
    })
  }

  if(from.name === 'upload') {
    vue_app.files_to_upload = [];
    vue_app.uploaded_files = 0;
  }

  router.app.state = 'normal';
  router.app.app_page = to.name;
  router.app.goToLoginIfUnknownPath && router.app.goToLoginIfUnknownPath();
});
