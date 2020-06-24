import Taro, { PureComponent } from '@tarojs/taro'
import {
  View, Text
} from '@tarojs/components'
import {
  DISTRIBUTOR_ORDER_TYPE
} from '../../../config/config'
import './recordDetail.scss'
const dayjs = require('dayjs')

export default class RecordDetail extends PureComponent {

  config = {
    navigationBarTitleText: '分销收益详情',
    navigationBarTextStyle: 'black',
    navigationBarBackgroundColor: '#ffffff'
  }

  constructor() {
    super()
  }

  render() {
    const {
      balance, profit, addDate, orderSn,
      level, pattern, distributorGoodsName,
      distributorTargetUserName, actualPayment,
      refunsFlag
    } = this.$router.preload || {}
    const distributorTeam = level === 1 ? '自己' : (level === 2 ? '一级团队' : '二级团队')
    const distributorName = level !== 1 && distributorTargetUserName
    return (
      <View className="flex-col page">
        <Text className="title">{balance || refunsFlag ? '获得收益' : '预计收益'}</Text>
        <Text className="earnings">{`￥${profit}`}</Text>
        <View className="item flex-row">
          <Text>分享类型</Text>
          <Text>
            {DISTRIBUTOR_ORDER_TYPE.find(ele => ele.value === pattern) && DISTRIBUTOR_ORDER_TYPE.find(ele => ele.value === pattern).label}
            \n
            {distributorGoodsName || '--'}
          </Text>
        </View>
        {/* <View className="item">
          <Text>订单金额</Text>
          <Text>{`￥${refunsFlag ? 0 : actualPayment}`}</Text>
        </View>
        <View className="item">
          <Text>分享者</Text>
          <Text>{`${distributorTeam} ${distributorName ? `(${distributorName})` : ''}`}</Text>
        </View> */}
        <View className="item">
          <Text>订单状态</Text>
          <Text className={balance ? 'finish' : 'underway'}>{refunsFlag ? '已退款' : balance ? '已完成' : '进行中'}</Text>
        </View>
        <View className="item">
          <Text>收益时间</Text>
          <Text>{dayjs(addDate).format('YYYY年MM月DD日 HH:mm:ss')}</Text>
        </View>
        <View className="item">
          <Text>订单编号</Text>
          <Text>{orderSn}</Text>
        </View>
        <View className="item">
          <Text>交易编号</Text>
          <Text>{orderSn}</Text>
        </View>
        {/* 自定义导航 */}
        <custom-tab-bar></custom-tab-bar> 
      </View>
    )
  }
}
