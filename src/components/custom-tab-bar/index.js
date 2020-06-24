import Taro, { Component } from "@tarojs/taro"
import { connect } from "@tarojs/redux"
import { CoverView, CoverImage } from "@tarojs/components"
import "./index.scss"
import { getServerPic, getTabBarPages } from "../../utils/utils"

@connect(({common})=>{
    return {
        tabBarConfig: common.tabBarConfig,
        isFullScreen: common.isFullScreen,   
    }
})
export default class CustomTabBar extends Component{
    constructor(){
        super()
        this.state = {
            current: 0,
            currentUrl: '',
            listUrls: [],
        }
    }
    componentDidMount(){
        this.props.dispatch({
            type: 'common/getTabBarAction',
            callback:(res)=>{
                this.getListUrls();
            }
        })
    }
    componentDidUpdate(prevProps){
        if(prevProps.tabBarConfig!==this.props.tabBarConfig){
            this.getListUrls();
        }
    }
    onPullDownRefresh(){
        console.log("<=============组件下拉事件===========>")
        this.props.dispatch({
            type: 'common/getTabBarAction',
            callback:(res)=>{
                this.getListUrls();
            }
        })
    }
    getListUrls=()=>{
        const list = this.props.tabBarConfig;
        const urls = list.map((item)=>{
            return getTabBarPages(item)
        })
        let path = Taro.getCurrentPages()[Taro.getCurrentPages().length-1].route;
        const currentIndex = urls.findIndex(n => n && n.replace(/\?\S+/,"")=== '/'+path);
        this.setState({
            current: currentIndex,
            listUrls: urls,
        })
    }
    // getTabBarAction
    handleClick (value) {
        let url = this.state.listUrls[value];
        console.log("tabbar切换跳转的路径==================》",url)
        (url && Taro.reLaunch({ url: url }))
        this.setState({
            current: value,
            currentUrl: url,
        })
    }
    render () {
        const { current } = this.state;
        const { tabBarConfig=[], isFullScreen } = this.props;
        return current===-1? null : (<View className={`customView ${isFullScreen?"isFullScreen":''}`}>
            <View className="customTabBarBox">
                {this.props.children}
                <View className={`customViewBox ${isFullScreen?"isFullScreen":''}`}>
                    <CoverView className={`customTabBar ${isFullScreen?"isFullScreen":''}`}>
                        <CoverView className="customTabBarContent">
                            <CoverView className="tabBarList">
                                {tabBarConfig.map((item, index)=>(<CoverView key={item.id} onClick={()=>this.handleClick(index, item)} className={`tabBarItem ${index === current ? "tabarSelected" : ""}`}>
                                    <CoverImage className="tabBarIcon" mode="aspectFit" src={index === current ? getServerPic(item.selectIconUrl): getServerPic(item.originalIconUrl)}/>
                                    <CoverView className="tabBarText">{item.iconName}</CoverView>
                                </CoverView>))}
                            </CoverView>
                        </CoverView>
                    </CoverView>        
                </View>
            </View>
        </View>)
    }
}
