import Taro, { Component } from '@tarojs/taro'
import {
  View,
  Text,
  Image,
  Checkbox,
  Button,
  Radio,
  RadioGroup,
  AtIcon
} from '@tarojs/components'
import {
  AtInputNumber,
  AtModal,
  AtModalHeader,
  AtModalContent,
  AtModalAction,
  AtList,
  AtListItem
} from 'taro-ui'
import { connect } from '@tarojs/redux'
import { IconFont } from '../../components/IconFont/IconFont'
import './packageCart.scss'
import {
  findMinSku, formatCurrency, getPackageCar, getPackageCarDishHash, getServerPic, productTypeAnd, removeAnyPackageCar,
  removeSelectedPackageCar,
  savePackageCar, showToast, objNotNull
} from '../../utils/utils'
import { SALE_STATE, GOODS_MODEL } from '../../config/config'

@connect(() => ({}))
export default class PackageCart extends Component {
  config = {
    navigationBarBackgroundColor: '#FF633D',
    navigationBarTextStyle: 'white',
    navigationBarTitleText: '套餐商品购物车'
  };

  constructor() {
    super()
    this.state = {
      value: 1,
      isOpen: false,
      isEdit: false,
      car: getPackageCar(),
      types: {},
      currentTypeIdx: '',
      currentMerchantId: '',
    }
  }

  toPay = (merchantId, typeIdx) => {
    const { currentTypeIdx, types, currentMerchantId, car } = this.state
    const id = merchantId || currentMerchantId
    const typeIndex = typeIdx || currentTypeIdx
    const { dishes, merchant } = car[id]



    // 去除没选中的类型 不考虑之前未选中的
    dishes.forEach(dish => {
      if (!productTypeAnd(dish.shopDish.productType, types[typeIndex][0].value)) {
        dish.shopDish.selected = false
        savePackageCar(merchant, dish, dish.shopDish.buyNums)
      }
    })

    Taro.navigateTo({ url: `/package/multiStore/packageOrderConfirm/packageOrderConfirm?id=${id}&typeValue=${types[typeIndex][0].value}` })
  }

  onComplete = () => {
    this.setState({
      isEdit: false
    })
  }

  onOpenRemoveModal = () => {
    const { car } = this.state
    const hashs = []
    Object.keys(car).forEach(id => {
      car[id].dishes.forEach((dish, i) => {
        if (dish.shopDish.selected) {
          hashs.push(getPackageCarDishHash(dish))
        }
      })
    })
    const root = this
    Taro.showModal({
      title: '确认删除',
      content: `确认要删除这${hashs.length}件商品吗？`,
      success(res) {
        if (res.confirm) {
          root.removeDishInCar(hashs)
        } else if (res.cancel) {
          // console.log('用户点击取消')
        }
      }
    })
  }

  /**
   * 移除选中菜品
   * @param {菜品hash值} hashs 
   */
  removeDishInCar = (hashs) => {
    removeSelectedPackageCar(hashs)
    this.setState({ car: getPackageCar() })
  }

  // 打开选择框
  openModal = id => {
    const { car } = this.state
    const { dishes } = car[id]

    // setBuyMerchantPackageCar(id)
    const types = {}
    dishes.forEach(dish => {
      if (dish.shopDish.selected) {
        const goodsModel = GOODS_MODEL.filter(o => productTypeAnd(dish.shopDish.productType, o.value))
        console.log(goodsModel, "goodsModel")
        // types[goodsModel.value] ? types[goodsModel.value].push(goodsModel) : types[goodsModel.value] = [goodsModel]
        goodsModel.map((item, index) => {
          types[item.value] ? types[item.value].push(item) : types[item.value] = [item]
        })
      }
    })

    console.log('types', types)
    const aTypes = Object.keys(types)
    if (aTypes.length === 1) {
      this.setState({ types }, () => {
        this.toPay(id, aTypes[0])
      })
      return
    }

    if (aTypes.length < 1) {
      showToast("请选择要进行结算的商品～")
      return
    }

    this.setState({
      isOpen: true,
      types,
      currentMerchantId: id
    }, () => {
      console.log('open', this.state.isOpen)
    })
  }

  // 关闭选择框
  closeModal = () => {
    this.setState({
      isOpen: false
    })
  }

  // 修改购物车
  changeCarDish = (merchant, dish, val) => {
    console.log(merchant, dish)
    savePackageCar({ ...merchant, merchant_name: merchant.name }, dish, parseInt(val))
    this.setState({ car: getPackageCar() })
  }

  // 清理购物车
  clearInvalidCar = () => {
    removeAnyPackageCar()
    this.setState({ car: getPackageCar() })
    showToast('清理完毕～')
  }

