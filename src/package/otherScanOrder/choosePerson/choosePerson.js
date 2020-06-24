import Taro, { Component, showLoading, hideLoading } from '@tarojs/taro'
import {
  View, Swiper, SwiperItem, Image, Text, ScrollView, Block
} from '@tarojs/components'
import { AtMessage, AtIcon } from 'taro-ui'
import { connect } from '@tarojs/redux'
import {
  getPlatFormId, getServerPic, getUserDetail, navToPage, needLogin, parseQuery, showToast, removeSearchHistory,
  getBuyCard, saveUserDetail, setUserDistributor, getUserInfo, getAuthenticate
} from '../../../utils/utils'
import './choosePerson.scss'
import PageLoading from '../../../components/PageLoading/PageLoading'
import { STATIC_IMG_URL, INDEX_BANNER, INDEX_COUPON, PLATFORM_ID } from '../../../config/baseUrl'
const SIZE = 6;
@connect(({ loading: { effects } }) => ({
  effects
}))
class ChoosePerson extends Component {
  config = {
    navigationBarTitleText: '',
    // onReachBottomDistance: 50,
    // enablePullDownRefresh: true,
    backgroundTextStyle: 'dark'
  };

  constructor() {
    super()
    this.state = {
      tableList: [],
      tableNum: 1,
      tableId: '',
      merchantId: '',
      brandId: '',
      tableInfo: {},
      payType: 0,
      tableName: '',
      newTable: true,
      enterpriseGuid: '',
      openId: '',
      wxtoken: '',
      orderSn: null,
      peopleNum: null,
      phone: null,
      changeData: null,
      otherPersonNum: { numArr: [1, 2, 3, 4, 5, 6, 7, 8, 9, 'clear', 0, 'back'] },
      storeTouch: [],
      allMerchantList: [],
      url: {}
    }
  }

  componentWillMount() {
    if (!needLogin()) return

    //是否已经存在未支付订单
    Taro.setNavigationBarColor({
      backgroundColor: Taro.getStorageSync('systemColor'),
      frontColor: "#ffffff"
    });
    if (this.$router.params.tag !== 1) {

      this.setState(this.$router.params);

      this.getNowOrder(this.callbackGetNowOrder);
    }
    else {
      console.log('56this.$router.params=>>>>>>>>>>>>>>', this.$router.params)
    }
    // this.getTableInfo(this.$router.params)
    this.getAllmerchanList();

  }
 
  componentDidMount() {
    // this.getAllmerchanList()

    // // 微信扫码点餐
    // const { params: { q, code } } = this.$router;
    // const scene = this.$router.params.scene;
    // const lscene = decodeURIComponent(q || scene);
    // const url = parseQuery(lscene)
    // Taro.setStorageSync("q", url);
    // if (url.tag == 1 && needLogin()) {
    //   const { weappUserId, platformId } = this.getU_PID();
    //   this.getEnterPriseId(weappUserId, platformId, url);
    //   Taro.removeStorageSync("q")
    // }
  }
  componentDidShow() {
    try {
      const q = Taro.getStorageSync("q");
      if (q != {}) {
        if (q.tag == 1) {
          const { weappUserId, platformId } = this.getU_PID();
          this.getEnterPriseId(weappUserId, platformId, q);
          Taro.removeStorageSync("q")
        }
      }
    } catch (e) {
      throw e;
    }
    if (getAuthenticate()) {
      this.getAllmerchanList()
    }
  };

  // 选择人数
  personChoose = num => {
    this.setState({
      tableNum: num
    })
  };

  //两个平台之间数据统一
  dataTraslate = (data, merchantAvatar = null) => {
    const tableInfo = {};
    tableInfo.payType = 1;
    tableInfo.brandName = data.tdata.brandName;
    tableInfo.merchantName = data.tdata.storeName
    tableInfo.tableName = data.tdata.diningTableCode;
    tableInfo.tableNum = data.tdata.diningTableGuid;
    tableInfo.headImgUrl = merchantAvatar;
    tableInfo.diningTableCode = data.tdata.diningTableCode;
    tableInfo.diningTableGuid = data.tdata.diningTableGuid
    tableInfo.areaGuid = data.tdata.areaGuid
    tableInfo.areaName = data.tdata.areaName
    tableInfo.storeGuid = data.tdata.storeGuid
    tableInfo.brandGuid = data.tdata.brandGuid
    tableInfo.storeName = data.tdata.storeName
    tableInfo.wxUserInfoDTO = data.tdata.wxUserInfoDTO;
    return tableInfo;
  };

