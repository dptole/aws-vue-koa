
Vue.component('avk-upload', {
  template: '/* @include avk-upload.vue.html */',

  data: function() {
    return this.$parent;
  },
  created: function() {
    this.files_to_upload = [];
  },
  watch: {
    files_to_upload: function(new_value, old_value) {
      if(new_value.length > 0 && old_value.length < 1)
        requestAnimationFrame(function() {
          $('select').material_select();
        });
    }
  },
  methods: {
    listFilesToUpload: function(event) {
      this.files_to_upload = Array.from(event.target.files).map(function(file) {
        return {
          file_object: file,
          status: 'waiting'
        };
      });
    },
    uploadFiles: function() {
      var comp = this;
      if(comp.is_loading)
        return false;

      comp.state = 'loading';
      var bucket = comp.buckets_objects;

      function uploadIter(files, index) {
        if(!files[index]) {
          Materialize.toast('Done', 2e3);
          return setTimeout(function() {
            comp.state = 'normal';
            comp.$router.go(-1);
            setTimeout(function() {
              comp.files_to_upload = [];
              comp.listObjects({
                prefix: bucket.Prefix
              });
            }, 1e2);
          }, 2e3);
        }

        var file = files[index];
        file.status = 'uploading';

        comp.uploadObject(
          bucket,
          file.file_object,
          comp.selected_acl
        ).then(function(result) {
          file.status = 'uploaded';
          console.log(result);
        }).catch(function(error) {
          file.status = 'error';
          console.log(error);
        }).then(function() {
          uploadIter(files, index + 1);
        });
      }

      uploadIter(comp.files_to_upload, 0);
    },
    removeFilesFromUploadList: function(file) {
      var file_index = this.files_to_upload.indexOf(file);
      if(~file_index)
        this.files_to_upload.splice(file_index, 1);
    },
    uploadObject: function(bucket, file, acl) {
      var comp = this
        , form_data = new FormData
        , querystring = this.serializeQueryString([
            ['bucket_name', bucket.Name],
            ['prefix', bucket.Prefix],
            ['acl', acl]
          ])
      ;

      form_data.append('file', file);

      return fetch('/api/upload_object?' + querystring, {
        method: 'post',
        body: form_data
      }).then(function(response) {
        return response.json().then(function(json) {
          console.log(json)
          return json;
        });
      });
    }
  }
})
