import './style/index.css'
import './style/module.css'
import App from './pages/app/app.vue'
import lbCom from './components'
import stores from './stores'
import mixin from './mixins/mixin'
import 'vue-ydui/dist/ydui.base.css'
import YDUI from 'vue-ydui'

Vue.use(Vuex)
Vue.mixin(mixin)
Vue.use(lbCom)
Vue.use(YDUI)



let store = new Vuex.Store(stores)

new Vue({
    el: '#app',
    store,
    render: h => h(App)
})