  //扫码点餐获取门店
  /**请求另一平台数据必要字段 enterpriseGuid  openid wxtoken */
  //获取userID和platformID
  getU_PID = () => {
    const { weappUserId, platformId, phone, nickName, headPic, sex } = Taro.getStorageSync('tc_island_user_detail');
    // const { weappUserId, platformId, phone, nickName, headPic, sex } = Taro.getStorage('tc_island_user_detail');
    return { weappUserId, platformId, phone, nickName, headPic, sex };
  }
  // 获取enterPriseId
  getEnterPriseId = (weappUserId, platformId, res) => {
    const { dispatch } = this.props;
    dispatch({
      type: 'common/getPlatFormSystemSettingByIdAction',
      callback: ({ ok, data }) => {
        if (ok) {
          const { enterpriseGuid } = data;
          this.getOPenId(weappUserId, platformId, res, enterpriseGuid);
        } else {
          showLoading("企业信息错误");
          hideLoading();
        }
      }
    })
  }
  // 获取openID
  getOPenId = (userId = null, platformId = null, result = {}, enterpriseGuid = null) => {
    const { dispatch } = this.props;
    dispatch({
      type: 'otherPlatform/getOpenIDAction',
      payload: {
        userId,
        platformId
      },
      callback: ({ ok, data }) => {
        if (ok) {
          console.log('openid:', openid)
          const { identity: openid } = data;
          this.getToken(openid, result, enterpriseGuid)
        } else {
          showToast('用户信息错误')
          hideLoading();
        }
      }
    })
  }
  // 获取token
  getToken = (openid = null, result = {}, enterpriseGuid = null) => {
    const { dispatch } = this.props;
    const { phone, nickName, headPic, sex } = this.getU_PID();
    const { areaGuid, brandGuid, diningTableGuid, storeGuid, tag } = result;
    const { merchantAvatar, id, brand } = this.findMerchant(storeGuid)
    const cnnickname = encodeURI(nickName);
    console.log('openid:', openid, 'areGuide:', areaGuid, 'brandGuide:', brandGuid, 'diningTableGuide:', diningTableGuid, 'storeGuide:', storeGuid, 'enterpriseGuid:', enterpriseGuid, phone, nickName, headPic, sex)
    const requestParams = {
      areaGuid,
      brandGuid,
      diningTableGuid,
      enterpriseGuid,   //必需
      storeGuid,
      openid,   //必需
      nickname: cnnickname || '匿名',
      sex: sex == 'null' || !sex ? 0 : sex,
      headImgUrl: headPic || '',
    };
    console.log("run at get token method.", enterpriseGuid, requestParams);
    dispatch({
      type: 'otherPlatform/getOtherPlantFormTOKENAction',
      payload: requestParams,
      callback: (res) => {
        const { ok, data } = res;
        console.log(ok, data, res);
        if (ok && data.code == 0) {
          const Token = data.tdata.token;
          // result.wxtoken = Token;
          const url = { wxtoken: Token, tableId: diningTableGuid, brandId: brandGuid, enterpriseGuid: enterpriseGuid, merchantId: storeGuid, openId: openid, phone: phone, merchantAvatar: merchantAvatar, preBrandId: brand, preId: id, tag: tag }
          if (enterpriseGuid) {
            this.setState({
              url
            }, () => {
              this.wxgetNowOrder(this.wxcallbackGetNowOrder)
              this.getTableInfo(this.state.url);
            })
          }

          // navToPage(`/package/otherScanOrder/choosePerson/choosePerson?wxtoken=${Token}&tableId=${diningTableGuid}&brandId=${brandGuid}&enterpriseGuid=${enterpriseGuid}&merchantId=${storeGuid}&openId=${openid}&phone=${phone}&merchantAvatar=${merchantAvatar}&preBrandId=${brand}&preId=${id}`)
          hideLoading();
        } else {
          showToast(data.message)
          hideLoading();
        }
      }
    })
  }
  //找到门店
  findMerchant = (storeGuid) => {
    const { allMerchantList } = this.state;
    const currentMerchat = allMerchantList.filter(item => item.thirdNo == storeGuid);
    return currentMerchat[0]
  }
  // 获取平台全部门店
  getAllmerchanList = () => {
    const { platformId } = this.getU_PID();
    this.props.dispatch({
      type: 'common/getAllMerchantInfosAction',
      payload: {
        id: platformId
      },
      callback: res => {
        if (res.ok) {
          this.setState({
            allMerchantList: res.data
          }, () => {
            // 微信扫码点餐

            const { params: { q, code } } = this.$router;
            const scene = this.$router.params.scene;

            const lscene = decodeURIComponent(q || scene);
            const url = parseQuery(lscene);
            Taro.setStorageSync("q", url);
            if (url.tag == 1 && needLogin()) {
              const { weappUserId, platformId } = this.getU_PID();
              this.getEnterPriseId(weappUserId, platformId, url);
              Taro.removeStorageSync("q")
            }
          })
        } else {
          needLogin();
        }
      }
    })
  }
  // 获取扫码品牌门店桌号信息
  getTableInfo = ({ tableId, merchantId, brandId, payType, tableName, enterpriseGuid, openId, wxtoken, phone, merchantAvatar, preId, preBrandId }) => {
    //判断平台
    if (enterpriseGuid) {
      this.props.dispatch({
        type: 'otherPlatform/getConsumerInfoAction',
        payload: {
          headerMessage: {
            enterpriseGuid: enterpriseGuid,
            openId: openId,
            wxtoken: wxtoken,
          },
          otherPlatform: true,
        },
        callback: ({ ok, data }) => {
          if (ok && data.code == 0) {
            const { isLogin } = data.tdata.wxUserInfoDTO
            if (this.state.url.tag == 1) {
              const { orderSn } = this.state;
              const tableName = data.tdata.diningTableCode;
              const payType = 1;
              const newTable = orderSn ? false : true;   //有无未完成订单
              const changedata = this.dataTraslate(data, merchantAvatar);
              console.log('changedata=>>>>>>>>>>>>>>', changedata)
              Taro.setNavigationBarTitle({
                title: changedata.merchantName
              });
              const tableList = [];
              this.setState({
                tableInfo: changedata,
                tableList,
                payType,
                tableName,
                newTable,
              })
              console.log('148=>>>>>>', newTable, orderSn)
              if (!newTable) {   //是不是新订单
                if (this.state.url.tag == 1) {
                  this.wxgetCurrentOrder(this.wxcallbackGetCurrentOrder)
                }
                this.getCurrentOrder(this.callbackGetCurrentOrder)
              }
            } else {
              if (!isLogin) {  //未登录 =>>>进行登录
                const { areaGuid, areaName, diningTableGuid, diningTableCode: diningTableName, storeGuid, storeName, brandGuid } = data.tdata;
                const tableCode = diningTableName;
                this.otherLogin(this.callbackOtherLogin, { areaGuid, areaName, diningTableGuid, diningTableName, tableCode, storeGuid, storeName, brandGuid })
              }
              const { orderSn } = this.state;
              const tableName = data.tdata.diningTableCode;
              const payType = 1;
              const newTable = orderSn ? false : true;   //有无未完成订单
              const changedata = this.dataTraslate(data, merchantAvatar);
              console.log('changedata=>>>>>>>>>>>>>>', changedata)
              Taro.setNavigationBarTitle({
                title: changedata.merchantName
              });
              const tableList = [];
              this.setState({
                tableInfo: changedata,
                tableList,
                payType,
                tableName,
                newTable,
              })
              console.log('148=>>>>>>', newTable, orderSn)
              if (!newTable) {   //是不是新订单
                if (this.state.url.tag == 1) {
                  this.wxgetCurrentOrder(this.wxcallbackGetCurrentOrder)
                }
                this.getCurrentOrder(this.callbackGetCurrentOrder)
              }
            }
          }
          else {
            Taro.showModal({
              content: data.message || '服务错误',
              showCancel: false,
              confirmText: '返回',
              confirmColor: '#FF623D',
              success: () => Taro.navigateBack()
            })
          }
        }
      })
    }
  };

