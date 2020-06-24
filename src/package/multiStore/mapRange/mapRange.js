import Taro, { Component } from '@tarojs/taro'
import {
  CoverImage, CoverView, Map, View, Text
} from '@tarojs/components'
import {
  saveUserLocation, showToast, navToPage, locationArea, latelyMerchant
} from '../../../utils/utils'
import './mapRange.scss'
import { connect } from '@tarojs/redux'
import locationIcon from '../../../images/icon/icon_location_red.png'
import merchantIcon from '../../../images/icon/icon_merchant.png'
import { STATIC_IMG_URL } from '../../../config/baseUrl'

@connect(({ index, loading }) => ({}))
class MapRange extends Component {
    config = {
      navigationBarTitleText: '地图'
    };

    constructor() {
      super()
      this.state = {
        latitude: null,
        longitude: null,
        markers: null,
        polygon: null,
        rangArea: null,
        location: {
          latitude: null,
          longitude: null,
          address: null,
          name: null
        }
      }
    }

    componentWillMount() {
      Taro.setNavigationBarColor({
        backgroundColor: Taro.getStorageSync('systemColor'),
        frontColor: "#ffffff"
      })
      const {
        latitude, longitude, range, selfSend
      } = this.$router.params
      const shippingRange = []
      const markers = []
      let rangArea = []
      const rangeArea = JSON.parse(range)
      if (selfSend === 'true') {
        rangeArea[0].shippingRange.map((item, index) => {
          if (item.range !== null) {
            rangeArea.reduce((acc, { shippingRange, position }, index) => {
              const [longitude, latitude] = position.split(',')
              markers.push({
                iconPath: merchantIcon,
                id: index,
                latitude,
                longitude,
                width: 30,
                height: 36
              })
              rangArea.push({
                points: JSON.parse(item.range).map(o => ({ longitude: o[0], latitude: o[1] })),
                fillColor: '#FBAB4833',
                strokeColor: '#FBAB48',
                strokeWidth: 2
              })
              // return [...acc, ]
            }, [])
            markers.push({
              iconPath: locationIcon,
              id: index,
              latitude,
              longitude,
              width: 20,
              height: 26
            })
          }
        })
        // rangeInfo[0].shippingRange = shippingRange;
      } else {
        rangArea = rangeArea.reduce((acc, { shippingRange, position }, index) => {
          const [longitude, latitude] = position.split(',')
          markers.push({
            iconPath: merchantIcon,
            id: 0,
            latitude,
            longitude,
            width: 30,
            height: 36
          })
          return [...acc, {
            points: shippingRange.map(o => ({ longitude: o[0], latitude: o[1] })),
            fillColor: '#FBAB4833',
            strokeColor: '#FBAB48',
            strokeWidth: 2
          }]
        }, [])
        markers.push({
          iconPath: locationIcon,
          id: 0,
          latitude,
          longitude,
          width: 20,
          height: 26
        })
      }
      this.setState({
        latitude,
        longitude,
        polygons: rangArea,
        markers
      })
    }

    componentDidMount() {

    }

    confirmLocation = () => {
      const {
        latitude, longitude, address, name
      } = this.state.location
      const range = JSON.parse(this.$router.params.range)
      if (this.$router.params.selfSend === 'true') {
        let isArea = false
        const rangList = []
        JSON.parse(this.$router.params.range)[0].shippingRange.map((item, index) => {
          rangList.push(JSON.parse(this.$router.params.range))
          rangList[index][0].shippingRange = JSON.parse(item.range)
        })
        rangList.map(item => {
          if (latelyMerchant(item, { longitude, latitude }).isDeliveryRange) {
            isArea = true
            saveUserLocation({
              address, name, longitude: longitude - 0, latitude: latitude - 0
            })
          }
        })
        if (!isArea) {
          showToast('已超出配送范围, 请重新定位!')
        } else if (this.$router.params.orderConfirm) {
          Taro.navigateBack()
        } else {
          Taro.navigateBack()
        }
      } else if (latelyMerchant(range, { longitude, latitude }).isDeliveryRange) {
        saveUserLocation({
          address, name, longitude: longitude - 0, latitude: latitude - 0
        })
        if (this.$router.params.orderConfirm) {
          Taro.navigateBack()
          // Taro.navigateBack({delta:2});
        } else {
          Taro.navigateBack()
        }
      } else {
        showToast('已超出配送范围, 请重新定位!')
      }
    };

    render() {
      const {
        latitude, longitude, location, polygons, markers
      } = this.state
      return (
        <View className="mapPage">
          <View className="mapContainer">
            <Map
              id="myMap"
              className="map"
              latitude={latitude - 0}
              longitude={longitude - 0}
              polygons={polygons}
              markers={markers}
                        // show-location
              scale={12}
            />
            <CoverView
              className="search flex-row flex-ac"
              onClick={() => {
                navToPage('/package/multiStore/mapRange/search/searchAddress')
              }}
            >
              <CoverImage className="searchIcon" src={`${STATIC_IMG_URL}/icon/icon_search.png`} />

              <CoverView className="ellipsis" style={{ width: '100%' }}>{location.name || '请输入地址'}</CoverView>
            </CoverView>
          </View>
          <View onClick={this.confirmLocation} className="confirm">
            <Text>确认</Text>
          </View>
          {/* 自定义导航 */}
          <custom-tab-bar></custom-tab-bar> 
        </View>

      )
    }
}

export default MapRange
