
Vue.component('s3-write', {
  template: '/* @include s3-write.vue.html */',

  data: function() {
    return this.$parent.s3_write_data;
  },
  computed: {
    loading_text: function() {
      return this.is_uploading
        ? 'Uploading...'
        : this.is_loading
        ? 'Loading...'
        : ''
      ;
    },
    is_loading: function() {
      return this.state === 'loading' || this.is_uploading;
    },
    is_uploading: function() {
      return this.state === 'uploading';
    }
  },
  methods: {
    loadBuckets: function() {
      var s3_write = this;

      if(s3_write.is_loading)
        return false;

      s3_write.state = 'loading';

      this.$parent.listBuckets().then(function(buckets) {
        s3_write.bucket_list = buckets.Buckets;
        s3_write.selected_bucket = s3_write.bucket_list[0].Name;
      }).catch(function(error) {
        s3_write.bucket_list = null;
        s3_write.error_message = error;
      }).then(function() {
        s3_write.state = 'normal';
      });
    },
    selectFile: function(event) {
      var s3_write = this;

      if(s3_write.state !== 'normal')
        return false;

      s3_write.files = [].slice.call(event.target.files, 0);
    },
    uploadFile: function() {
      var s3_write = this;

      if(s3_write.is_loading || s3_write.is_uploading || s3_write.files.length < 1)
        return false;

      s3_write.state = 'uploading';

      this.$parent.putObjects(s3_write.files, {
        bucket: s3_write.selected_bucket,
        key: s3_write.key_name
      }).then(function(json) {
        s3_write.last_upload_result = json;
      }).catch(function(error) {
        s3_write.error_message = error;
      }).then(function() {
        s3_write.file = null;
        s3_write.state = 'normal';
      });
    },
    removeFile: function(file) {
      var s3_write = this;

      if(s3_write.is_loading)
        return false;

      var index = s3_write.files.indexOf(file);
      if(~index)
        s3_write.files = s3_write.files.filter(function(f) {
          return f !== file;
        })

      return true;
    }
  }
});
