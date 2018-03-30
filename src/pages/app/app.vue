<template>
    <div >
  <router-view></router-view>
  <lo-nav class="lo_nav"></lo-nav>
    </div>
</template>
<style>
.lo_nav{
    position: fixed;
    bottom: 0;
}
</style>

<script>

import nav from './nav.vue'
export default {
    name: 'app',
    data() {

        return {

        }
    },
    components:{
        'lo-nav':nav
    },
    computed: {

    },
    watch: {},
    methods: {

    }
}
</script>
