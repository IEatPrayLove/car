import Taro from '@tarojs/taro'
import { View } from '@tarojs/components'
import { AtActivityIndicator } from 'taro-ui'
import './PageLoading.scss'

export default function PageLoading({ content = '加载中' }) {
  return (
    <View className="pageLoading">
      <AtActivityIndicator mode="center" content={content} />
    </View>
    // <View className="loading1">
    //   <Image className='showImg' src='https://cydl-resource.oss-cn-zhangjiakou.aliyuncs.com/island-zhuancan/loading.gif' />
    // </View>
  )
}
