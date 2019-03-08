
import Cesium from 'cesium/Source/Cesium'

// 视线可视分析
export default class DrawViewLine {
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
        const that = this;

        this.handler.setInputAction((movement) => {

            if (reDraw) {
                this._reDraw()
                reDraw = false
            }
            var scene = viewer.scene;

            // if (scene.mode !== Cesium.SceneMode.MORPHING) {
            const cartesian = this._getPosition(movement.position);
            const xy = movement.position;
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
                    xys.push({ x: xy.x, y: xy.y })
                    // const data = this._getDistanceHeight(linePositionList, xys)
                    // console.log(data);
                    this._test(linePositionList, this.callback)
                    // if (this.callback)
                    //     this.callback(data)
                    reDraw = true;
                    // 清除
                    xys = [];
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
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
        this.handler.setInputAction((movement) => {
            if (isDraw) {
                const cartesian = that._getPosition(movement.endPosition);
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
        this.handler.setInputAction((movement) => {

        }, Cesium.ScreenSpaceEventType.RIGHT_CLICK)
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
    _getPosition(position) {
        const viewer = this.viewer;
        const scene = viewer.scene;
        let cartesian = null;
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

    _getDistanceHeight(points, xys) {
        // 经纬度
        const startPoint = this._car3ToLatLon(points[0]);
        const endPoint = this._car3ToLatLon(points[1]);

        const pointSum = 10;  //取样点个数
        const addXTT = Cesium.Math.lerp(startPoint.lon, endPoint.lon, 1.0 / pointSum) - startPoint.lon;
        const addYTT = Cesium.Math.lerp(startPoint.lat, endPoint.lat, 1.0 / pointSum) - startPoint.lat;
        //  屏幕坐标
        const [leftXY, rightXY] = xys;
        var addX = Cesium.Math.lerp(leftXY.x, rightXY.x, 1.0 / pointSum) - leftXY.x;
        var addY = Cesium.Math.lerp(leftXY.y, rightXY.y, 1.0 / pointSum) - leftXY.y;
        var heightArr = [];
        for (let index = 0; index < pointSum; index++) {
            var x = leftXY.x + (index + 1) * addX;
            var y = leftXY.y + (index + 1) * addY;
            var eventPosition = { x: x, y: y };
            var scene = this.viewer.scene;
            // if (scene.mode !== Cesium.SceneMode.MORPHING) {
            var pickedObject = scene.pick(eventPosition);
            const cartestin = this._getPosition(eventPosition)
            if (!cartestin) {
                const objectsToExclude = []
                const position = scene.clampToHeight(cartestin, objectsToExclude);
            }
            // if (scene.pickPositionSupported && Cesium.defined(pickedObject)) {
            //     var cartesian = this.viewer.scene.pickPosition(eventPosition);
            //     if (Cesium.defined(cartesian)) {
            //         const position = this._car3ToLatLon(cartesian)
            //         const height= position.height.toFixed(2);
            //         heightArr[index] =height;
            //     }
            // } else {
            //     var ray = this.viewer.camera.getPickRay(eventPosition);
            //     var cartesian = this.viewer.scene.globe.pick(ray, this.viewer.scene);
            //     // const position1=this.viewer.scene.clampToHeight(position) 
            //     if (Cesium.defined(cartesian)) {
            //         const position = this._car3ToLatLon(cartesian)
            //         const height= position.height.toFixed(2);
            //         heightArr[index] =height;
            //     }
            // }


        }
        return heightArr;

    }
    _test(points, callback = null) {
        const that = this;
        const viewer = this.viewer;
        var count = 30;
        var cartesians = new Array(count);
        for (var i = 0; i < count; ++i) {
            var offset = i / (count - 1);
            cartesians[i] = Cesium.Cartesian3.lerp(points[0], points[1], offset, new Cesium.Cartesian3());
        }


        viewer.scene.clampToHeightMostDetailed(cartesians).then(function (clampedCartesians) {
            let heightArr = clampedCartesians.map((d) => {
                const h = that._car3ToLatLon(d).height
                if (h < 0) h = 0;
                return h;
            });

            if (callback) {
                callback(heightArr)
            }
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
            console.log(d);
            //  return heightArr;
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

