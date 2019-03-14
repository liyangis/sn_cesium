
import Cesium from 'cesium/Source/Cesium'
/**
 * 基于DEM地形的剖面分析
 * 两点经纬度之间高度的变化，并非两点之间屏幕坐标高度的变化
 * 精度为两点之间20个插值点
 */
export default class DrawProfile {
    constructor(viewer, style, callback) {
        this.viewer = viewer
        this.style = style
        this.handler = null
        this.tempEntities = []
        this.lineEntities = []
        this.linePositionList = []
        this.firstPoint = null;
        this.lastPoint = null;

        this.xys = []

        // 距离

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

        viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK)
        this.handler = new Cesium.ScreenSpaceEventHandler(scene.canvas)
        this._drawLine(linePositionList)

        let isDraw = false
        let reDraw = false
        let xys = this.xys;

        this.handler.setInputAction((movement) => {
            if (reDraw) {
                this._reDraw()
                reDraw = false
            }
            let cartesian = this._getPosition(movement.position);
            const xy = movement.position;
            if (cartesian) {
                // this.tempPoints.push(this._car3ToLatLon(cartesian))
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
                        this._drawPoint(lastPoint)
                        this._getDistanceHeight(linePositionList, this.callback)
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
                    this._drawPoint(firstPoint)
                    isDraw = true
                    linePositionList.push(firstPoint)
                    xys.push({ x: xy.x, y: xy.y })
                }

            }


        }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
        this.handler.setInputAction((movement) => {
            let cartesian = this._getPosition(movement.endPosition);
            if (cartesian) {
                if (isDraw) {
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
            }

        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)
        
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

    _drawPoint(point_Cartesian3) {
        let entity =
            this.viewer.entities.add({
                position: point_Cartesian3,
                point: {
                    pixelSize: 10,
                    color: Cesium.Color.GOLD,
                    disableDepthTestDistance: Number.POSITIVE_INFINITY,
                    // heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
                }
            })
        this.tempEntities.push(entity)
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
     * @param {起点终点笛卡尔坐标集合} points 
     * @param {起点终点屏幕坐标} xys 
     */
    _getDistanceHeight1(points, xys) {
        // 经纬度
        const startPoint = this._car3ToLatLon(points[0]);
        const endPoint = this._car3ToLatLon(points[1]);
        const pointSum = 10;  //取样点个数
        //  屏幕坐标
        const [leftXY, rightXY] = xys;
        var addX = Cesium.Math.lerp(leftXY.x, rightXY.x, 1.0 / pointSum) - leftXY.x;
        var addY = Cesium.Math.lerp(leftXY.y, rightXY.y, 1.0 / pointSum) - leftXY.y;
        var heightArr = [];
        for (let index = 0; index < pointSum; index++) {
            var x = leftXY.x + (index + 1) * addX;
            var y = leftXY.y + (index + 1) * addY;

            var eventPosition = { x: x, y: y };

            var ray = this.viewer.camera.getPickRay(eventPosition);
            var position = this.viewer.scene.globe.pick(ray, this.viewer.scene);
            if (Cesium.defined(position)) {
                // const position1=this.viewer.scene.clampToHeight(position) 
                var cartographic = Cesium.Ellipsoid.WGS84.cartesianToCartographic(position);
                // console.log("点击处海拔高度为：" + cartographic.height + "米");
                heightArr[index] = cartographic.height.toFixed(2);   //保留两位小数
            }

        }
        return heightArr;
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

            return cartesian
        }
    }
    _getDistanceHeight(points, callback) {

        // 经纬度
        const startPoint = this._car3ToLatLon(points[0]);
        const endPoint = this._car3ToLatLon(points[1]);
        const pointSum = 20;  //取样点个数
        var heightArr = [];
        var pts = []
        for (var i = 0; i < pointSum; ++i) {
            var offset = i / (pointSum - 1);
            var x = Cesium.Math.lerp(startPoint.lon, endPoint.lon, offset);
            var y = Cesium.Math.lerp(startPoint.lat, endPoint.lat, offset);
            pts.push([x, y]);
        }

        // Query the terrain height of two Cartographic positions
        // var terrainProvider = Cesium.createWorldTerrain();
        var terrainProvider=new Cesium.CesiumTerrainProvider({
            url: "http://localhost:8080/o_lab"
          })
        var positions = pts.map(d => Cesium.Cartographic.fromDegrees(...d))
        // 根据地形计算某经纬度点的高度
        var promise = Cesium.sampleTerrainMostDetailed(terrainProvider, positions);
        Cesium.when(promise, function (updatedPositions) {
            // positions[0].height and positions[1].height have been updated.
            // updatedPositions is just a reference to positions.
            // console.log(...positions)
            heightArr = positions.map(d => d.height)
            if (callback) {
                callback(heightArr)
            }
        });

    }
    _test(points) {
        const viewer = this.viewer;
        var count = 30;
        var cartesians = new Array(count);
        for (var i = 0; i < count; ++i) {
            var offset = i / (count - 1);
            cartesians[i] = Cesium.Cartesian3.lerp(points[0], points[1], offset, new Cesium.Cartesian3());
        }

        viewer.scene.clampToHeightMostDetailed(cartesians).then(function (clampedCartesians) {
            for (var i = 0; i < count; ++i) {
                viewer.entities.add({
                    position: clampedCartesians[i],
                    ellipsoid: {
                        radii: new Cesium.Cartesian3(0.2, 0.2, 0.2),
                        material: Cesium.Color.RED
                    }
                });
            }

            viewer.entities.add({
                polyline: {
                    positions: clampedCartesians,
                    // followSurface: false,
                    width: 2,
                    material: new Cesium.PolylineOutlineMaterialProperty({
                        color: Cesium.Color.YELLOW
                    }),
                    depthFailMaterial: new Cesium.PolylineOutlineMaterialProperty({
                        color: Cesium.Color.YELLOW
                    })
                }
            });
        }).then((d) => {
        });
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
    }
}

