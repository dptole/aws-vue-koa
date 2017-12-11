
Vue.component('s3-read', {
  template: '/* @include s3-read.vue.html */',

  data: function() {
    return this.$parent.s3_read_data;
  },
  computed: {
    loading_text: function() {
      return this.is_loading ? 'Loading...' : '';
    },
    is_loading: function() {
      return this.state === 'loading';
    },
    last_object_key: function() {
      return this.bucket_objects &&
        this.bucket_objects.Contents &&
        this.bucket_objects.Contents[this.bucket_objects.Contents.length - 1] &&
        this.bucket_objects.Contents[this.bucket_objects.Contents.length - 1].Key
      ;
    },
    current_page: function() {
      var s3_read = this
        , this_page
      ;

      if(!(
        this_page = s3_read.bucket_objects_pages.find(function(bucket_objects_page) {
          return bucket_objects_page === s3_read.bucket_objects;
        })
      ))
        return 0;

      var this_pages_index = s3_read.bucket_objects_pages.indexOf(this_page);
      return ~this_pages_index ? this_pages_index : 0;
    }
  },
  methods: {
    listBuckets: function(from_network) {
      var s3_read = this;

      if(s3_read.is_loading)
        return false;

      s3_read.state = 'loading';
      s3_read.bucket_objects = null;
      s3_read.current_bucket = null;

      if(s3_read.buckets && !from_network) {
        s3_read.state = 'normal';
        return false;
      }

      s3_read.$parent.listBuckets(from_network).then(function(buckets) {
        s3_read.error_message = '';
        s3_read.buckets = buckets;
      }).catch(function(error) {
        s3_read.error_message = error;
      }).then(function() {
        s3_read.state = 'normal';
      });
    },
    getObjectURL: function(bucket_name, object_key) {
      return this.$parent.getObjectURL(bucket_name, object_key);
    },
    filterObjects: function() {
      var timeout = null;
      
      return function(event) {
        var s3_read = this;
        clearTimeout(timeout);

        if(s3_read.filter_text.length < 1) {
          s3_read.filter_status = '';
          s3_read.bucket_objects.Contents = s3_read.bucket_objects.Contents.map(function(object) {
            object.hide = false;
            return object;
          });
        } else {
          if(event && !(event.key.length === 1 || ~[8, 13].indexOf(event.keyCode))) {
            s3_read.filter_status = '';
            return false;
          }

          s3_read.filter_status = 'Filtering...';

          timeout = setTimeout(function() {
            var regex = RegExp(s3_read.filter_text, 'i');
            var total = 0;

            s3_read.bucket_objects.Contents = s3_read.bucket_objects.Contents.map(function(object) {
              object.hide = !regex.test(object.Key);
              if(!object.hide)
                total++;
              return object;
            });

            s3_read.filter_status = total + ' objects filtered';
          }, 800)
        }
      }
    }(),
    deleteObject: function(bucket, key) {
      var s3_read = this;

      if(s3_read.is_loading)
        return false;

      if(!confirm('Delete the file\n\n' + key + '\n\nAre you sure?'))
        return false;

      s3_read.state = 'loading';

      s3_read.$parent.deleteObject({
        bucket: bucket.Name,
        key: key
      }).then(function() {
        s3_read.state = 'normal';
        return s3_read.listObjects(bucket);
      })

      return true
    },
    listObjects: function(bucket, from_network) {
      var s3_read = this;

      if(s3_read.is_loading)
        return false;

      s3_read.state = 'loading';
      s3_read.current_bucket = bucket;
      s3_read.filter_text = '';
      s3_read.filter_status = '';
      s3_read.bucket_objects_pages = [];

      var query = {
        bucket: bucket.Name,
        max_keys: s3_read.max_keys
      };

      s3_read.$parent.listObjects(query, from_network).then(function(bucket_objects) {
        s3_read.bucket_objects_pages.push(bucket_objects);
        s3_read.bucket_objects = bucket_objects;
      }).catch(function(error) {
        s3_read.error_message = error;
      }).then(function() {
        s3_read.state = 'normal';
      });
    },
    nextPage: function(bucket, start_after) {
      var s3_read = this;

      if(s3_read.scrollPage(1))
        return true;

      if(s3_read.is_loading)
        return false;

      s3_read.state = 'loading';

      var query = {
        bucket: bucket.Name,
        max_keys: s3_read.max_keys,
        start_after: start_after
      };

      s3_read.$parent.nextPage(query).then(function(bucket_objects) {
        s3_read.bucket_objects_pages.push(bucket_objects);
        s3_read.bucket_objects = bucket_objects;
      }).catch(function(error) {
        s3_read.error_message = error;
      }).then(function() {
        s3_read.filterObjects();
        s3_read.state = 'normal';
      });

      return true;
    },
    previousPage: function() {
      if(this.is_loading)
        return false;

      return this.scrollPage(-1);
    },
    scrollPage: function(scroll) {
      if(this.is_loading)
        return false;

      return this.moveToPage(this.current_page + scroll);
    },
    moveToPage: function(page) {
      var s3_read = this;

      if(s3_read.is_loading)
        return false;

      if(!s3_read.bucket_objects_pages[page])
        return false;

      s3_read.bucket_objects = s3_read.bucket_objects_pages[page];
      s3_read.filterObjects();

      return true;
    }
  }
});