  // 开始点餐
  startOrder = () => {
    const { url,
      tableNum, tableInfo, merchantId, tableId, brandId, payType, tableName, newTable, enterpriseGuid, openId, wxtoken, phone
    } = this.state;
    if (url && url.tag == 1) {
      const { tableNum, merchantId, tableId, brandId, tableName, newTable, enterpriseGuid, openId, wxtoken, phone, merchantAvatar, preBrandId, preId } = url
      const perNum = this.calSelectedNum();

      if(!perNum){
        showToast("亲，请选择就餐人数～")
        return
      }

      Taro.setStorage({
        key: 'tc_island_tableInfo',
        data: {
          perNum, tableInfo: JSON.stringify(tableInfo), merchantId, tableId, brandId, tableName, phone, enterpriseGuid, openId, wxtoken, payType: 1, merchantAvatar
        }
      })
      Taro.redirectTo({
        url: `/package/otherScanOrder/scanningIndex/scanningIndex?personNum=${enterpriseGuid ? perNum : tableNum}&tableInfo=${JSON.stringify(tableInfo)}&merchantId=${merchantId}&tableId=${tableId}&brandId=${brandId}&payType=${payType}&tableName=${tableName}&newTable=${newTable}&enterpriseGuid=${enterpriseGuid}&openId=${openId}&wxtoken=${wxtoken}&phone=${phone}&preBrandId=${preBrandId}&preId=${preId}`
      })
    } else {
      const { merchantAvatar, preBrandId, preId } = this.$router.params;
      const perNum = this.calSelectedNum();

      if(!perNum){
        showToast("亲，请选择就餐人数～")
        return
      }

      Taro.setStorage({
        key: 'tc_island_tableInfo',
        data: {
          perNum, tableInfo: JSON.stringify(tableInfo), merchantId, tableId, brandId, tableName, phone, enterpriseGuid, openId, wxtoken, payType: 1, merchantAvatar
        }
      })
      Taro.redirectTo({
        url: `/package/otherScanOrder/scanningIndex/scanningIndex?personNum=${enterpriseGuid ? perNum : tableNum}&tableInfo=${JSON.stringify(tableInfo)}&merchantId=${merchantId}&tableId=${tableId}&brandId=${brandId}&payType=${payType}&tableName=${tableName}&newTable=${newTable}&enterpriseGuid=${enterpriseGuid}&openId=${openId}&wxtoken=${wxtoken}&phone=${phone}&preBrandId=${preBrandId}&preId=${preId}`
      })
    }



  };


