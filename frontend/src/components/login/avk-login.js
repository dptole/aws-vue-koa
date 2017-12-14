
Vue.component('avk-login', {
  template: '/* @include avk-login.vue.html */',

  data: function() {
    return {
      access_key_id: '',
      secret_access_key: '',
      region: '',
      state: 'normal' // normal, loading, error
    };
  },
  created: function() {
    requestAnimationFrame(function() {
      Materialize.updateTextFields();
      $('input[type=text]:eq(0)').focus();
    });
  },
  computed: {
    is_loading: function() {
      return this.state === 'loading';
    }
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
        }).catch(errorResponse)
      }
      
      function errorResponse(response) {
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
