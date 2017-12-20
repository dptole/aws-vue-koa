
Vue.component('avk-buckets-objects', {
  template: '/* @include avk-buckets-objects.vue.html */',

  data: function() {
    return this.$parent;
  },
  created: function() {
    requestAnimationFrame(function() {
      $('#modal_delete_object').modal();
    });

    if(!this.buckets_objects)
      this.listObjects({
        prefix: ''
      });
  },
  methods: {
    modalDeleteObject: function(bucket, object) {
      var comp = this;
      if(comp.is_loading)
        return false;

      comp.deleting = {
        bucket: bucket,
        object: object
      };

      $('#modal_delete_object').modal('open');
    },
    deleteObject: function() {
      var comp = this;
      if(comp.is_loading)
        return false;

      $('#modal_delete_object').modal('close');

      var bucket = comp.deleting.bucket
        , object = comp.deleting.object
      ;

      comp.state = 'loading';

      var querystring = this.serializeQueryString([
        ['bucket_name', bucket.Name],
        ['key', object.Key]
      ]);

      fetch('/api/delete_object?' + querystring, {
        method: 'delete'
      }).then(function(response) {
        return response.json().then(function(json) {
          console.log(json)
          Materialize.toast('Success', 2000);
        });
      }).catch(function(error) {
        console.log(error);
        Materialize.toast('Error', 2000);
      }).then(function() {
        comp.state = 'normal';
        comp.deleting = {};
        comp.listObjects({
          prefix: bucket.Prefix
        });
      });
    }
  }
})
