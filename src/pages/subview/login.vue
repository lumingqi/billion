<template>
  <div class="login">
      <div class="header">
          <yd-navbar title="账户登录" fontsize="20px" color="#fff" bgcolor="#ed293f">
                  <router-link to="/person" slot="left">
                    <yd-navbar-back-icon></yd-navbar-back-icon>
                  </router-link>
              
                  <router-link to="/register" slot="right">
                    <span>前进</span>
                  </router-link>
          </yd-navbar>
      </div>
      <div class="userpassword">
          <yd-cell-group>
            <yd-cell-item>
                <span slot="left">账号：</span>
                <yd-input slot="right" v-model="input1" regex="mobile" placeholder="请输入手机号码"></yd-input>
            </yd-cell-item>

            <yd-cell-item>
                <span slot="left">密码：</span>
                <yd-input slot="right" v-model="input2" type="password" placeholder="请输入密码"></yd-input>
            </yd-cell-item>
        </yd-cell-group>
      </div>
      
  </div>
</template>

<script>

import Vue from 'vue'
import {NavBar, NavBarBackIcon, NavBarNextIcon} from 'vue-ydui/dist/lib.rem/navbar'
import {Input} from 'vue-ydui/dist/lib.rem/input'

Vue.component(NavBar.name, NavBar)
Vue.component(NavBarBackIcon.name, NavBarBackIcon)
Vue.component(NavBarNextIcon.name, NavBarNextIcon)
Vue.component(Input.name, Input)

export default {
    name: 'login',
    data() {
        return {
            input1:'',
            input2:''
        }
    },
    created() {

    },
    mounted() {
        
    },
    computed: {

    },
    methods: {
         
    },


}
</script>
<style>
.userpassword{
    height: 5% !important;
}
</style>

