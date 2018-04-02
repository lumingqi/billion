import {
    Slider, SliderItem,
    NavBar, NavBarBackIcon, NavBarNextIcon,
    RollNotice, RollNoticeItem,
    GridsGroup, GridsItem
} from 'vue-ydui'
const components = [
    Slider, SliderItem,
    NavBar, NavBarBackIcon, NavBarNextIcon,
    RollNotice, RollNoticeItem,
    GridsGroup, GridsItem
]
const install = function (Vue) {
    if (install.installed) return
    components.map(component => {
        Vue.component(component.name, component)
    })
}
export default {
    version: '1.0.1',
    install
}