var vue_app = new Vue({
  router: router,
  data: {
    // global
    cache_version: '/* @echo CACHE_VERSION */',
    app_loaded: false,
    app_dragover: 'false',
    app_page: '',
    is_online: navigator.onLine,
    toast_offline: null,
    state: 'normal', // normal, loading, error
    // login
    access_key_id: localStorage.last_access_key_id || '',
    secret_access_key: localStorage.last_secret_access_key || '',
    toast_what_is_this: null,
    // dashboard
    buckets: null,
    // buckets objects
    buckets_objects: null,
    list_start_after: [],
    mode: 'normal', // normal, delete
    // delete
    deleting: {},
    delete_multiple: [],
    // progressive web app
    toast_pwa: null,
    toast_pwa_dismissed: localStorage.pwa_installation_dismissed,
    pwa_install_event: null,
    // upload
    files_to_upload: [],
    uploaded_files: 0,
    selected_acl: 'public-read',
    acl_options: [
      'private',
      'public-read',
      'public-read-write',
      'authenticated-read',
      'aws-exec-read',
      'bucket-owner-read',
      'bucket-owner-full-control'
    ],
  },
  computed: {
    is_loading: function() {
      return this.state === 'loading';
    },
    is_normal_mode: function() {
      return this.mode === 'normal';
    },
    is_delete_mode: function() {
      return this.mode === 'delete';
    }
  },
  watch: {
    is_online: function(new_value, old_value) {
      if(!old_value && new_value)
        vue_app.notifyOnline();
      else if(!new_value)
        vue_app.notifyOffline();
    },
    pwa_install_event: function(new_value, old_value) {
      if(!old_value && new_value) {
        if(vue_app.$route.name === 'about')
          vue_app.flashInstallPWAButton();
        else if(!vue_app.toast_pwa_dismissed) {
          vue_app.toast_pwa = Materialize.toast(
            'Install this Progressive Web App in your device for a native experience! ' +
            '<a href="/#/about" class="white-text toast_pwa_install"><i class="material-icons right">phone_iphone</i></a>' +
            '<a href="/#/about" class="white-text toast_pwa_remove"><i class="material-icons right">clear</i></a>'
          );
          vue_app.toast_pwa.el.querySelector('.toast_pwa_install').onclick = vue_app.installPWA;
          vue_app.toast_pwa.el.querySelector('.toast_pwa_remove').onclick = function() {
            vue_app.toast_pwa.remove();
            vue_app.toast_pwa_dismissed = localStorage.pwa_installation_dismissed = 1;
          }
        }
      }
    }
  },
  created: function() {
    this.goToLoginIfUnknownPath();
    this.app_loaded = true;
    if(!this.is_online) this.notifyOffline();
  },
  methods: {
    notifyOnline: function() {
      if(this.toast_offline) {
        this.toast_offline.remove();
        this.toast_offline = null;
      }
      Materialize.toast('We are back! <i class="material-icons right">cloud_done</i>', 2000);
    },
    notifyOffline: function() {
      if(this.toast_offline) this.toast_offline.remove();
      this.toast_offline = Materialize.toast('You are offline now. <i class="material-icons right">cloud_off</i>');
    },
    whatIsThis: function() {
      if(this.toast_what_is_this) return;
      this.toast_what_is_this = Materialize.toast(
        '<a href="https://github.com/dptole/aws-vue-koa" target="_blank" class="white-text">' +
          'Manage your S3 buckets with AVK.' +
        '</a> ' +
        '<i class="material-icons right red-text">favorite</i>',
        3000,
        '',
        function() {
          vue_app.toast_what_is_this = null;
        }
      );
    },
    flashInstallPWAButton: function() {
      document.documentElement.scrollTop = document.documentElement.scrollHeight;

      var install_pwa = $('#install_pwa')
        , total_toggles = 4
      ;

      var interval = setInterval(function() {
        if(total_toggles < 1) {
          if(!install_pwa.hasClass('green'))
            install_pwa.addClass('green').removeClass('orange');
          return clearInterval(interval);
        }

        if(install_pwa.hasClass('green')) {
          install_pwa.addClass('orange').removeClass('green');
          total_toggles--;
        } else
          install_pwa.addClass('green').removeClass('orange');

      }, 400);
    },
    installPWA: function() {
      if(this.pwa_install_event) {
        this.pwa_install_event.prompt();
        if(this.toast_pwa) this.toast_pwa.remove();
      }
    },
    refreshCurrentFolder: function() {
      if(vue_app.buckets_objects)
        vue_app.listObjects({
          prefix: vue_app.buckets_objects.Prefix
        }, '/* @echo REQUEST_SEARCH_OUTSIDE */')
    },
    requestNewVersion: function() {
      this.state = 'loading';
      $('.button-collapse').sideNav('hide');

      return caches.open(vue_app.cache_version).then(function(cache) {
        return cache.keys().then(function(keys) {
          return keys.reduce(function(promise, key) {
            return promise.then(function() {
              return cache.delete(key).catch(function() {});
            })
          }, Promise.resolve());
        })
      }).then(function() {
        navigator.serviceWorker.getRegistrations().then(function(registrations) {
          return registrations.reduce(function(promise, registration) {
            return promise.then(function() {
              return registration.update();
            })
          }, Promise.resolve());
        })
      }).then(function() {
        setTimeout(function() {
          location.reload();
        }, 1000);
      });
    },
    containFiles: function() {
      return this.buckets_objects && this.buckets_objects.Contents.filter(function(content) {
        return content.Key !== vue_app.buckets_objects.Prefix;
      }).length > 0;
    },
    containFolders: function() {
      return this.buckets_objects && this.buckets_objects.CommonPrefixes.filter(function(common_prefix) {
        return common_prefix.Prefix !== vue_app.buckets_objects.Prefix;
      }).length > 0;
    },
    containFilesOrFolders: function() {
      return vue_app.containFiles() || vue_app.containFolders();
    },
    countFilesToDelete: function() {
      return this.getFilesToDelete().length;
    },
    deleteMode: function() {
      this.mode = 'delete';
      $('.button-collapse').sideNav('hide');
    },
    normalMode: function() {
      this.mode = 'normal';
    },
    getFilesToDelete: function() {
      return this.delete_multiple.map(function(del, index) {
        return del ? index : -1;
      }).filter(function(index) {
        return ~index;
      }).map(function(index) {
        return vue_app.buckets_objects.Contents[index];
      }).filter(function(value) {
        return value;
      });
    },
    startMaterialSelect: function() {
      requestAnimationFrame(function() {
          $('select').material_select();
      });
    },
    navbarGoTo: function(url) {
      if(this.is_loading)
        return false;
      $('.button-collapse').sideNav('hide');
      this.$router.push(url);
    },
    goToDashboard: function() {
      if(this.is_loading)
        return false;
      this.$router.push('/dashboard');
    },
    goToLoginIfUnknownPath: function() {
      var matched = router.getMatchedComponents(location);
      if(!matched.length)
        router.push('/login');
    },
    listObjects: function(bucket, mode) {
      if(vue_app.is_loading)
        return false;
      vue_app.state = 'loading';

      function successResponse(response) {
        return response.json().then(function(buckets_objects) {
          var root = new String(vue_app.$route.params.bucket);
          root.breadcrumbs = '';

          vue_app.buckets_objects = buckets_objects;
          vue_app.buckets_objects.prefix_array = vue_app.buckets_objects.Prefix.split('/').filter(function(identity) {
            return identity;
          });

          vue_app.buckets_objects.prefix_array = [
            root
          ].concat(
            vue_app.buckets_objects.prefix_array.reduce(function(acc, prefix) {
              var pref = new String(prefix);
              acc.push(pref);
              pref.breadcrumbs = acc.join('/') + '/';
              return acc;
            }, [])
          );

          if(bucket.start_after)
            vue_app.list_start_after.push(bucket.start_after);
          else
            vue_app.list_start_after = [];
        }).catch(errorResponse);
      }

      function errorResponse(error) {
        console.log(error);
      }

      function cleanUpResponse() {
        vue_app.state = 'normal';
      }

      if(mode === 'previous') {
        bucket.prefix = bucket.prefix.match(/[^\/]+/g);
        if(bucket.prefix) {
          bucket.prefix.pop();
          bucket.prefix = bucket.prefix.join('/');
          if(bucket.prefix)
            bucket.prefix += '/';
        } else
          bucket.prefix = ''
      }

      var querystring = vue_app.serializeQueryString([
        ['bucket', vue_app.$route.params.bucket],
        ['max_keys', 10],
        ['delimiter', '/'],
        ['prefix', bucket.prefix],
        ['start_after', bucket.start_after || '']
      ]);

      var options = {}

      if(mode === '/* @echo REQUEST_SEARCH_OUTSIDE */')
        options.headers = {
          '/* @echo REQUEST_SEARCH_TARGET */': '/* @echo REQUEST_SEARCH_OUTSIDE */'
        }

      fetch('/api/list_objects?' + querystring, options).then(function(response) {
        return response.status === 200
          ? successResponse(response)
          : errorResponse(response)
      }).then(cleanUpResponse);
    },
    nextPage: function() {
      vue_app.listObjects({
        prefix: vue_app.buckets_objects.Prefix,
        start_after: [].concat(
          vue_app.buckets_objects.CommonPrefixes.map(function(p) { return p.Prefix; }),
          vue_app.buckets_objects.Contents.map(function(c) { return c.Key; })
        ).pop()
      });
    },
    previousPage: function() {
      vue_app.listObjects({
        prefix: vue_app.buckets_objects.Prefix,
        start_after: (vue_app.list_start_after.pop(), vue_app.list_start_after.pop())
      });
    },
    getObject: function(content) {
      var querystring = vue_app.serializeQueryString([
        ['bucket', vue_app.$route.params.bucket],
        ['key', content.Key]
      ]);

      window.open('/api/get_object/' + content.Key + '?' + querystring);
    },
    serializeQueryString: function(qs) {
      return [
        ['access_key_id', vue_app.access_key_id],
        ['secret_access_key', vue_app.secret_access_key]
      ].concat(qs).reduce(function(acc, query) {
        return acc.concat(encodeURIComponent(query[0]) + '=' + encodeURIComponent(query[1]));
      }, []).join('&');
    },
    readEntries: function(entries) {
      return entries.reduce(function(promise, entry) {
        return promise.then(function(acc) {
          return vue_app.readEntry(entry).then(function(file_objects) {
            return acc.concat(file_objects);
          });
        });
      }, Promise.resolve([]));
    },
    readEntry: function(entry) {
      return new Promise(function(resolve, reject) {
        var left_to_read = 1
          , files = []
        ;

        function filesPushCallback(entry, file, error) {
          files.push({
            filename: entry.fullPath.replace(/^\//, ''),
            file: file,
            error: error
          });

          if(left_to_read < 1)
            resolve(files);
        }

        (function readEntryIter(entry, callback) {
          if(entry.isDirectory) {
            entry.createReader().readEntries(function(entries) {
              left_to_read += entries.length - 1;
              for(var i = 0; i < entries.length; i++)
                readEntryIter(entries[i], callback);
            }, function(error) {
              left_to_read--;
              callback(entry, null, error);
            });
          } else if(entry.isFile) {
            entry.file(function(file) {
              left_to_read--;
              callback(entry, file, null);
            });
          }
        })(entry, filesPushCallback);
      });
    },
    listDropToUpload: function(event) {
      var entries = Array.from(event.dataTransfer.items).map(function(item, index) {
        return item.webkitGetAsEntry();
      });

      return vue_app.readEntries(entries).then(function(file_objects) {
        return vue_app.files_to_upload = vue_app.files_to_upload.concat(
          file_objects.map(function(file_object) {
            return {
              filename: file_object.filename,
              file_object: file_object.file,
              status: 'waiting'
            }
          })
        );
      });
    }
  }
}).$mount('#app');