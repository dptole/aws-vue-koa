
Vue.component('s3-read', {
  template: '\
    <div id="list_buckets">\
      <div>\
        <button @click="listBuckets" id="button_list" :disabled="state !== \'normal\'">List</button> {{ state === \'loading\' ? \'Loading...\' : \'\' }}\
      </div>\
\
      <ul v-if="buckets && !bucket_objects">\
        <li>Buckets</li>\
        <li v-for="bucket in buckets.Buckets">\
          <a href="#" @click.prevent="listObjects(bucket)">{{ bucket.Name }}</a>\
        </li>\
      </ul>\
\
      <ul v-if="bucket_objects">\
        <li>{{ bucket_objects.Contents.length }} Objects</li>\
        <li>\
          <a href="#" @click.prevent="listBuckets">Back to bucket</a>\
        </li>\
        <li>\
          <input :disabled="state !== \'normal\'" placeholder="Filter..." type="search" v-model="filter_text" @keyup="filterObjects"> {{ filter_status }}\
        </li>\
        <li v-for="object in bucket_objects.Contents" v-if="!object.hide">\
          <a href="#" @click.prevent="deleteObject(current_bucket, object.Key)">X</a> | <a :href="getObjectURL(bucket_objects.Name, object.Key)" target="_blank">{{ bucket_objects.Name }}/{{ object.Key }}</a>\
        </li>\
      </ul>\
    </div>',

  data: function() {
    return this.$parent.s3_read_data;
  },
  methods: {
    listBuckets: function() {
      var s3_read = this;

      if(s3_read.state === 'loading')
        return false;

      s3_read.state = 'loading';
      s3_read.bucket_objects = null;
      s3_read.current_bucket = null;
      s3_read.current_objects_page = null;

      if(s3_read.buckets) {
        s3_read.state = 'normal';
        return false;
      }

      this.$parent.listBuckets().then(function(buckets) {
        s3_read.buckets = buckets;
      }).catch(function(error) {
        console.log(error);
      }).then(function() {
        s3_read.state = 'normal';
      });
    },
    getObjectURL: function(bucket_name, object_key) {
      return this.$parent.getObjectURL(bucket_name, object_key);
    },
    filterObjects: function() {
      var timeout = null;
      
      return function() {
        var s3_read = this;
        clearTimeout(timeout);
        s3_read.filter_text = s3_read.filter_text.replace(/\s\s/g, ' ');
        
        if(s3_read.filter_text.length < 1) {
          s3_read.filter_status = '';
          s3_read.bucket_objects.Contents.forEach(function(object) {
            object.hide = false;
          });

        } else {
          s3_read.filter_status = 'Filtering...';

          timeout = setTimeout(function() {
            var regex = RegExp(s3_read.filter_text, 'gim');
            var total = 0;

            s3_read.bucket_objects.Contents.forEach(function(object) {
              object.hide = !regex.test(object.Key);
              if(!object.hide)
                total++;
            });

            s3_read.filter_status = total + ' objects filtered';
          }, 800)
        }
      }
    }(),
    deleteObject: function(bucket, key) {
      var s3_read = this;

      if(s3_read.state === 'loading')
        return false;

      if(!confirm('Delete the file\n\n' + key + '\n\nAre you sure?'))
        return false;

      s3_read.state = 'loading';

      this.$parent.deleteObject({
        bucket: bucket.Name,
        key: key
      }).then(function() {
        s3_read.state = 'normal';
        return s3_read.listObjects(bucket);
      })

      return true
    },
    listObjects: function(bucket) {
      var s3_read = this;

      if(s3_read.state === 'loading')
        return false;

      s3_read.state = 'loading';
      s3_read.current_bucket = bucket;
      s3_read.filter_text = '';
      s3_read.filter_status = '';

      var query = {
        bucket: bucket.Name,
        prefix: s3_read.current_prefix
      };

      this.$parent.listObjects(query).then(function(bucket_objects) {
        s3_read.bucket_objects = bucket_objects;
      }).catch(function(error) {
        console.log(error);
      }).then(function() {
        s3_read.state = 'normal';
      });
    }
  }
});
