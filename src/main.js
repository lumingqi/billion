import './style/index.css'
import './style/module.css'
import App from './pages/app/app.vue'
import lbCom from './components'
// import yduicom from './components/ydui.js'
import stores from './stores'
import router from './router/index'
import mixin from './mixins/mixin'
import 'vue-ydui/dist/ydui.base.css'
import YDUI from 'vue-ydui'

Vue.use(Vuex)
Vue.mixin(mixin)
Vue.use(lbCom)
// Vue.use(yduicom)
Vue.use(YDUI)



let store = new Vuex.Store(stores)

new Vue({
    el: '#app',
    store,
    router,
    render: h => h(App)
})