<template>
  <div class="person hasfooter">
      <div class="header">
          <yd-navbar title="我 的" bgcolor="#ed293f" fontsize="20px" color="#fff"></yd-navbar>
      </div>
      <yd-cell-group>
        <yd-cell-item arrow type="a" href="#/login">
            <img class="uerimages" slot="icon" src="/assets/images/person-active.png">
            <span slot="left">我的</span>
            <span slot="right">个人信息</span>
        </yd-cell-item>
      </yd-cell-group>
      <yd-cell-group class="personlist">
        <yd-cell-item arrow type="a" href="tel:400-888-8888">
            <span slot="left">这里是一个A链接</span>
        </yd-cell-item>
        <yd-cell-item arrow type="label">
            <span slot="left">这里是一个Router-Link链接</span>
        </yd-cell-item>
        <yd-cell-item arrow type="label">
            <span slot="left">这里是一个Label</span>
        </yd-cell-item>
        <yd-cell-item arrow>
            <span slot="left">这里是一个普通DIV</span>
        </yd-cell-item>
      </yd-cell-group>
      <yd-button-group>
            <yd-button size="large" bgcolor="#ed293f" color="#fff">退出登录</yd-button>
      </yd-button-group>
  </div>
</template>


<script>
import Vue from 'vue'
import {CellGroup, CellItem} from 'vue-ydui/dist/lib.rem/cell'
import {Button, ButtonGroup} from 'vue-ydui/dist/lib.rem/button'

Vue.component(CellGroup.name, CellGroup)
Vue.component(CellItem.name, CellItem)
Vue.component(Button.name, Button)
Vue.component(ButtonGroup.name, ButtonGroup)
export default {
    name: 'person',
    data() {
        return {
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
.uerimages{
    height: 1.5rem !important;
    margin: 0.3rem 0;
}
.personlist{
    margin-top: 0.5rem !important;
}
</style>

