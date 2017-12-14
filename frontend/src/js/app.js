$(document).ready(function() {
  var router = new VueRouter({
    routes: [{
      path: '/',
      redirect: '/login'
    }, {
      path: '/login',
      component: importComponent('login/avk-login')
    }]
  })

  new Vue({
    router: router,
    data: {
      app_loaded: true
    },
    methods: {
    }
  }).$mount('#app')
});