  /**
   *
   *
   * 另一平台 getNowOrder/callbackGetNowOrder/getCurrentOrder/callbackGetCurrentOrder/getComsumerInfo/callbackGetComsumerInfo/otherLogin/callbackOtherLogin
   * otherLogin/callbackOtherLogin/updatePersonNum/deleteTouch/clearTouch/calSelectedNum/updateScrollViewClass
   */


  // 微信进来判断是否存在未完成订单
  wxgetNowOrder = (callback) => {
    const { enterpriseGuid, openId, wxtoken } = this.state.url;
    if (enterpriseGuid) {
      this.props.dispatch({
        type: 'otherPlatform/getOtherPlatOrdersAction',
        payload: {
          headerMessage: {
            enterpriseGuid,
            openId,
            wxtoken,
          },
          otherdata: {},
          otherPlatform: true,
        },
        callback
      })
    }
  }
  wxcallbackGetNowOrder = ({ ok, data }) => {
    const { url } = this.state;
    // const { enterpriseGuid, openId, wxtoken, brandId, merchantId, tableId, phone } = url;
    if (ok && data.code == 0) {
      console.log('230=>>>>', data);    //state =>>>>   0:待确认，1待支付，2:已完成，3:已取消
      if (data.tdata.length > 0) {
        const unpayOrder = data.tdata.filter((item) => item.state == 1 || item.state == 0);   //得到未支付订单
        // console.log("236 unpayOrder=>>>>",unpayOrder)

        if (unpayOrder.length > 0) {    //length > 0 说明存在未支付订单
          const { guid: orderSn } = unpayOrder[0];
          this.setState(
            { orderSn },
            () => {
              console.log('orderSn  242=>>>>', orderSn);
            }
          )
          showLoading();
          this.getTableInfo(url)
        } else {
          Taro.setStorage({
            key: 'tc_island_orderInfo',
            data: {
              orderSn: null, wxtoken: null, enterpriseGuid: null, openId: null, payType: null, memberInfoGuid: null, merchantId: null, brandId: null, tableInfo: {}, merchantInfo: {}
            }
          })
          this.setState(
            { orderSn: null },    //不存在未完成订单
          )
          this.getTableInfo(url)

          // return
        }
      } else if (data.tdata.length == 0) {                          //第一次来，不存在订单信息
        Taro.setStorage({
          key: 'tc_island_orderInfo',
          data: {
            orderSn: null, wxtoken: null, enterpriseGuid: null, openId: null, payType: null, memberInfoGuid: null, merchantId: null, brandId: null, tableInfo: {}, merchantInfo: {}
          }
        })
        this.setState(
          { orderSn: null },    //不存在未完成订单
        )
        this.getTableInfo(url)
      }
    }
  }
  //判断是否存在未完成订单   1=>>获取订单号   2=>>判断该订单是否被支付
  getNowOrder = (callback) => {
    const { enterpriseGuid, openId, wxtoken } = this.$router.params
    if (enterpriseGuid) {
      this.props.dispatch({
        type: 'otherPlatform/getOtherPlatOrdersAction',
        payload: {
          headerMessage: {
            enterpriseGuid,
            openId,
            wxtoken,
          },
          otherdata: {},
          otherPlatform: true,
        },
        callback,
      })
    }
  }
  //存在订单信息回调
  callbackGetNowOrder = ({ ok, data }) => {
    const { enterpriseGuid, openId, wxtoken, brandId, merchantId, tableId, phone } = this.$router.params
    if (ok && data.code == 0) {
      console.log('230=>>>>', data);    //state =>>>>   0:待确认，1待支付，2:已完成，3:已取消
      if (data.tdata.length > 0) {
        const unpayOrder = data.tdata.filter((item) => item.state == 1 || item.state == 0);   //得到未支付订单
        // console.log("236 unpayOrder=>>>>",unpayOrder)

        if (unpayOrder.length > 0) {    //length > 0 说明存在未支付订单
          const { guid: orderSn } = unpayOrder[0];
          this.setState(
            { orderSn },
            () => {
              console.log('orderSn  242=>>>>', orderSn);
            }
          )
          showLoading();
          this.getTableInfo(this.$router.params)
        } else {
          Taro.setStorage({
            key: 'tc_island_orderInfo',
            data: {
              orderSn: null, wxtoken: null, enterpriseGuid: null, openId: null, payType: null, memberInfoGuid: null, merchantId: null, brandId: null, tableInfo: {}, merchantInfo: {}
            }
          })
          this.setState(
            { orderSn: null },    //不存在未完成订单
          )
          this.getTableInfo(this.$router.params)

          // return
        }
      } else if (data.tdata.length == 0) {                          //第一次来，不存在订单信息
        Taro.setStorage({
          key: 'tc_island_orderInfo',
          data: {
            orderSn: null, wxtoken: null, enterpriseGuid: null, openId: null, payType: null, memberInfoGuid: null, merchantId: null, brandId: null, tableInfo: {}, merchantInfo: {}
          }
        })
        this.setState(
          { orderSn: null },    //不存在未完成订单
        )
        this.getTableInfo(this.$router.params)
      }
    }
  }
  //wx存在未完成订单后需要去取得该订单数据
  wxgetCurrentOrder = (callback) => {
    const { enterpriseGuid, openId, wxtoken } = this.state.url;
    const { orderSn } = this.state;
    const { dispatch } = this.props
    dispatch({
      type: 'otherPlatform/getAllCurrentOrderAction',
      payload: {
        headerMessage: {
          enterpriseGuid,
          wxtoken,
          openId,
        },
        otherPlatform: true,
        otherdata: {
          orderGuid: orderSn,
        }
      },
      callback,
    })
  }
  //请求未完成订单的回调
  wxcallbackGetCurrentOrder = ({ ok, data }) => {
    if (ok && data.code == 0) {
      const { guestCount } = data.tdata;
      const { tableName, payType, newTable, tableInfo: changedata, orderSn } = this.state;
      const { enterpriseGuid, openId, wxtoken, brandId, merchantId, tableId, phone, preBrandId, preId } = this.state.url;

      hideLoading();
      Taro.redirectTo({ url: `/package/otherScanOrder/scanningIndex/scanningIndex?personNum=${guestCount}&tableInfo=${JSON.stringify(changedata)}&merchantId=${merchantId}&tableId=${tableId}&brandId=${brandId}&payType=${payType}&tableName=${tableName}&newTable=${newTable}&enterpriseGuid=${enterpriseGuid}&openId=${openId}&orderSn=${orderSn}&wxtoken=${wxtoken}&phone=${phone}&preBrandId=${preBrandId}&preId=${preId}` })

    }


  }
  //存在未完成订单后需要去取得该订单数据
  getCurrentOrder = (callback) => {
    const { enterpriseGuid, openId, wxtoken } = this.$router.params;
    const { orderSn } = this.state;
    const { dispatch } = this.props
    dispatch({
      type: 'otherPlatform/getAllCurrentOrderAction',
      payload: {
        headerMessage: {
          enterpriseGuid,
          wxtoken,
          openId,
        },
        otherPlatform: true,
        otherdata: {
          orderGuid: orderSn,
        }
      },
      callback,
    })
  }

