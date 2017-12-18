
Vue.component('avk-buckets-objects', {
  template: '/* @include avk-buckets-objects.vue.html */',

  data: function() {
    return this.$parent;
  },
  created: function() {
    var comp = this;
    if(comp.is_loading)
      return false;
    comp.getObjects({
      prefix: ''
    });
  }
})
