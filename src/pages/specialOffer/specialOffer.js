import Taro, { PureComponent } from '@tarojs/taro'
import {
  View, Block, Text, ScrollView,
  Swiper, SwiperItem, Image
} from '@tarojs/components'
import {
  AtSearchBar, AtTabs, AtActivityIndicator, AtLoadMore,
  AtGrid,
} from 'taro-ui'
import { connect } from '@tarojs/redux'
import Goods from '../../components/Goods/Goods'

import './specialOffer.scss'
import IconFont from '../../components/IconFont/IconFont'
import NoData from '../../components/NoData/NoData'

import {
  getUserLocation, saveUserLocation,
  getServerPic,
  advertisingLinks,
  navToPage,
  parseQuery,
  showToast,
  needLogin,
} from '../../utils/utils'
import { PLATFORM_ID, STATIC_IMG_URL } from '../../config/baseUrl'
import { SIZE, NAV_LINK } from '../../config/config'
import amapFile from '../../utils/amap-wx'

const AMap = new amapFile.AMapWX({ key: '94b742bf454bf235ba9642d698557af7' })

@connect(({ loading: { effects } }) => ({ effects }))
export default class SpecialOffer extends PureComponent {
  config = {
    navigationBarTitleText: '星选特惠',
    enablePullDownRefresh: true
  }

  constructor() {
    super()
    this.state = {
      searchVal: '',
      // tabList: [{ title: '全部▾' }, { title: '智能排序' }, { title: '距离最近' }, { title: '最新分享' }],
      tabList: [{ title: '全部▾' }, { title: '智能排序' }, { title: '距离最近' }],
      curTab: 1,
      userAddress: getUserLocation(),
      recommendGoodsList: [],
      distributionList: [],
      currentPage: 0,
      typeList: [],
      isScroll: true,
      categoryId: '',
      typeVisible: false,
      noData: false,
      reachBottomState: 'loading',
      navList: [],
      appletsAdList: [],
      isFixed: false,
    }
  }

  componentWillMount() {
    Taro.setNavigationBarColor({
      backgroundColor: Taro.getStorageSync('systemColor'),
      frontColor: "#ffffff"
    })
  }
  componentDidMount() {
    const { id } = this.$router.params
    if (id) {
      this.setState({ categoryId: id }, () => {
        this.getStarType()
        this.getStarSelectListAction()
      })
    } else {
      this.getStarType()
      this.getStarSelectListAction()
    }
    this.getIndexNav();
    this.getAppletsAd();
  }
  componentDidShow(){
    this.getIndexNav();
    this.getAppletsAd();
  }
  onPullDownRefresh() {
    this.clearGoodsList()
    Taro.stopPullDownRefresh()
  }
  onPageScroll({scrollTop}){
    const query = Taro.createSelectorQuery()
    query.select('.recommendGoodsList').boundingClientRect(res => {
      console.log(res)
      this.setState({
        isFixed: res.top<=40,
      })
    })
    .exec()
  }
  navigation = item => {
    const { functionPosition } = item;
    console.log(item);
    if (functionPosition === 15) {
      console.log(15)
      Taro.setStorage({ key: 'merchantType', data: 8 })
      // Taro.reLaunch({ url: '/pages/merchantList/merchantList?merchantType=8' }) // 优惠买单
      Taro.navigateTo({ url: '/package/multiStore/merchantList/merchantList?merchantType=8' })
      return
    }
    if (functionPosition === 11) {
      console.log(11)
      Taro.navigateTo({ url: '/package/multiStore/merchantList/merchantList' })
      return
    }
    if (functionPosition === 14) {

      //扫码前判断是否处于登录状态
      if (needLogin()) {
        Taro.scanCode({
          scanType: ['qrCode'],
          success: res => {
            const { result } = res;
            const { tag = null } = parseQuery(result);
            if (tag == 1) {       //tag用于标识不同平台的数据 通吃岛平台 =>>>>>> tag:1
              this.scanCodeAction(parseQuery(result))
              return
            } else {
              const { brandId, merchantId: id, tableId } = parseQuery(result);
              navToPage(`/package/multiStore/choosePerson/choosePerson?merchantId=${id}&tableId=${tableId}&brandId=${brandId}`);
              return
            }
            showToast('二维码有误')
          }
        })
      }

    }
    if (!NAV_LINK[functionPosition]) {
      if (item.otherUrl) {
        if (item.otherUrl === '/package/distributor/index/index') {
          navToPage('/package/distributor/joinDistributor/joinDistributor')
        } else {
          navToPage(item.otherUrl)
        }
      }
      return
    }
    if (functionPosition === 2) {
      // Taro.reLaunch({ url: NAV_LINK[functionPosition] })
      navToPage(NAV_LINK[functionPosition])
      return
    }
    if (functionPosition === 1 || functionPosition === 13) {
      Taro.reLaunch({ url: NAV_LINK[functionPosition] })
      // navToPage(NAV_LINK[functionPosition])
      return
    }

    navToPage(NAV_LINK[functionPosition])
  }
  // 获取广告
  getAppletsAd=()=>{
    this.props.dispatch({
      type:"index/getAppletsAdAction",
      payload: {
        positionCode: 9,
      },
      callback:({ok, data})=>{
        if(ok){
          console.log(data)
          this.setState({
            appletsAdList: data,
          })
        }
      }
    })
  }
  // 获取导航信息
  getIndexNav=()=>{
    this.props.dispatch({
      type: 'index/getIndexNavAction',
      payload: {
        type: 5
      },
      callback:({ok, data})=>{
        if(ok){
          this.setState({
            navList: data,
          })
        }
      }
    })
  }
  getProductDistribution = dishIds => {
    if (dishIds.length <= 0) return
    const { dispatch } = this.props
    const { distributionList } = this.state
    dispatch({
      type: 'index/getProductIsDistributionAction',
      payload: { dishIds },
      callback: ({ ok, data }) => {
        if (ok) {
          this.setState({
            distributionList: [...distributionList, ...data]
          })
        }
      }
    })
  }

