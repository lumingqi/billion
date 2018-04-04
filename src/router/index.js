
import Vue from 'vue'
import VueRouter from 'vue-router'
import trend from '../pages/view/trend.vue'
import detailview from '../pages/view/detailview.vue'
import person from '../pages/view/person.vue'
import explain from '../pages/view/explain.vue'
//二级页面
import login from '../pages/subview/login.vue'

Vue.use(VueRouter)

export default new VueRouter({
    routes: [
        {
            path: '/',
            name: 'trends',
            component: trend
          },
          {
            path: '/trend',
            name: 'trend',
            component: trend
          },
          {
            path: '/detailview',
            name: 'detailview',
            component: detailview
          },
          {
            path: '/explain',
            name: 'explain',
            component: explain
          },
          {
            path: '/person',
            name: 'person',
            component: person
          },
          //二级页面
          {
            path: '/login',
            name: 'login',
            component: login
          }
    ]
})