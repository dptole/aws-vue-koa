!function() {
  importScripts([
    '/components/s3-read/s3-read.js',
    '/components/s3-write/s3-write.js'
  ]).then(function() {
    var div = document.querySelector('div.body');
    if(div) div.classList.add('page-loaded');
    document.body.classList.add('page-loaded');
  }).then(function() {
    new Vue({
      el: '#app',
      data: {
        components: ['s3-read', 's3-write'],
        selected_component: 's3-read',
        s3_region: '/* @echo S3_REGION */',
        bucket_list: null,
        s3_read_data: {
          current_prefix: '',
          bucket_objects: null,
          current_bucket: null,
          current_objects_page: null,
          current_key: null,
          buckets: null,
          filter_text: '',
          filter_status: '',
          state: 'normal' // loading, normal
        },
        s3_write_data: {
          files: [],
          bucket_list: null,
          selected_bucket: null,
          key_name: '',
          last_upload_result: null,
          state: 'normal' // loading, normal
        }
      },
      computed: {
        isLoading: function() {
          return this.s3_read_data.state === 'loading' || this.s3_write_data.state === 'loading';
        }
      },
      methods: {
        getObjectURL: function(bucket_name, object_key) {
          return 'https://s3-' + this.s3_region + '.amazonaws.com/' + (bucket_name + '/' + object_key).replace(/\/\//g, '/');
        },
        changeComponent: function(component) {
          if(this.isLoading)
            return false;
          this.selected_component = component;
          return true;
        },
        serializeQuery: function(query) {
          return Object.keys(query).reduce(function(acc, key) {
            if(
              [key, query[key]].some(function(value) {
                return value === '' || value === undefined || value === null;
              })
            )
              return acc;

            acc.unshift(encodeURIComponent(key) + '=' + encodeURIComponent(query[key]));
            return acc;
          }, []).join('&');
        },
        putObjects: function(files, query) {
          var app = this
            , resolved = []
            , rejected = []
          ;

          return files.reduce(function(promise, file) {
            return promise.then(function() {
              if(files.length < 1)
                return {
                  resolved: resolved,
                  rejected: rejected
                };

              return app.putObject(files.pop(), query).then(function(json) {
                console.log(json)
                resolved.push(json);
              }).catch(function(error) {
                rejected.push(error);
              });
            });
          }, Promise.resolve());
        },
        putObject: function(file, query) {
          var form_data = new FormData;
          form_data.append('file', file);

          var query_string = this.serializeQuery(query);

          return fetch('/api/put_object?' + query_string, {
            method: 'post',
            body: form_data
          }).then(function(response) {
            return response.json();
          });
        },
        listBuckets: function() {
          var app = this;

          if(app.bucket_list)
            return Promise.resolve(app.bucket_list);

          return fetch('/api/list_buckets').then(function(response) {
            return response.json();
          }).then(function(buckets) {
            app.bucket_list = buckets;
            return buckets;
          });
        },
        getObject: function(query) {
          var query_string = this.serializeQuery(query);
          return fetch('/api/get_object?' + query_string).then(function(response) {
            return response.json();
          });
        },
        listObjects: function(query) {
          var query_string = this.serializeQuery(query);
          return fetch('/api/list_objects?' + query_string).then(function(response) {
            return response.json();
          });
        },
        deleteObject: function(query) {
          var query_string = this.serializeQuery(query);
          return fetch('/api/delete_object?' + query_string, {
            method: 'delete'
          }).then(function(response) {
            return response.json();
          });
        }
      }
    });
  });
}()
