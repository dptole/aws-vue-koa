
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
          uploaded: false
        };
      });
    },
    uploadFiles: function() {
      this.state = 'loading';
      this.uploadObject(
        this.buckets_objects.Name,
        this.buckets_objects.Prefix,
        this.files_to_upload[0],
        this.selected_acl
      );
    },
    removeFilesFromUploadList: function(file) {
      var file_index = this.files_to_upload.indexOf(file);
      if(~file_index)
        this.files_to_upload.splice(file_index, 1);
    },
    uploadObject: function(bucket_name, prefix, file, acl) {
      var comp = this;
      console.log(bucket_name);
      console.log(prefix);
      console.log(file);
      console.log(acl);
      setTimeout(function() {
        comp.state = 'normal';
        Materialize.toast('NYI', 2000);
      }, 1000);
    }
  }
})
