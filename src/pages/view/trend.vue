<template>
  <div class="trend hasfooter">
      <div class="header">
          <yd-navbar title="主页" bgcolor="#ed293f" fontsize="20px" color="#fff"></yd-navbar>
      </div>
      <div class="slider">
        <yd-slider autoplay="3000">
            <template v-for="item in Sliderdata">
                <yd-slider-item>
                    <a :href="item.to">
                        <img :src="item.src">
                    </a>
                </yd-slider-item>
            </template>
        </yd-slider>
      </div>
      <div class="rollnotice">
          <!-- <img src="//st.360buyimg.com/m/images/index/jd-news-tit.png"> -->
          <yd-rollnotice autoplay="2000" align="center">
              <template v-for="item in rollnoticedata">
                <yd-rollnotice-item><span style="color:#F00;"> {{item.icon}} </span>{{item.content}}</yd-rollnotice-item>
              </template>
          </yd-rollnotice>
      </div>
      <div class="group">
          <!-- <yd-grids-group :rows="2"> -->
              <template v-for="item in groupdata">
            <!-- <yd-grids-item v-for="item in groupdata"> -->
                <div class="groupitem">
                    <img slot="icon" :src="item.src">
                    <p slot="text">{{item.text}}</p>
                </div>
            <!-- </yd-grids-item> -->
             </template>
          <!-- </yd-grids-group> -->
      </div>
  </div>
</template>


<script>
import Vue from 'vue'
import {Slider, SliderItem} from 'vue-ydui/dist/lib.rem/slider'
import {NavBar, NavBarBackIcon, NavBarNextIcon} from 'vue-ydui/dist/lib.rem/navbar'
import {RollNotice, RollNoticeItem} from 'vue-ydui/dist/lib.rem/rollnotice'
Vue.component(NavBar.name, NavBar)
Vue.component(NavBarBackIcon.name, NavBarBackIcon)
Vue.component(NavBarNextIcon.name, NavBarNextIcon)
Vue.component(Slider.name, Slider)
Vue.component(SliderItem.name, SliderItem)
Vue.component(RollNotice.name, RollNotice)
Vue.component(RollNoticeItem.name, RollNoticeItem)
export default {
    
    name: 'trend',
    
    data() {
        return {
            Sliderdata:[
                {to:'#/detailview',src:'/assets/images/1.jpg'},
                {to:'#/explain',src:'/assets/images/2.jpg'},
                {to:'#/person',src:'/assets/images/3.jpg'}
            ],
            rollnoticedata:[
                {icon:'荐',content:'荣耀V9 3月超级钜惠！'},
                {icon:'推荐',content:'3.23京东超级品牌日格力盛典'},
                {icon:'超推荐',content:'京东服饰 早春新品低至7折'}
            ],
            groupdata:[
                {src:'/assets/images/3.jpg',text:'网格1'},
                {src:'/assets/images/3.jpg',text:'网格2'},
                {src:'/assets/images/3.jpg',text:'网格3'},
                {src:'/assets/images/3.jpg',text:'网格4'},
                {src:'/assets/images/3.jpg',text:'网格5'},
                {src:'/assets/images/3.jpg',text:'网格6'},
                {src:'/assets/images/3.jpg',text:'网格7'},
                {src:'/assets/images/3.jpg',text:'网格8'},
                {src:'/assets/images/3.jpg',text:'网格9'},
                {src:'/assets/images/3.jpg',text:'网格10'},
            ]
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
.slider{
    height: 31%;
}
.group{
    display: flex;
    flex-wrap: wrap;
    background-color: #fff;
    border-top: 1px solid #ddd;
}
.groupitem:nth-child(Odd){
    width: 50%;
    box-sizing:border-box;
    border-bottom: 1px solid #ddd;
    border-right: 1px solid #ddd;
}
.groupitem:nth-child(even){
    width: 50%;
    box-sizing:border-box;
    border-bottom: 1px solid #ddd;
}
.groupitem img{
    display:block;
    max-width:100%;
    height:auto;
    padding: 10px;
}
.groupitem p{
    text-align: center;
}
</style>