  //请求未完成订单的回调
  callbackGetCurrentOrder = ({ ok, data }) => {
    if (ok && data.code == 0) {
      const { guestCount } = data.tdata;
      const { tableName, payType, newTable, tableInfo: changedata, orderSn } = this.state;
      const { enterpriseGuid, openId, wxtoken, brandId, merchantId, tableId, phone, preBrandId, preId } = this.$router.params;

      hideLoading();
      Taro.redirectTo({ url: `/package/otherScanOrder/scanningIndex/scanningIndex?personNum=${guestCount}&tableInfo=${JSON.stringify(changedata)}&merchantId=${merchantId}&tableId=${tableId}&brandId=${brandId}&payType=${payType}&tableName=${tableName}&newTable=${newTable}&enterpriseGuid=${enterpriseGuid}&openId=${openId}&orderSn=${orderSn}&wxtoken=${wxtoken}&phone=${phone}&preBrandId=${preBrandId}&preId=${preId}` })

    }


  }



  //另一个平台未登录时 前去 登录
  // login
  otherLogin = (callback, data) => {
    const { dispatch } = this.props;
    const { areaGuid, areaName, diningTableGuid, diningTableName, tableCode, storeGuid, storeName, brandGuid } = data;
    const { enterpriseGuid, wxtoken, openId } = this.state;
    dispatch({
      type: 'otherPlatform/otherLoginAction',
      payload: {
        headerMessage: {
          enterpriseGuid,
          openId,
          wxtoken,
        },
        otherPlatform: true,
        otherdata: {
          // account,
          areaGuid,    //
          areaName,    //
          diningTableGuid,    //
          diningTableName,    //
          // brandGuid,
          storeGuid,    //
          tableCode,   //
          openId,      //
          isLogin: true,
          enterpriseGuid,
          brandGuid,
        },
      },
      callback,
    })
  }
  callbackOtherLogin = ({ ok, data }) => {
    if (ok && data.code == 0) {
    }
  }


