<template>
    <yd-tabbar>
        <yd-tabbar-item title="首页" link="#">
            <yd-icon name="home" slot="icon" size="0.54rem"></yd-icon>
        </yd-tabbar-item>
        <yd-tabbar-item title="购物车" link="#">
            <yd-icon name="shopcart-outline" slot="icon" size="0.54rem"></yd-icon>
        </yd-tabbar-item>
        <yd-tabbar-item title="个人中心" link="#">
            <yd-icon name="ucenter-outline" slot="icon" size="0.54rem"></yd-icon>
        </yd-tabbar-item>
        <yd-tabbar-item title="图片" link="#">
            <img slot="icon" src="http://static.ydcss.com/ydui/img/logo.png">
        </yd-tabbar-item>
    </yd-tabbar>
</template>

<script type="text/babel">
    export default {
        
    }
</script>