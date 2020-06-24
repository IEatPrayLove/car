import { Component } from "@tarojs/taro";
import { 
    View,
    Text,
    ScrollView,
    Button,
    Image,
    Map,
    CoverView,
} from "@tarojs/components";
import "./packagePayConfirm.scss"
import { Payment } from "../../components/Payment/Payment"
import { STATIC_IMG_URL } from '../../config/baseUrl'


export default class PackagePayConfirm extends Component{
    config = {
        navigationBarBackgroundColor: '#FF633D',
        navigationBarTextStyle: "white",
        navigationBarTitleText: '订单详情'
    };
    constructor(){
        super();
        this.state={
            payBoxVisible: false,
            // map:{
            //     latitude: 30.663562,
            //     longitude: 104.070781,
            // },
            // markers: [
            //     {
            //         latitude: 30.663562, // 104.070781,30.663562
            //         longitude: 104.070781,
            //         iconPath: 'https://oss.holderzone.net/framework-prod/2020-01-01/1577881038130_ce752.jpg',
            //         width: '30',
            //         height: '30',
            //         callout:{
            //             content: "<view>6666</view>",
            //             color: '#000',
            //             anchorX: 50
            //         }
            //     }
            // ]
        }
    }
    render(){
        let { map, markers, payBoxVisible } = this.state;
        return (
            <View className="pay-confirm at-row">
                <ScrollView className="pay-confirm-box" scrollY>
                    <View className="scroll_box">
                        <View className="userInfo">
                            <View className="userInfoBox">
                                <View className="address">
                                    <Image className="address-icon" src={STATIC_IMG_URL+'/icon/localtion.png'}></Image>
                                    <View className="textBox">
                                        <View className="merchantName">何时烧烤（丽都店）</View>
                                        <View className="merchantAddress">开废话卡的卡卡借记卡萨芬</View>
                                    </View>
                                </View>
                                <View className="userName at-row">
                                    <View className="label at-col-3">取餐人</View>
                                    <View className="value ar-col-auto">罗师傅</View>
                                </View>
                                <View className="userPhone at-row">
                                    <View className="label at-col-3">预留手机</View>
                                    <View className="value ar-col-auto">1452213234</View>
                                </View>
                                <View className="userTime at-row">
                                    <View className="label at-col-3">预定时间</View>
                                    <View className="value ar-col-auto">余额16：50可取餐</View>
                                </View>    
                            </View>
                            {/* <View className="mapBox">
                                <Map layer-style="" latitude={map.latitude} longitude={map.longitude} className="map" markers={markers}></Map>
                            </View> */}
                        </View>
                        <View className="payOther">
                            <View className="packageInfo">
                                <View className="merchantInfo at-row at-row__align--center">
                                    <View className="merchant-icon">
                                        <Image></Image>
                                    </View>
                                    <View className="merchant-name">
                                        何时烧烤（丽都店）
                                    </View>
                                </View>
                                <View className="packageList">
                                    <View className="packageItem">
                                        <Image className="packageImg"></Image>
                                        <View className="packageDetail">
                                            <View className="packageName">行走在舌尖上的HE'S烧烤</View>
                                            <View className="packageSKU">大份/微辣</View>
                                        </View>
                                        <View className="packageNum"><Text className="small">×</Text>3</View>
                                        <View className="packagePrice"><Text className="small">￥</Text>17</View>
                                    </View>
                                </View>
                            </View>
                            <View className="payInfoList">
                                <View className="payInfoItem at-row at-row__justify--between at-row__align--center">
                                    <View className="infoItemLabel">小计</View>
                                    <View className="infoItemValue font-30">￥234</View>
                                </View>
                                <View className="payInfoItem at-row at-row__justify--between at-row__align--center">
                                    <View className="infoItemLabel">桌台费</View>
                                    <View className="infoItemValue">￥234</View>
                                </View>
                                <View className="payInfoItem at-row at-row__justify--between at-row__align--center">
                                    <View className="infoItemLabel">会员价</View>
                                    <View className="infoItemValue"><Text className="num">￥234</Text></View>
                                </View>
                                <View className="payInfoItem at-row at-row__justify--between at-row__align--center">
                                    <View className="infoItemLabel"><Text className="tag">满减</Text>    满50减20(19.00元不参与折扣) </View>
                                    <View className="infoItemValue"><Text className="num">￥234</Text></View>
                                </View>
                                <View className="payInfoItem at-row at-row__justify--between at-row__align--center">
                                    <View className="infoItemLabel"><Text className="tag">优惠券</Text>会员专享优惠券</View>
                                    <View className="infoItemValue"><Text className="num">￥234</Text></View>
                                </View>
                            </View>
                            <View className="payInfoNums at-row at-row__justify--end at-row__align--center">
                                <View><Text className="payInfoDiscount">已优惠16.00元</Text>总计<Text className="payTotal">￥<Text className="num">155</Text></Text></View>
                            </View>    
                        </View>    
                    </View>
                    
                    
                </ScrollView>
                <View className="fixed-btns">
                    <View className="fixed-btns-box">
                        <View className="textBox">
                            <View className="discount">已优惠<Text className="discount-num">￥155</Text></View>
                            <View className="text">￥1552.6</View>
                        </View>
                        <Button className="confirm-btn" hoverClass="hoverBtn"onClick={()=>this.setState({payBoxVisible: true})}>确认支付</Button>
                    </View>
                </View>
                {/* 
                    paymentAmount = 0, 
                    payment = PAY_WECHAT, 
                    onChange, 
                    createOrder, 
                    payBoxVisible, 
                    otherwxtoken, 
                    otherstate = null, 
                    otheropenId, 
                    otherenterpriseGuid, 
                    orderSn = null,
                */}
                <Payment payBoxVisible={payBoxVisible} closePayment={()=>this.setState({payBoxVisible: false})}></Payment>
            </View>
        )
    }
}