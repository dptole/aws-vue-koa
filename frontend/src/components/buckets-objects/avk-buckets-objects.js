
Vue.component('avk-buckets-objects', {
  template: '/* @include avk-buckets-objects.vue.html */',

  data: function() {
    return this.$parent;
  },
  created: function() {
    if(!this.buckets_objects)
      this.listObjects({
        prefix: ''
      });
  }
})
