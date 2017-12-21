
Vue.component('avk-upload', {
  template: '/* @include avk-upload.vue.html */',

  data: function() {
    return this.$parent;
  },
  created: function() {
    var comp = this;

    if(comp.files_to_upload.length > 0)
      comp.startMaterialSelect();
  },
  watch: {
    files_to_upload: function(new_value, old_value) {
      if(new_value.length > 0 && old_value.length < 1)
        this.startMaterialSelect();
    }
  },
  methods: {
    listFoldersToUpload: function(event) {
      this.files_to_upload = Array.from(event.target.files).map(function(file) {
        return {
          filename: file.webkitRelativePath,
          file_object: file,
          status: 'waiting'
        };
      });
    },
    listFilesToUpload: function(event) {
      this.files_to_upload = Array.from(event.target.files).map(function(file) {
        return {
          filename: file.name,
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
          Materialize.toast(comp.uploaded_files + ' files uploaded', 2e3);

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
          file,
          comp.selected_acl
        ).then(function(result) {
          file.status = 'uploaded';
          comp.uploaded_files++;
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
    removeFilesFromUploadList: function(file_to_remove) {
      this.files_to_upload = this.files_to_upload.filter(function(file) {
        return file !== file_to_remove;
      });
    },
    resetFiles: function() {
      this.files_to_upload = [];
    },
    uploadObject: function(bucket, file, acl) {
      var comp = this
        , form_data = new FormData
        , querystring = this.serializeQueryString([
            ['bucket_name', bucket.Name],
            ['prefix', bucket.Prefix],
            ['filename', file.filename],
            ['acl', acl]
          ])
      ;

      form_data.append('file', file.file_object);

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
