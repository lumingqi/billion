<template>
  <div class="person hasfooter">
      <div class="header">
          <yd-navbar title="我 的" bgcolor="#ed293f" fontsize="20px" color="#fff"></yd-navbar>
      </div>
      <yd-cell-group>
        <yd-cell-item arrow>
            <img slot="icon" src="/assets/images/person-active">
            <span slot="left">我的</span>
            <span slot="right">个人信息</span>
        </yd-cell-item>
    </yd-cell-group>
  </div>
</template>

<script>
import Vue from 'vue'
import {CellGroup, CellItem} from 'vue-ydui/dist/lib.rem/cell'
Vue.component(CellGroup.name, CellGroup);
Vue.component(CellItem.name, CellItem);
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

</style>

