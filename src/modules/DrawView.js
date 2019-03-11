
import Cesium from 'cesium/Source/Cesium'

// 视线可视分析-DEM
export default class DrawViewLine {
    constructor(viewer, terrainOr3DTiles, style, callback) {
        this.viewer = viewer
        this.terrainOr3DTiles = terrainOr3DTiles
        this.style = style

        this.handler = null
        this.tempEntities = []
        this.lineEntities = []
        this.linePositionList = []
        this.firstPoint = null
        this.lastPoint = null
        this.labelText = ''
        this.tempPoints = []
        this.callback = callback
        this._addDisListener()
        this.endDraw = false;
    }
    _addDisListener() {
        let viewer = this.viewer
        let scene = viewer.scene
        let linePositionList = this.linePositionList
        let firstPoint = this.firstPoint;
        let lastPoint = this.lastPoint;
        // viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK)
        this.handler = new Cesium.ScreenSpaceEventHandler(scene.canvas)
        // this._drawLine(linePositionList)
        this.depthTest = viewer.scene.globe.depthTestAgainstTerrain;
        if(!this.depthTest)
        {
            // 是否深度测试
            viewer.scene.globe.depthTestAgainstTerrain=true;
        }  
        let isDraw = false
        let reDraw = false
        // let xys = this.xys;
        const that = this;
        const terrain = this.terrainOr3DTiles

        this.handler.setInputAction((movement) => {

            if (reDraw) {
                this._reDraw()
                reDraw = false
            }
            const cartesian = this._getPosition(movement.position, terrain);
            if (cartesian) {
                if (isDraw) {
                    // 结束
                    if (firstPoint) {
                        lastPoint = cartesian.clone();
                        if (linePositionList.length === 1) {
                            linePositionList.push(lastPoint)
                            this.labelPosition = cartesian.clone()
                        } else if (linePositionList.length > 1) {
                            linePositionList.length = 0;
                            linePositionList.push(firstPoint)
                            linePositionList.push(lastPoint)

                        }
                        this.lastPoint = lastPoint;
                        this._drawPoint(lastPoint,Cesium.Color.MEDIUMBLUE )
                        this._getSightLines.bind(this)(terrain, linePositionList, (d) => {
                            that.labelText = d.labelResult
                            if (d.line_s_end) {
                                that._drawPoint_sightline(d.line_s_end)
                                that._drawLine_slightline([that.firstPoint, d.line_s_end], Cesium.Color.BLUE)
                                that._drawLine_slightline([d.line_s_end, lastPoint], Cesium.Color.RED)
                            } else {
                                that._drawLine_slightline(linePositionList)
                            }
                            that._drawResult()
                        })
                        reDraw = true;
                        // 清除
                        isDraw = false
                        this.endDraw = true;
                    }


                } else {
                    //开始
                    // if (this.endDraw) return;
                    firstPoint = cartesian.clone();
                    this.firstPoint = firstPoint;
                    this._drawPoint(firstPoint,Cesium.Color.AQUA)
                    isDraw = true
                    linePositionList.push(firstPoint)

                }
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
        this.handler.setInputAction((movement) => {
            if (isDraw) {
                const cartesian = that._getPosition(movement.endPosition, terrain);
                // if(!cartesian)return
                // 开始
                if (firstPoint) {
                    lastPoint = cartesian.clone();
                    if (linePositionList.length === 1) {
                        linePositionList.push(lastPoint)
                        this.labelPosition = cartesian.clone()
                    } else if (linePositionList.length > 1) {
                        linePositionList.length = 0;
                        linePositionList.push(firstPoint)
                        linePositionList.push(lastPoint)
                    }

                }

            }

        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)
    }
    // 测试不同坐标
    _getPositionTest(position) {
        const viewer = this.viewer;
        const scene = viewer.scene;
        // 椭球体表面经纬度和高度,二维经纬度，高度始终为0
        var cartesian1 = viewer.camera.pickEllipsoid(position, viewer.scene.globe.ellipsoid);
        const { lon, lat, height } = this._car3ToLatLon(cartesian1)//cartographic.height的值始终为零。
        console.log('椭球体表面经纬度和高度' + lon + ' ' + lat + ' ' + height)

        // 方式三，模型坐标
        var pickedObject = scene.pick(position);
        if (scene.pickPositionSupported && Cesium.defined(pickedObject)) {
            var cartesian2 = viewer.scene.pickPosition(position);
            if (Cesium.defined(cartesian2)) {
                const { lon, lat, height } = this._car3ToLatLon(cartesian2)//cartographic.height的值始终为零。
                console.log('模型：' + + lon + ' ' + lat + ' ' + height)
            }
        } else {
            // 方式二，量测坐标
            let ray = viewer.camera.getPickRay(position);
            let cartesian3 = viewer.scene.globe.pick(ray, viewer.scene);
            if (Cesium.defined(cartesian3)) {
                const { lon, lat, height } = this._car3ToLatLon(cartesian3)//cartographic.height的值始终为零。
                console.log('地形表面：' + + lon + ' ' + lat + ' ' + height)
            }
        }
    }
    // 取点坐标
    _getPosition(position, type = 0) {
        const viewer = this.viewer;
        const scene = viewer.scene;
        let cartesian = null;
        if (type) {
            // 方式三，模型坐标
            const pickedObject = scene.pick(position);
            // if (pickedObject instanceof Cesium.Cesium3DTileFeature) {
            //     pickedObject.color = Cesium.Color.YELLOW;
            // }
            if (scene.pickPositionSupported && Cesium.defined(pickedObject)) {
                const cart = viewer.scene.pickPosition(position);
                if (Cesium.defined(cart)) {
                    cartesian = cart
                }
            } else {
                // 方式二，量测坐标
                const ray = viewer.camera.getPickRay(position);
                const cart = viewer.scene.globe.pick(ray, viewer.scene);
                if (Cesium.defined(cart)) {
                    cartesian = cart
                }
            }
        } else {
            const ray = viewer.camera.getPickRay(position);
            const cart = viewer.scene.globe.pick(ray, viewer.scene);
            if (Cesium.defined(cart)) {
                cartesian = cart
            }
        }
        return cartesian
    }
    // 计算高程点,转成笛卡尔坐标
    _computePoint(firstPoint, lastPoint) {
        const first = this._car3ToLatLon(firstPoint);
        const last = this._car3ToLatLon(lastPoint);
        let h = {
        }
        if (first.height > last.height) {
            h = {
                lon: last.lon,
                lat: last.lat,
                height: first.height
            }
        } else {
            h = {
                lon: first.lon,
                lat: first.lat,
                height: last.height
            }
        }
        return Cesium.Cartesian3.fromDegrees(h.lon, h.lat, h.height)
    }
    _reDraw() {
        this.tempPoints = []
        this.linePositionList.length = 0
        for (let entity of this.tempEntities) {
            this.viewer.entities.remove(entity)
        }
        this.tempEntities = []
        this.firstPoint = null;
        this.lastPoint = null;
        this.xys = [];
    }
    _drawLine(linePositionList) {
        let lineStyle = this.style.lineStyle
        let entity = this.viewer.entities.add({
            polyline: lineStyle,
        })
        entity.polyline.positions = new Cesium.CallbackProperty(function () {
            return linePositionList
        }, false)

        this.lineEntities.push(entity)
    }
    _drawLine_slightline(linePositionList, lineColor = null) {
        let lineStyle = lineColor ? {
            width: 2,
            material: lineColor,
            // depthFailMaterial : new Cesium.PolylineOutlineMaterialProperty({
            //     color : Cesium.Color.YELLOW
            // })
        } :
            this.style.lineStyle
        let entity = this.viewer.entities.add({
            polyline: lineStyle,
        })
        entity.polyline.positions = linePositionList
        this.tempEntities.push(entity)
    }

    _drawPoint(point_Cartesian3,color=null) {
        let entity =
            this.viewer.entities.add({
                position: point_Cartesian3,
                point: {
                    pixelSize: 10,
                    color: color?color:Cesium.Color.GOLD,
                    //  // disableDepthTestDistance: Number.POSITIVE_INFINITY,
                    //  heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
                    // disableDepthTestDistance: Number.POSITIVE_INFINITY,
                    // heightReference默认高度为none
                    // heightReference:this.terrainOr3DTiles?Cesium.HeightReference.NONE:Cesium.HeightReference.CLAMP_TO_GROUND
                }
            })
        this.tempEntities.push(entity)
    }
    _drawPoint_sightline(point_Cartesian3) {
        let r=this.terrainOr3DTiles?2:30
        let entity =
            this.viewer.entities.add({
                position: point_Cartesian3,
                // ellipsoid: {
                //     radii: new Cesium.Cartesian3(r,r,r),
                //     material: Cesium.Color.RED
                // }
                point: {
                    pixelSize: 10,
                    color: Cesium.Color.GOLD,
                    // heightReference:this.terrainOr3DTiles?Cesium.HeightReference.NONE:Cesium.HeightReference.CLAMP_TO_GROUND
                }
            });
        this.tempEntities.push(entity)
    }
    // 绘制通视结果
    _drawResult() {
        const that = this;
        var entity =
            this.viewer.entities.add({
                position: that.lastPoint,
                label: {
                    font: "15px sans-serif",
                    pixelOffset: new Cesium.Cartesian2(0.0, -30),
                    fillColor: new Cesium.Color(1, 1, 1, 1),
                    horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
                    verticalOrigin:Cesium.VerticalOrigin.BOTTOM,
                    showBackground: true,
                    disableDepthTestDistance: Number.POSITIVE_INFINITY
                }
            });
        entity.label.text = '是否可通视:' + that.labelText ? that.labelText : ''

        this.tempEntities.push(entity);
    }

    // 世界坐标转经纬坐标
    _car3ToLatLon(cartesian) {
        let cartographic = Cesium.Cartographic.fromCartesian(cartesian)
        let longitudeString = Cesium.Math.toDegrees(cartographic.longitude)
        let latitudeString = Cesium.Math.toDegrees(cartographic.latitude)
        return {
            lon: longitudeString,
            lat: latitudeString,
            height: cartographic.height
        }
    }
    /**
     * 
     * @param {DEM的笛卡尔坐标} points 
     * @param {回调函数} callback 
     */
    _getSightLinesForDEM(points, callback = null) {
        // 经纬度
        const startPoint = this._car3ToLatLon(points[0]);
        const endPoint = this._car3ToLatLon(points[1]);
        const h_asc = (startPoint.height >= endPoint.height) ? false : true;
        const pointSum = 20;  //取样点个数
        let pts = []
        var cartesians = new Array(pointSum);
        for (var i = 0; i < pointSum; ++i) {
            var offset = i / (pointSum - 1);
            var x = Cesium.Math.lerp(startPoint.lon, endPoint.lon, offset);
            var y = Cesium.Math.lerp(startPoint.lat, endPoint.lat, offset);
            var height = Cesium.Math.lerp(startPoint.height, endPoint.height, offset);
            pts.push([x, y, height]);
            cartesians[i] = Cesium.Cartesian3.lerp(points[0], points[1], offset, new Cesium.Cartesian3());
        }
        const cartesians_clone = cartesians.map(d => d.clone())
        // Query the terrain height of two Cartographic positions
        var terrainProvider = Cesium.createWorldTerrain();
        var positions = pts.map(d => Cesium.Cartographic.fromDegrees(...d))
        // 根据地形计算某经纬度点的高度
        var promise = Cesium.sampleTerrainMostDetailed(terrainProvider, positions);
        Cesium.when(promise, function (updatedPositions) {
            //    可视线终点
            let line_s_index = null;
            for (let i = 1; i < updatedPositions.length-1; i++) {
                const position_updated = updatedPositions[i];
                if (!line_s_index&& position_updated) {
                    if (position_updated.height > pts[i][2]) {
                        line_s_index = i
                        break
                    }
                }

            }
            let line_e_index = line_s_index;
            if (callback) {
                const labelText = `起点坐标：${startPoint.lon.toFixed(2)} | ${startPoint.lat.toFixed(2)}| ${startPoint.height.toFixed()}
                \n终点坐标：${endPoint.lon.toFixed(2)} | ${endPoint.lat.toFixed(2)}| ${endPoint.height.toFixed()}
                \n通视结果: ${line_s_index > 0 ? '否' : '是'}`
                callback({
                    'line_s_end': cartesians_clone[line_s_index],
                    'line_e_start': cartesians_clone[line_e_index],
                    'labelResult': labelText
                })
            }
        });
    }
    _getSightLines(type, points, callback = null) {
        if (type) {
            this._getSightLinesFor3Dtiles(points, callback);
        } else {
            this._getSightLinesForDEM(points, callback);
        }
    }
    /**
    * 
    * @param {3Dtiles的笛卡尔坐标} points 
    * @param {回调函数} callback 
    */
    _getSightLinesFor3Dtiles(points, callback = null) {
        // 经纬度
        const that = this
        const startPoint = this._car3ToLatLon(points[0]);
        const endPoint = this._car3ToLatLon(points[1]);
        const pointSum = 20;  //取样点个数

        let cartesians = new Array(pointSum);
        for (var i = 0; i < pointSum; ++i) {
            var offset = i / (pointSum - 1);
            cartesians[i] = Cesium.Cartesian3.lerp(points[0], points[1], offset, new Cesium.Cartesian3());
        }
        const cartesians_clone = cartesians.map(d => d.clone())
        this.viewer.scene.clampToHeightMostDetailed(cartesians).then(function (clampedCartesians) {
            //    可视线终点
            let line_s_index = null;
            for (let i = 1; i < clampedCartesians.length-1; i++) {
                const position_updated = clampedCartesians[i];
                // 会有找不到的情况
                if (!line_s_index&&position_updated) {
                    const p_update_degree = that._car3ToLatLon(position_updated)
                    const p_degree = that._car3ToLatLon(cartesians_clone[i])
                    if (p_update_degree.height > p_degree.height) {
                        line_s_index = i
                        break
                    }
                }

            }
            let line_e_index = line_s_index;
            if (callback) {
                const labelText = `起点坐标：${startPoint.lon.toFixed(2)} | ${startPoint.lat.toFixed(2)}| ${startPoint.height.toFixed()}
                \n终点坐标：${endPoint.lon.toFixed(2)} | ${endPoint.lat.toFixed(2)}| ${endPoint.height.toFixed()}
                \n通视结果: ${line_s_index > 0 ? '否' : '是'}`
                callback({
                    'line_s_end': cartesians_clone[line_s_index],
                    'line_e_start': cartesians_clone[line_e_index],
                    'labelResult': labelText
                })
            }
        });
    }
    // 判断两点之间的剖面高度
    _test(points, callback = null) {
        const that = this;
        const viewer = this.viewer;
        var count = 20;
        var cartesians = new Array(count);
        for (var i = 0; i < count; ++i) {
            var offset = i / (count - 1);
            cartesians[i] = Cesium.Cartesian3.lerp(points[0], points[1], offset, new Cesium.Cartesian3());
        }

        for (var i = 0; i < count; ++i) {

            viewer.entities.add({
                position: cartesians[i],
                ellipsoid: {
                    radii: new Cesium.Cartesian3(20, 20, 20),
                    material: Cesium.Color.BLUE
                }
            });
        }

        // viewer.scene.clampToHeightMostDetailed(cartesians).then(function (clampedCartesians) {
        //     let heightArr = clampedCartesians.map((d) => {
        //         const pt_lonlat = that._car3ToLatLon(d);
        //         var cartographic = Cesium.Ellipsoid.WGS84.cartesianToCartographic(d);
        //         let longitudeString = Cesium.Math.toDegrees(cartographic.longitude)
        //         let latitudeString = Cesium.Math.toDegrees(cartographic.latitude)
        //         console.log('lon|lat|height' + longitudeString + ' ' + latitudeString + ' ' + cartographic.height);
        //         let h = 0
        //         if (pt_lonlat) {
        //             h = pt_lonlat.height
        //         }
        //         return h;
        //     });

        //     if (callback) {
        //         callback(heightArr)
        //     }
        //     for (var i = 0; i < count; ++i) {

        //         viewer.entities.add({
        //             position: clampedCartesians[i],
        //             ellipsoid: {
        //                 radii: new Cesium.Cartesian3(0.2, 0.2, 0.2),
        //                 material: Cesium.Color.RED
        //             }
        //         });
        //     }

        //     viewer.entities.add({
        //         polyline: {
        //             positions: clampedCartesians,
        //             // followSurface: false,
        //             width: 2,
        //             material: new Cesium.PolylineOutlineMaterialProperty({
        //                 color: Cesium.Color.YELLOW
        //             }),
        //             depthFailMaterial: new Cesium.PolylineOutlineMaterialProperty({
        //                 color: Cesium.Color.YELLOW
        //             })
        //         }
        //     });
        // }).then((d) => {
        //     console.log(d);
        //     //  return heightArr;
        // });
    }

    //移除整个资源
    remove() {
        var viewer = this.viewer

        for (let tempEntity of this.tempEntities) {
            viewer.entities.remove(tempEntity)
        }
        for (let lineEntity of this.lineEntities) {
            viewer.entities.remove(lineEntity)
        }
        if (this.handler) {
            this.handler.destroy()
        }
        viewer.scene.globe.depthTestAgainstTerrain = this.depthTest
    }
}

