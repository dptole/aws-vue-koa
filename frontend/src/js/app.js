$(document).ready(function() {
  var router = new VueRouter({
    routes: [{
      name: 'login',
      path: '/login',
      component: importComponent('login/avk-login')
    }, {
      name: 'logout',
      path: '/logout',
      beforeEnter: function(to, from, next) {
        next('/login')
      }
    }, {
      name: 'dashboard',
      path: '/dashboard',
      components: {
        default: importComponent('buckets/avk-buckets'),
        nav: importComponent('nav/avk-nav')
      }
    }]
  });

  router.afterEach(function(to, from) {
    app.app_page = to.name;
    app.goToLoginIfUnknownPath();
  });

  var app = new Vue({
    router: router,
    data: {
      // global
      app_loaded: false,
      app_page: '',
      state: 'normal', // normal, loading, error
      // login
      access_key_id: '',
      secret_access_key: '',
      region: '',
      // dashboard
      buckets: null
    },
    computed: {
      is_loading: function() {
        return this.state === 'loading';
      }
    },
    created: function() {
      this.goToLoginIfUnknownPath();
      this.app_loaded = true;
    },
    methods: {
      goToLoginIfUnknownPath: function() {
        var matched = router.getMatchedComponents(location);
        if(!matched.length)
          router.push('/login');
      }
    }
  }).$mount('#app');

  // Bugfix: if the hash does not start with "#/" vue-router will not process it properly.
  window.addEventListener('hashchange', function(event) {
    if(!/#\//.test(event.newURL))
      location = event.newURL.replace(/#(.)/, '#/$1');
  });
});
