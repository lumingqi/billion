<template>

        
            <img :src="icon11"  size="0.54rem">

</template>

<script type="text/babel">
import icon11 from '@/images/trend.png'
    name:'navimg'
    export default {
        data() {
            return {
                istrend:true,

            }
        },
        watch: {
        },
        computed: {
            
        },
        mounted(){
            
        },
        methods: {
            // routelinkchange(){
            //     let path = this.$route.path
            //     // console.log(path)
            //     if(path=='/'||path=="/trend"){
            //         this.istrend=true
            //         this.isdetailview=false
            //         this.isexplain=false
            //         this.isperson=false
            //         console.log('0000',this.istrend,this.isdetailview,this.isexplain,this.isperson)
            //     }else if(path=='/detailview'){
            //         this.isdetailview=true
            //         this.istrend=false
            //         this.isexplain=false
            //         this.isperson=false
            //         console.log('0000',this.istrend,this.isdetailview,this.isexplain,this.isperson)
            //     }else if(path=='/explain'){
            //         this.isdetailview=false
            //         this.istrend=false
            //         this.isexplain=true
            //         this.isperson=false
            //         console.log('0000',this.istrend,this.isdetailview,this.isexplain,this.isperson)
            //     }else if(path=='/person'){
            //         this.isdetailview=false
            //         this.istrend=false
            //         this.isexplain=false
            //         this.isperson=true
            //         console.log('0000',this.istrend,this.isdetailview,this.isexplain,this.isperson)
            //     }
            // }
        }
    }
</script>
<style>
.yd-tabbar-icon img{
    height: 83% !important;
}
</style>