  //更新用户选择的人数
  updatePersonNum = (item) => {
    const { storeTouch } = this.state;
    if (typeof item === 'number') {
      if (item === 0 && storeTouch.length == 0) {    //人数不能未0
        return
      }
      if (storeTouch.length < 2) {
        storeTouch.push(item);
        this.setState({
          storeTouch
        })
      } else if (storeTouch.length == 2) {
        showToast("选择人数请少于99");
        return      //最多只能选择99人
        storeTouch.shift();
        if (storeTouch[0] == 0) { storeTouch.shift() }     //前一个数是0的时候
        storeTouch.push(item);
        this.setState({
          storeTouch
        })
      }
    }
  }

  //删除前一个数
  deleteTouch = () => {
    const { storeTouch } = this.state;
    if (storeTouch.length == 0) {
      return
    } else {
      storeTouch.pop();
      this.setState({
        storeTouch,
      })
    }
  }

  //清除选择的人数
  clearTouch = () => {
    const { storeTouch } = this.state;
    this.setState({
      storeTouch: [],
    })
  }

  //得到选择的人数
  calSelectedNum = () => {
    const { storeTouch } = this.state;
    if (storeTouch.length == 0) {
      return 0
    } else if (storeTouch.length == 1) {
      return Number(storeTouch[0])
    } else if (storeTouch.length == 2) {
      return Number(storeTouch.join(''));
    }
  }


