
Vue.component('s3-write', {
  template: '\
    <div id="upload_objects">\
      <div>\
        <div>File:</div>\
        <div><input multiple @change="selectFile" type="file" :disabled="state !== \'normal\'"></div>\
      </div>\
      <div>\
        <div>Bucket name:</div>\
        <div>\
          <select v-model="selected_bucket" :disabled="state !== \'normal\'" v-if="bucket_list">\
            <option :value="bucket.Name" v-for="bucket in bucket_list">{{ bucket.Name }}</option>\
          </select>\
          <button v-if="!bucket_list" @click="loadBuckets" :disabled="state !== \'normal\'">Load buckets</button>\
        </div>\
      </div>\
      <div>\
        <div>Key name:</div>\
        <div><input type="text" v-model="key_name" :disabled="state !== \'normal\'"></div>\
      </div>\
      <div>\
        <button @click.prevent="uploadFile" :disabled="state !== \'normal\'">Upload</button>\
      </div>\
      <div v-if="last_upload_result">\
        <div>Last result:</div>\
        <pre>{{ last_upload_result }}</pre>\
      </div>\
    </div>',

  data: function() {
    return this.$parent.s3_write_data;
  },
  methods: {
    loadBuckets: function() {
      var s3_write = this;

      if(s3_write.state !== 'normal')
        return false;

      s3_write.state = 'loading';

      this.$parent.listBuckets().then(function(buckets) {
        s3_write.bucket_list = buckets.Buckets;
        s3_write.selected_bucket = s3_write.bucket_list[0].Name;
      }).catch(function(error) {
        s3_write.bucket_list = null;
        console.log(error);
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

      if(!(s3_write.state === 'normal' && s3_write.files.length > 0))
        return false;

      s3_write.state = 'loading';

      this.$parent.putObjects(s3_write.files, {
        bucket: s3_write.selected_bucket,
        key: s3_write.key_name
      }).then(function(json) {
        s3_write.last_upload_result = json;
      }).catch(function(error) {
        console.log(error);
      }).then(function() {
        s3_write.file = null;
        s3_write.state = 'normal';
      });
    }
  }
});
