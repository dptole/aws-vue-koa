
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
          Materialize.toast('Welcome!', 2000);
          buckets.Buckets = buckets.Buckets.map(function(bucket) {
            bucket.vue_router_hash = '/#/buckets/' + bucket.Name;
            return bucket;
          });
          comp.buckets = buckets;
          comp.$parent._router.push({path: '/dashboard'});
        }).catch(errorResponse)
      }
      
      function errorResponse(error) {
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