  search = val => {
    this.setState({
      searchVal: val
    })
  }

  confirmSearch = () => {
    this.setState({
      recommendGoodsList: [],
      currentPage: 0,
      curTab: 1
    }, () => {
      this.getStarSelectListAction()
    })
  }

  clearGoodsList = () => {
    this.setState({
      recommendGoodsList: [],
      currentPage: 0,
      curTab: 1,
      searchVal: '',
      reachBottomState: 'loading',
      noData: false
    }, () => {
      this.getStarSelectListAction()
    })
  }

  selectedTab = val => {
    const { curTab, typeVisible } = this.state
    if (curTab === val && val !== 0) return
    if (val === 0) {
      this.setState({
        typeVisible: !typeVisible
      })
      return
    }
    this.setState({
      curTab: val,
      isScroll: val !== 0,
      recommendGoodsList: [],
      distributionList: [],
      noData: false,
      typeVisible: false,
      currentPage: 0,
      reachBottomState: 'loading'
    }, () => {
      if (val !== 0) {
        this.getStarSelectListAction()
      }
    })
  }

  getStarSelectListAction = () => {
    const {
      curTab, currentPage, searchVal, userAddress, categoryId,
      recommendGoodsList
    } = this.state
    this.props.dispatch({
      type: 'index/getStarSelectListAction',
      payload: {
        platformId: PLATFORM_ID,
        type: curTab + 1,
        lng: userAddress.longitude || 116.460000,
        lat: userAddress.latitude || 39.920000,
        dishName: searchVal,
        categoryId,
        page: currentPage,
        size: SIZE
      },
      callback: ({ ok, data }) => {
        if (ok) {
          const newData = data.map(({
            imagePath, dishMerchantShippingInfo, tagStr,
            dishState, saleEndTime, dishId, platId,
            merchantId, lat, lng, shopDish: {
              dishName, productType, shopDishSkus
            }, id
          }) => ({
            imagePath, dishMerchantShippingInfo, tagStr,
            dishState, saleEndTime, dishId, platId,
            merchantId, lat, lng, shopDish: {
              dishName, productType, shopDishSkus
            }, id
          }))
          // const query = Taro.createSelectorQuery().in(this.$scope)

          const newList = [...recommendGoodsList, ...newData]
          // console.log(newList)
          this.getProductDistribution(newData.map(o => o.dishId))
          this.setState({
            recommendGoodsList: newList,
            noData: newList.length <= 0
          })
          if (newData.length < SIZE) {
            this.setState({
              reachBottomState: 'noMore'
            })
          }
        }
      }
    })
  }

  getStarType = () => {
    this.props.dispatch({
      type: 'index/getStarTypeAction',
      payload: {
        platformId: PLATFORM_ID,
        functionType: 'PACKAGE',
        page: 0,
        size: 999
      },
      callback: res => {
        const { tabList, categoryId } = this.state

        if (res.ok) {
          res.data && res.data.forEach(item => {
            item.id == categoryId && (tabList[0].title = item.categoryName)
          })
          this.setState({
            typeList: res.data,
            tabList
          })
        }
      }
    })
  }

  onReachBottom() {
  // onScrollToLower = ()=>{
    const { currentPage, reachBottomState } = this.state
    if (reachBottomState === 'noMore') return
    this.setState({
      currentPage: currentPage + 1,
      reachBottomState: 'loading'
    }, () => {
      this.getStarSelectListAction()
    })
  }

  chooseLocation = () => {
    Taro.chooseLocation({
      success: res => {
        if (res.name && res.errMsg === 'chooseLocation:ok') { // 手动选择地址
          const { latitude: lat, longitude: lng } = res
          AMap.getRegeo({
            location: `${lng},${lat}`,
            success: ([{ longitude, latitude, name }]) => {
              const userLocation = {
                longitude,
                latitude,
                name
              }
              saveUserLocation(userLocation)
              this.setState({
                userAddress: userLocation
              })
            }
          })
        }
      }
    })
  };

