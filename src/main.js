import Vue from 'vue'
import App from './App.vue'
import store from './store'
import Vuetify from 'vuetify/lib'
import vuetify from './plugins/vuetify';

Vue.use(Vuetify)

Vue.config.productionTip = false

new Vue({
  store,
  vuetify,
  render: h => h(App)
}).$mount('#app')
