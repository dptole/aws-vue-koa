$(document).ready(function() {
  var router = new VueRouter({
    routes: [{
      name: 'root',
      path: '/',
      redirect: '/login'
    }, {
      name: 'login',
      path: '/login',
      component: importComponent('login/avk-login')
    }, {
      name: 'dashboard',
      path: '/dashboard',
      component: importComponent('dashboard/avk-dashboard')
    }]
  });

  var app = new Vue({
    router: router,
    data: {
      app_loaded: false
    },
    created: function() {
      setTimeout(function() {
        app.app_loaded = true;
      }, 1000);
    }
  }).$mount('#app');
});