  render() {
    const {
      searchVal, tabList, curTab, userAddress: { name },
      recommendGoodsList, typeList, isScroll, typeVisible, userAddress,
      currentPage, noData, reachBottomState, distributionList,
      appletsAdList, navList
    } = this.state
    const {navigation} = this;
    const { effects = {} } = this.props
    return (
      <View className={`pageBox ${!isScroll ? 'specialOfferBox' : ''}`}>
        <View className="header">
          <View className="search flex-row flex-ac">
            <View onClick={this.chooseLocation} className="flex-row">
              {/* <IconFont value="imgAddr" w={38} h={40} mr={10} /> */}
              <View style="color: #fff;" className='at-icon at-icon-map-pin'></View>
              <Text className="name ellipsis">{name}</Text>
            </View>
            <View className="searchInt flex1">
              <AtSearchBar
                value={searchVal}
                onChange={this.search}
                onActionClick={this.confirmSearch}
                onClear={this.clearGoodsList}
                placeholder="请输入商品名"
              />
            </View>
          </View>
          {appletsAdList.length!==0 && <View className="swiperBox">
            <Swiper
              className="swiper"
              indicatorColor='#999'
              indicatorActiveColor='#333'
              vertical={false}
              circular
              indicatorDots
              autoplay>
              {appletsAdList.length!==0 && appletsAdList.map(item=>(
                <SwiperItem key={item.id}>
                      <Image
                        className="image"
                        src={getServerPic(item.imageUrl)}
                        onClick={() => {
                          advertisingLinks(item, this)
                        }}
                      />
                </SwiperItem>  
              ))}
              
            </Swiper>
          </View>}
          {navList.length!==0 && <View className="grid">
            <View className="navlist">
              {navList.map(item=>(
                <View className="navlistItem" onClick={() => {
                    navigation(item, this)
                  }}>
                  <Image className="navImage" src={getServerPic(item.picUrl)} />
                  {!!item.name && <View className="navText">{item.name}</View>}
                </View>
              ))}
            </View>
          </View>}
        </View>

        <View className={this.state.isFixed?"AtTabs AtTabsBox":'AtTabsBox'}>
          <AtTabs
            current={curTab}
            tabList={tabList}
            onClick={this.selectedTab}
            id="tabs"
          />
          {
            typeVisible && (
              <View className="category">
                <ScrollView
                  scrollY
                  className="categoryWarp"
                >
                  <View>
                    <View onClick={() => {
                      const { tabList } = this.state
                      tabList[0].title = '全部▾'
                      this.setState({
                        categoryId: '',
                        typeVisible: false,
                        tabList,
                        recommendGoodsList: [],
                        distributionList: [],
                        curTab: 0,
                        currentPage: 0,
                        reachBottomState: 'loading'
                      }, () => {
                        this.getStarSelectListAction()
                      })
                    }}
                    >
                      全部
                    </View>
                    {
                      typeList && typeList.map((item, index) => (
                        <View
                          key={index}
                          onClick={() => {
                            const { tabList } = this.state
                            tabList[0].title = `${item.categoryName}▾`
                            this.setState({
                              categoryId: item.id,
                              typeVisible: false,
                              tabList,
                              recommendGoodsList: [],
                              distributionList: [],
                              curTab: 0,
                              currentPage: 0,
                              reachBottomState: 'loading'
                            }, () => {
                              this.getStarSelectListAction()
                            })
                          }}
                        >
                          {item.categoryName}
                        </View>
                      ))
                    }
                  </View>
                </ScrollView>
              </View>
            )
          }
        </View>
       
        {/* <ScrollView scrollY className="goodsListBox" onScrollToLower={this.onScrollToLower}> */}
          {
            effects['index/getStarSelectListAction'] && currentPage === 0 && (
              // <View className="atLoading">
              //   <AtActivityIndicator mode="center" content="加载中..." />
              // </View>
              <View className="loading1">
                <Image className='showImg' src={`${STATIC_IMG_URL}/loading.gif`} />
              </View>
            )
          }
          <View className="recommendGoodsList"> 
            <View className="recommendGoodsItem" />
            {
              noData && (<NoData />)
            }
            {
              recommendGoodsList.length > 0 && recommendGoodsList.map(ele => (
                <Goods
                  key={ele.id}
                  details={ele}
                  userLocation={userAddress}
                  distributionList={distributionList}
                  id={`good-${ele.id}`}
                />
              ))
            }
            {
              recommendGoodsList.length > 0 && <AtLoadMore status={reachBottomState} />
            }
          </View>
        {/* </ScrollView> */}
        {/* 分类遮罩层 */}
        {
          typeVisible && (
            <View
              className="categoryMask"
              onClick={() => {
                this.setState({
                  typeVisible: false
                })
              }}
            />
          )
        }
        {/* 自定义导航 */}
        <custom-tab-bar></custom-tab-bar> 
      </View>
    )
  }
}
