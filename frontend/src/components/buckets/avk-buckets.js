
Vue.component('avk-buckets', {
  template: '/* @include avk-buckets.vue.html */',

  data: function() {
    return this.$parent;
  },
  created: function() {
    this.buckets_objects = null;
  }
})
