<template>
    <yd-tabbar active-color="#ed293f">
        <yd-tabbar-item title="首页" link="/" :active="istrend">
            <yd-icon name="home" slot="icon" size="0.54rem" active></yd-icon>
        </yd-tabbar-item>
        <yd-tabbar-item title="购物车" link="/detailview" :active="isdetailview">
            <yd-icon name="shopcart-outline" slot="icon" size="0.54rem"></yd-icon>
        </yd-tabbar-item>
        <yd-tabbar-item title="个人中心" link="/explain" :active="isexplain">
            <yd-icon name="ucenter-outline" slot="icon" size="0.54rem"></yd-icon>
        </yd-tabbar-item>
        <yd-tabbar-item title="图片" link="/person" :active="isperson">
            <img slot="icon" src="http://static.ydcss.com/ydui/img/logo.png">
        </yd-tabbar-item>
    </yd-tabbar>
</template>

<script type="text/babel">
    export default {
        data() {
            return {
                istrend:true,
                isdetailview:false,
                isexplain:false,
                isperson:false
            }
        },
        watch: {
            "$route":"routelinkchange"
        },
        computed: {

        },

        methods: {
            routelinkchange(){
                let path = this.$route.path
                // console.log(path)
                if(path=='/'||path=="/trend"){
                    this.istrend=true
                    this.isdetailview=false
                    this.isexplain=false
                    this.isperson=false
                    console.log('0000',this.istrend,this.isdetailview,this.isexplain,this.isperson)
                }else if(path=='/detailview'){
                    this.isdetailview=true
                    this.istrend=false
                    this.isexplain=false
                    this.isperson=false
                    console.log('0000',this.istrend,this.isdetailview,this.isexplain,this.isperson)
                }else if(path=='/explain'){
                    this.isdetailview=false
                    this.istrend=false
                    this.isexplain=true
                    this.isperson=false
                    console.log('0000',this.istrend,this.isdetailview,this.isexplain,this.isperson)
                }else if(path=='/person'){
                    this.isdetailview=false
                    this.istrend=false
                    this.isexplain=false
                    this.isperson=true
                    console.log('0000',this.istrend,this.isdetailview,this.isexplain,this.isperson)
                }
            }
        }
    }
</script>