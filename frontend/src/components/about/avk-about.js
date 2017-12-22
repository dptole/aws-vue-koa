
Vue.component('avk-about', {
  template: '/* @include avk-about.vue.html */',

  data: function() {
    return this.$parent;
  },
  created: function() {
    this.buckets_objects = null;

    requestAnimationFrame(function() {
      $('#modal_drop_object').modal();
    });
  }
})
