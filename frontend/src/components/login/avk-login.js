
Vue.component('avk-login', {
  template: '/* @include avk-login.vue.html */',

  data: function() {
    return this.$parent;
  },
  created: function() {
    requestAnimationFrame(function() {
      Materialize.updateTextFields();
      $('input[type=text]:eq(0)').focus();
    });
  },
  methods: {
    doLogin: function() {
      var comp = this;
      if(comp.is_loading)
        return false;
      comp.state = 'loading';

      function successResponse(response) {
        return response.json().then(function(buckets) {
          localStorage.last_access_key_id = comp.access_key_id;
          localStorage.last_secret_access_key = comp.secret_access_key;
          localStorage.last_region = comp.region;
          comp.buckets = buckets;
          comp.$parent.$router.push('/dashboard');
        }).catch(errorResponse)
      }

      function errorResponse(error) {
        localStorage.last_access_key_id = '';
        localStorage.last_secret_access_key = '';
        localStorage.last_region = '';
        Materialize.toast('Error!', 2000);
      }

      function cleanUpResponse() {
        comp.state = 'normal';
      }

      fetch('/api/login', {
        method: 'post',
        headers: {
          'content-type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify({
          access_key_id: comp.access_key_id,
          secret_access_key: comp.secret_access_key,
          region: comp.region
        })
      }).then(function(response) {
        return response.status === 200
          ? successResponse(response)
          : errorResponse(response)
      }).then(cleanUpResponse);
    }
  }
})
