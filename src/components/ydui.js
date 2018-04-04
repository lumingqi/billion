// import {
//     Slider, SliderItem,
//     NavBar, NavBarBackIcon, NavBarNextIcon,
//     RollNotice, RollNoticeItem,
//     GridsGroup, GridsItem
// } from 'vue-ydui'
// const components = [
//     Slider, SliderItem,
//     NavBar, NavBarBackIcon, NavBarNextIcon,
//     RollNotice, RollNoticeItem,
//     GridsGroup, GridsItem
// ]
import {CellGroup, CellItem} from 'vue-ydui/dist/lib.rem/cell'
import {Button, ButtonGroup} from 'vue-ydui/dist/lib.rem/button'

console.log('-0--CellGroup',CellGroup)
const components = [
    CellGroup, CellItem,
    Button, ButtonGroup,
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