  render() {
    const { isEdit, car, types } = this.state
    const merchantIds = Object.keys(car)

    let defaultCarSelected = false
    merchantIds.map(id => {
      const {
        dishes = []
      } = car[id]
      // defaultCarSelected = dishes.filter(dish => dish.shopDish.selected === true).length > 0
      const carSelected = dishes.filter(dish => dish.shopDish.selected === true);
      if (carSelected.length == dishes.length) {
        defaultCarSelected = true;
      } else {
        defaultCarSelected = false;
      }
    })
    return (
      <View>
        {objNotNull(car) ?
          <View className="packageCart">
            {/* 处理完成 */}
            <View className="at-row at-row__justify--end at-row__align--center">
              {isEdit && (
                <View className="complete-btn" onClick={this.onComplete}>
                  <IconFont className="icon" value="icon-complete" w={37} h={36} />
                  <Text className="text">完成</Text>
                </View>
              )}
              {!isEdit && (
                <View className="edit-btn" onClick={() => this.setState({ isEdit: true })}>
                  <AtIcon value="settings" size="14" color="#FF633D" />
                  <Text className="text">编辑</Text>
                </View>
              )}
            </View>
            {/* 门店列表 */}
            {merchantIds.map(id => {
              const {
                merchant, dishes = [], amount, discountVal
              } = car[id]
              let defaultSelected = false;
              // const defaultSelected = dishes.filter(dish => dish.shopDish.selected === true).length > 0
              const selected = dishes.filter(dish => dish.shopDish.selected === true)
              if (selected.length === dishes.length) {
                console.log(1)
                defaultSelected = true;
              } else {
                defaultSelected = false;
                console.log(1)
              }
              return (
                <View className="merchant-list">
                  {/* {merchantIds.map(id => {
          const {
            merchant, dishes = [], amount, discountVal
          } = car[id]
          const defaultSelected = dishes.filter(dish => dish.shopDish.selected === true).length > 0
          console.log(dishes, "dishes") */}
                  {/* return ( */}
                  {merchant && (
                    <View className="merchant-box">
                      <View className="merchant-head at-row at-row__justify--between at-row__align--center">
                        <View className="checkCnt at-col--auto">
                          <Checkbox
                            color="#FF643D"
                            value={false}
                            checked={defaultSelected}
                            onClick={
                              t => {
                                // dishes.forEach(dish => {
                                //   dish.shopDish.selected = !dish.shopDish.selected
                                //   this.changeCarDish(car[id].merchant, dish, dish.shopDish.buyNums)
                                // })
                                if (defaultSelected === true) {
                                  dishes.forEach(dish => {
                                    dish.shopDish.selected = false;
                                    this.changeCarDish(car[id].merchant, dish, dish.shopDish.buyNums);
                                  })
                                } else {
                                  dishes.forEach(dish => {
                                    dish.shopDish.selected = true;
                                    this.changeCarDish(car[id].merchant, dish, dish.shopDish.buyNums);
                                  })
                                }
                              }
                            }
                          />
                        </View>
                        <View className="merchanr-name at-col">
                          <IconFont className="icon" value="icon-shop" w={32} h={32} />
                          <Text className="merchanr-name-text">{merchant.name}</Text>
                        </View>
                      </View>
                      <View className="merchant-content">
                        {dishes.map(dish => {
                          const minSku = findMinSku(dish.shopDish.shopDishSkus)
                          const productMemberPrice = (minSku.memberPrice !== null && minSku.memberPrice !== undefined) ? `${minSku.memberPrice}` : false
                          const saleState = SALE_STATE[dish.dishState]
                          const goodsModel = GOODS_MODEL.filter(o => productTypeAnd(dish.shopDish.productType, o.value))
                          return (
                            <View className="package-goods-list at-row">
                              <View className="list-checkbox at-col--auto">
                                <Checkbox
                                  color="#FF643D"
                                  value={dish.shopDish.selected}
                                  checked={dish.shopDish.selected}
                                  onClick={val => {
                                    dish.shopDish.selected = !dish.shopDish.selected
                                    this.changeCarDish(car[id].merchant, dish, dish.shopDish.buyNums)
                                  }}
                                />
                              </View>
                              <View className="list-img at-col--auto">
                                <View className={`goods-type ${saleState.class}`}>{saleState.value}</View>
                                <Image className="goods-image" src={getServerPic(dish.imagePath)} />
                              </View>
                              <View className="list-text at-col">
                                <Text className="goods-name">{dish.dishName} {dish.shopDish.selectedSkuAndAttrStr && `${dish.shopDish.selectedSkuAndAttrStr}`}</Text>
                                <View className="goods-tags">
                                  {
                                    goodsModel.map((item, index) => {
                                      return (
                                        <Text className={`tag ${item.className}`}>{item.label}</Text>
                                      )
                                    })
                                  }
                                </View>
                                <View className="goods-other at-row at-row__justify--between at-row__align--end">
                                  <View className="price at-col">
                                    <View className="member-price at-row at-row__align--center">
                                      <View className="tag">{productMemberPrice ? '会员价' : '价格'}</View>
                                      <View className=" at-col">
                                        <Text className="symbol">￥</Text>
                                        {/* <Text className="num">{productMemberPrice || minSku.price}</Text> */}
                                        <Text className="num">{dish.shopDish.currentSku.price || minSku.price}</Text>
                                      </View>
                                    </View>
                                    {/* {minSku.originalPrice && <View className="line-price">{minSku.originalPrice}</View>} */}
                                    {dish.shopDish.currentSku && <View className="line-price">{dish.shopDish.currentSku.originalPrice}</View>}
                                  </View>
                                  <View className="at-col">
                                    <AtInputNumber
                                      min={0}
                                      max={99}
                                      step={1}
                                      value={dish.shopDish.buyNums}
                                      disabledInput={true}
                                      onChange={val => {
                                        if (val <= 0) {
                                          Taro.showModal({
                                            title: '',
                                            content: '已经是最后一件了，确定要删除吗？',
                                            success: res => {
                                              if (res.confirm) {
                                                this.removeDishInCar([dish.hash])
                                                Taro.reLaunch({
                                                  url: '/packageSecond/packageCart/packageCart'
                                                })
                                              } else {
                                                Taro.reLaunch({
                                                  url: '/packageSecond/packageCart/packageCart'
                                                })
                                              }
                                            }
                                          })
                                          return;
                                        }
                                        this.changeCarDish(car[id].merchant, dish, val);
                                      }}
                                    />
                                  </View>
                                </View>
                              </View>
                            </View>
                          )
                        })}
                      </View>
                      <View className="merchant-footer">
                        <View className={`${discountVal <= 0 ? 'flex-end' : 'at-row at-row__justify--between at-row__align--center'}`}>
                          {discountVal > 0 && (
                            <View className="discount at-col">
                              已优惠
                              <Text className="num">{formatCurrency(discountVal)}</Text>
                      元
                            </View>
                          )}
                          <View className={`footer-right`}>
                            <View className="total">
                              总计
                        <Text className="num">
                                ￥
                          {formatCurrency(amount)}
                              </Text>
                            </View>
                            <Button
                              className="footer-btn"
                              onClick={() => {
                                this.openModal(id)
                              }}
                              hoverClass="hoverClass"
                              size="mini"
                              type="primary"
                            >
                              结算
                      </Button>
                          </View>
                        </View>
                      </View>
                    </View>
                  )}
                  {/* ) */}
                  {/* })} */}

                </View>
              )
            })}
            {/* 编辑购物车 */}
            {isEdit && (
              <View className="fixed-bar">
                <View className="fixed-cnt at-row at-row__justify--between at-row__align--center">
                  <View className="at-col">
                    <Checkbox
                      color="#FF643D"
                      value={defaultCarSelected}
                      checked={defaultCarSelected}
                      onClick={
                        t => {
                          merchantIds.forEach(id => {
                            const {
                              dishes = []
                            } = car[id]
                            // dishes.forEach(dish => {
                            //   dish.shopDish.selected = !dish.shopDish.selected
                            //   this.changeCarDish(car[id].merchant, dish, dish.shopDish.buyNums)
                            // })
                            console.log(dishes, '777')
                            if (defaultCarSelected === true) {
                              dishes.forEach(dish => {
                                dish.shopDish.selected = false;
                                this.changeCarDish(car[id].merchant, dish, dish.shopDish.buyNums)
                              })
                            } else {
                              dishes.forEach(dish => {
                                dish.shopDish.selected = true;
                                this.changeCarDish(car[id].merchant, dish, dish.shopDish.buyNums)
                              })
                            }
                          })
                        }}
                    >
                      <Text className="radio-text">全选</Text>
                    </Checkbox>
                  </View>
                  <View className="fixed-btns at-col at-row">
                    <Button type="default" className="btn btn-primary" hoverClass="btn-primary-hover" onClick={this.clearInvalidCar}>清理无效商品</Button>
                    <Button type="default" className="btn btn-text" hoverClass="btn-text-hover" onClick={this.onOpenRemoveModal}>删除</Button>
                  </View>
                </View>
              </View>
            )}
            {/* 模态框 */}
            <AtModal isOpened={this.state.isOpen}>
              <AtModalHeader>请分开结算商品</AtModalHeader>
              <AtModalContent>
                <View className="modal-select-goods">
                  <RadioGroup onChange={(t) => {
                    this.setState({ currentTypeIdx: t.target.value })
                  }}>
                    {Object.keys(types).map(i => {
                      return (
                        <View className="at-row item">
                          <View className="at-col"><Radio name="type" color="#FF643D" value={i}>{types[i][0].label}商品(含{types[i][0].label}的商品)</Radio></View>
                          <View className="at-col">{types[i].length}件</View>
                        </View>
                      )
                    })}
                  </RadioGroup>
                </View>
              </AtModalContent>
              <AtModalAction>
                <Button onClick={this.closeModal}>返回购物车</Button>
                <Button onClick={() => {
                  this.toPay()
                }}>去结算</Button>
              </AtModalAction>
            </AtModal>
          </View> :
          <View className="empty"></View>
        }
      </View>
    )
  }
}
