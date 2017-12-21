
Vue.component('avk-buckets-objects', {
  template: '/* @include avk-buckets-objects.vue.html */',

  data: function() {
    return this.$parent;
  },
  created: function() {
    var comp = this;

    requestAnimationFrame(function() {
      $('#modal_delete_object').modal({
        complete: function() {
          comp.deleting = {};
        }
      });

      $('#modal_delete_multiple_objects').modal();
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
    modalDeleteMultipleObjects: function() {
      var comp = this;
      if(comp.is_loading)
        return false;

      $('#modal_delete_multiple_objects').modal('open');
    },
    cancelDeleteMultipleObjects: function() {
      this.normalMode();
      this.delete_multiple = [];
    },
    deleteMultipleObjects: function() {
      var comp = this;
      if(comp.is_loading)
        return false;

      comp.state = 'loading';
      $('#modal_delete_multiple_objects').modal('close');
      var files_deleted = 0;

      comp.getFilesToDelete().reduce(function(promise, file_to_delete) {
        return promise.then(function() {
          return comp.deleteFile(comp.buckets_objects, file_to_delete).then(function(response) {
            files_deleted++;
            return response;
          }).catch(function(error) {
            return error;
          });
        });
      }, Promise.resolve()).then(function() {
        Materialize.toast(files_deleted + ' files deleted', 2e3);
        comp.cancelDeleteMultipleObjects();
        comp.state = 'normal';
        return comp.listObjects({
          prefix: comp.buckets_objects.Prefix
        }, '/* @echo REQUEST_SEARCH_OUTSIDE */');
      });
    },
    deleteObject: function() {
      var comp = this;
      if(comp.is_loading)
        return Promise.resolve(false);

      var bucket = comp.deleting.bucket
        , object = comp.deleting.object
      ;

      comp.state = 'loading';
      $('#modal_delete_object').modal('close');

      return comp.deleteFile(bucket, object).then(function(response) {
        return response.json().then(function(json) {
          console.log(json)
          Materialize.toast('Success', 2e3);
        });
      }).catch(function(error) {
        console.log(error);
        Materialize.toast('Error', 2e3);
      }).then(function() {
        comp.state = 'normal';
        return comp.listObjects({
          prefix: bucket.Prefix
        }, '/* @echo REQUEST_SEARCH_OUTSIDE */');
      });
    },
    deleteFile: function(bucket, object, a) {
      var querystring = this.serializeQueryString([
        ['bucket_name', bucket.Name],
        ['key', object.Key || object.Prefix]
      ]);

      return fetch('/api/delete_object?' + querystring, {
        method: 'delete'
      });
    }
  }
})
