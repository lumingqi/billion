import './style/index.css'
import './style/module.css'
import App from './pages/app/app.vue'
import router from './router'
// import lbCom from './components'
// import mixin from './mixins/mixin'
import 'vue-ydui/dist/ydui.base.css'
import YDUI from 'vue-ydui'


// Vue.use(Vuex)
// Vue.mixin(mixin)
// Vue.use(lbCom)
Vue.use(YDUI)

new Vue({
    el: '#app',
    router,
    render: h => h(App)
})