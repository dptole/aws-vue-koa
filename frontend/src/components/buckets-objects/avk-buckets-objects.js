
Vue.component('avk-buckets-objects', {
  template: '/* @include avk-buckets-objects.vue.html */',

  data: function() {
    return this.$parent;
  },
  created: function() {
    this.listObjects({
      prefix: ''
    });
  }
})
