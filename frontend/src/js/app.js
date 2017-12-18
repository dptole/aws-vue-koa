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
    }, {
      name: 'buckets-objects',
      path: '/buckets/:bucket',
      components: {
        default: importComponent('buckets-objects/avk-buckets-objects'),
        nav: importComponent('nav/avk-nav')
      }
    }]
  });

  router.afterEach(function(to, from) {
    router.app.app_page = to.name;
    router.app.goToLoginIfUnknownPath();
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
      buckets: null,
      // buckets objects
      buckets_objects: {},
      list_start_after: [],
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
      goToDashboard: function() {
        if(!this.is_loading)
          this.$router.push('/dashboard');
      },
      goToLoginIfUnknownPath: function() {
        var matched = router.getMatchedComponents(location);
        if(!matched.length)
          router.push('/login');
      },
      listObjects: function(bucket, mode) {
        app.state = 'loading';

        function successResponse(response) {
          return response.json().then(function(buckets_objects) {
            app.buckets_objects = buckets_objects;
            if(bucket.start_after)
              app.list_start_after.push(bucket.start_after);
            else
              app.list_start_after = [];
          }).catch(errorResponse);
        }

        function errorResponse(error) {
          console.log(error);
        }

        function cleanUpResponse() {
          app.state = 'normal';
        }

        if(mode === 'previous') {
          bucket.prefix = bucket.prefix.match(/[^\/]+/g);
          if(bucket.prefix) {
            bucket.prefix.pop();
            bucket.prefix = bucket.prefix.join('/');
            if(bucket.prefix)
              bucket.prefix += '/';
          } else
            bucket.prefix = ''
        }

        var querystring = app.serializeQueryString([
          ['prefix', bucket.prefix],
          ['start_after', bucket.start_after || '']
        ]);

        fetch('/api/list_obejcts?' + querystring).then(function(response) {
          return response.status === 200
            ? successResponse(response)
            : errorResponse(response)
        }).then(cleanUpResponse);
      },
      nextPage: function() {
        app.listObjects({
          prefix: app.buckets_objects.Prefix,
          start_after: [].concat(
            app.buckets_objects.CommonPrefixes.map(function(p) { return p.Prefix; }),
            app.buckets_objects.Contents.map(function(c) { return c.Key; })
          ).pop()
        });
      },
      previousPage: function() {
        app.list_start_after.pop();
        app.listObjects({
          prefix: app.buckets_objects.Prefix,
          start_after: app.list_start_after.pop()
        });
      },
      getObject: function(content) {
        
      },
      serializeQueryString: function(qs) {
        return [
          ['access_key_id', app.access_key_id],
          ['secret_access_key', app.secret_access_key],
          ['region', app.region],
          ['bucket', app.$route.params.bucket],
          ['max_keys', 10],
          ['delimiter', '/'],
        ].concat(qs).reduce(function(acc, query) {
          return acc.concat(encodeURIComponent(query[0]) + '=' + encodeURIComponent(query[1]));
        }, []).join('&');
      }
    }
  }).$mount('#app');

  // Bugfix: if the hash does not start with "#/" vue-router will not process it properly.
  window.addEventListener('hashchange', function(event) {
    if(!/#\//.test(event.newURL))
      location = event.newURL.replace(/#(.)/, '#/$1');
  });
});
