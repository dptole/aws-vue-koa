
Vue.component('avk-nav', {
  template: '/* @include avk-nav.vue.html */',

  data: function() {
    return this.$parent;
  },
  created: function() {
    requestAnimationFrame(function() {
      $('.button-collapse').sideNav();
    });
  }
})