  updateScrollViewClass = () => {
    const { enterpriseGuid, url } = this.state;
    if (url.tag == 1) {
      if (url.enterpriseGuid) {
        return 'chooseModalTable otherScroll'
      } else {
        return 'chooseModalTable'
      }
    } else {
      if (enterpriseGuid) {
        return 'chooseModalTable otherScroll'
      } else {
        return 'chooseModalTable'
      }
    }

  }

  // http://resource.canyingdongli.com/only_merchant/choose_bg.png
  render() {
    const { storeTouch, url, tableList, tableNum, tableInfo, enterpriseGuid, otherPersonNum: { numArr } } = this.state;
    const { effects } = this.props;
    console.log(storeTouch, 'storeTouch')
    return (
      <View className="chooseBox">
        {
          effects['orderDishes/getScanInfoAction'] && (
            <PageLoading />
          )
        }
        <Image className="chooseBg" mode="aspectFill" src={`${STATIC_IMG_URL}/choose_bg.png`} />
        <View className="chooseModalBox">
          <Image className="merchantLogo" src={getServerPic(tableInfo.headImgUrl)} />
          <View className="chooseModalName">
            欢迎来到
            {tableInfo.merchantName}
          </View>
          {
            // enterpriseGuid || url.enterpriseGui
            storeTouch.length !== 0
              ? <View className="chooseModalTitle">
                <Text>{`共${this.calSelectedNum()}人`}</Text>
              </View>
              : <View className="chooseModalTitle">请选择就餐人数</View>

          }
          {/* <View className="chooseModalTitle">你好,请问几位？</View> */}
          <View className="chooseModalTableNum">
            <Text>当前桌号：</Text>
            <Text>{tableInfo.tableName}</Text>
          </View>
          <ScrollView
            className={this.updateScrollViewClass()}
            scrollY
          >
            {
              enterpriseGuid || url.enterpriseGuid ?
                <View className="flex-row flex-wrap flex-jc">
                  { //<View onClick={this.updatePersonNum.bind(this,item)} className="chooseModalTableItem otherItem" hover-class="hover">{item}</View>
                    //<View onClick={this.deleteTouch.bind(this,item)} className="chooseModalTableItem otherItem" hover-class="hover"><AtIcon value="close-circle" size="18" color="#999" /></View>
                    numArr.map((item, index) => (

                      (item !== 'back' && item !== 'clear') ?
                        (<View onClick={this.updatePersonNum.bind(this, item)} className="chooseModalTableItem otherItem" hover-class="hover" key={item}>{item}</View>)
                        : (
                          item === 'back' ?
                            <View onClick={this.deleteTouch.bind(this, item)} className="chooseModalTableItem otherItem" hover-class="hover" key={item}><AtIcon value="close-circle" size="18" color="#999" /></View>
                            : <View onClick={this.clearTouch.bind(this, item)} className="chooseModalTableItem otherItem" hover-class="hover" key={item}>清空</View>)


                    ))


                    // <View onClick={this.updatePersonNum.bind(item)} className="otherchooseperson">
                    //   <View type="1">1</View><View type="2">2</View><View type="3">3</View>
                    //   <View type="4">4</View><View type="5">5</View><View type="6">6</View>
                    //   <View type="7">7</View><View type="8">8</View><View type="9">9</View>
                    //   <View type="clear">清空</View><View type="1">8</View><View type="back">*</View>
                    // </View>

                  }
                </View>

                :
                <View className="flex-row flex-wrap flex-jc">
                  {
                    tableList && tableList.map((item, index) => (
                      <View className={`chooseModalTableItem ${tableNum === item ? 'tableActive' : ''}`} key={index} onClick={this.personChoose.bind(this, item)}>
                        {item}
                    人
                      </View>
                    ))
                  }
                </View>
            }

          </ScrollView>
          <View className="chooseModalBtn" onClick={this.startOrder}>开始点餐</View>
        </View>
        <AtMessage />
        {/* 自定义导航 */}
        <custom-tab-bar></custom-tab-bar> 
      </View>
    )
  }
}
export default ChoosePerson
