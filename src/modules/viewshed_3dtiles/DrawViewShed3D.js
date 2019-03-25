
import Cesium from 'cesium/Source/Cesium'

export default class DrawViewShed3D {
    constructor(viewer, isTerrain, style, callback) {
        this.viewer = viewer
        this.isTerrain = isTerrain
        this.style = style

        this.handler = null
        this.tempEntities = []
        this.lineEntities = []
        this.labelEntities = []
        this.tempPrimitives = []
        this.linePositionList = []
        this.firstPoint = null;
        this.lastPoint = null;
        this.hPoint = null;

        // 距离
        this.disList = []
        this.countDis = ""
        this.tempPoints = []
        this.textDivs = []
        this.distance = 0

        this.callback = callback
        this._initViewOptions()
        this._addDisListener()
    }
    _initViewOptions() {
        const viewer = this.viewer
        const shadowState = viewer.shadows
        this.viewerOptions = {
            shadows: shadowState
        }
        viewer.shadows = true
    }
    _addDisListener() {
        let viewer = this.viewer
        let scene = viewer.scene
        let linePositionList = this.linePositionList
        let firstPoint = this.firstPoint;
        let lastPoint = this.lastPoint;
        let hPoint = this.hPoint;
        viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK)
        this.handler = new Cesium.ScreenSpaceEventHandler(scene.canvas)

        let isDraw = false
        let reDraw = false

        this.handler.setInputAction((movement) => {
            if (reDraw) {
                this._reDraw()
                reDraw = false
            }
            const cartesian = this._getPosition(movement.position, 1)
            if (cartesian) {
                // this.tempPoints.push(this._car3ToLatLon(cartesian))
                if (isDraw) {
                    // 结束
                    if (firstPoint) {
                        lastPoint = cartesian.clone();

                        hPoint = this._computePoint(firstPoint, lastPoint)
                        this.hPoint = hPoint;
                        if (linePositionList.length === 1) {
                            linePositionList.push(lastPoint)
                            linePositionList.push(hPoint)
                            linePositionList.push(firstPoint)
                            this.labelPosition = cartesian.clone()
                        } else if (linePositionList.length > 1) {
                            linePositionList.length = 0;
                            linePositionList.push(firstPoint)
                            linePositionList.push(lastPoint)
                            linePositionList.push(hPoint)
                            linePositionList.push(firstPoint)
                        }
                        this.disList = [];

                        var distance = this._getSpatialDistance(linePositionList);
                        // this.distance = distance
                        this.d_flat = distance.d_flat;
                        this.d_h = distance.d_h;
                        this.d_spatial = distance.d_spatial;
                        this.countDis_spatial = '空间距离：' + (this.d_spatial > 10000 ? (this.d_spatial / 10000).toFixed(1) + '万km' : this.d_spatial.toFixed(1) + 'km')
                        this.countDis_flat = '地面距离：' + (this.d_flat > 10000 ? (this.d_flat / 10000).toFixed(1) + '万km' : this.d_flat.toFixed(1) + 'km')
                        this.countDis_h = '高度：' + this.d_h.toFixed(3) + 'm';
                        this._drawCamera()

                        reDraw = true;
                        // 清除
                        isDraw = false

                    }


                } else {
                    //开始
                    firstPoint = cartesian.clone();
                    this.firstPoint = firstPoint;
                    isDraw = true
                    linePositionList.push(firstPoint)
                    this._drawPoint(firstPoint)
                }

            }


        }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
        this.handler.setInputAction((movement) => {
            const cartesian = this._getPosition(movement.endPosition, 1)
            if (cartesian) {
                if (isDraw) {
                    // 开始
                    if (firstPoint) {
                        lastPoint = cartesian.clone();
                        // hPoint = firstPoint.clone();
                        // const p = cartesian.clone();
                        // hPoint.z = p.z;
                        hPoint = this._computePoint(firstPoint, lastPoint)
                        this.hPoint = hPoint;

                        if (linePositionList.length === 1) {
                            linePositionList.push(lastPoint)
                            linePositionList.push(hPoint)
                            linePositionList.push(firstPoint)
                            this.labelPosition = cartesian.clone()
                        } else if (linePositionList.length > 1) {
                            linePositionList.length = 0;
                            linePositionList.push(firstPoint)
                            linePositionList.push(lastPoint)
                            linePositionList.push(hPoint)
                            linePositionList.push(firstPoint)
                        }

                        this.labelPosition = cartesian.clone()
                        var distance = this._getSpatialDistance(linePositionList);
                        // this.distance = distance
                        this.d_flat = distance.d_flat;
                        this.d_h = distance.d_h;
                        this.d_spatial = distance.d_spatial;
                        this.countDis_spatial = '空间距离：' + (this.d_spatial > 10000 ? (this.d_spatial / 10000).toFixed(1) + '万km' : this.d_spatial.toFixed(1) + 'km')
                        this.countDis_flat = '地面距离：' + (this.d_flat > 10000 ? (this.d_flat / 10000).toFixed(1) + '万km' : this.d_flat.toFixed(1) + 'km')
                        this.countDis_h = '高度：' + this.d_h.toFixed(3) + 'm';

                    }


                }
            }

        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)
        this.handler.setInputAction((movement) => {

        }, Cesium.ScreenSpaceEventType.RIGHT_CLICK)
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
        for (let primitive of this.tempPrimitives) {
            this.viewer.scene.primitives.remove(primitive)
        }

        this.tempEntities = []
        this.tempPrimitives = []
        // this.labelEntities = []
        this.firstPoint = null;
        this.hPoint = null;
        this.lastPoint = null;


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
                    // disableDepthTestDistance: Number.POSITIVE_INFINITY,
                    // heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
                }
            })
        this.tempEntities.push(entity)
    }
    _drawPoints() {

        let self = this
        let entity = this.viewer.entities.add({
            point: {
                pixelSize: 10,
                color: Cesium.Color.GOLD,
                // disableDepthTestDistance: Number.POSITIVE_INFINITY,
                // heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
            }
        })
        entity.position = new Cesium.CallbackProperty(function () {
            return self.firstPoint
        }, false)

        this.tempEntities.push(entity)
        let entity1 = this.viewer.entities.add({
            point: {
                pixelSize: 10,
                color: Cesium.Color.GOLD,
                // disableDepthTestDistance: Number.POSITIVE_INFINITY,
                // heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
            }
        })
        entity1.position = new Cesium.CallbackProperty(function () {
            return self.hPoint
        }, false)

        this.tempEntities.push(entity1)

    }
    _drawCamera() {
        const viewer = this.viewer
        const scene = viewer.scene
        // 添加飞机视域
        const position = this.firstPoint
        var camera1 = new Cesium.Camera(scene);
        camera1.position = position;
        camera1.direction = Cesium.Cartesian3.negate(
            Cesium.Cartesian3.UNIT_Z,
            new Cesium.Cartesian3()
        );
        camera1.up = Cesium.Cartesian3.clone(Cesium.Cartesian3.UNIT_Y);
        camera1.frustum.fov = Cesium.Math.PI_OVER_THREE;
        camera1.frustum.near = 5.0;
        camera1.frustum.far = 700.0;
        camera1.frustum.aspectRatio = 1
        this.camera = camera1

        const viewshed = viewer.scene.primitives.add(
            new Cesium.DebugCameraPrimitive({
                camera: camera1,
                color: Cesium.Color.YELLOW,
                updateOnChange: true,
                // shadows: Cesium.ShadowMode.ENABLED
            })
        );
        this.tempPrimitives.push(viewshed)
        viewer.shadowMap._lightCamera = camera1
    }

    // 取点坐标
    _getPosition(position, type = 0) {
        const viewer = this.viewer;
        const scene = viewer.scene;
        let cartesian = null;
        if (type) {
            // 方式三，模型坐标
            const pickedObject = scene.pick(position);
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
    //计算总距离-空间距离
    _getSpatialDistance(positions) {
        //空间两点距离计算函数

        var point1cartographic = Cesium.Cartographic.fromCartesian(positions[0]);
        var point2cartographic = Cesium.Cartographic.fromCartesian(positions[1]);
        /**根据经纬度计算出距离**/
        var geodesic = new Cesium.EllipsoidGeodesic();
        geodesic.setEndPoints(point1cartographic, point2cartographic);
        var s = geodesic.surfaceDistance;
        //console.log(Math.sqrt(Math.pow(distance, 2) + Math.pow(endheight, 2)));
        //返回两点之间的距离
        var d = Math.sqrt(Math.pow(s, 2) + Math.pow(point2cartographic.height - point1cartographic.height, 2));

        // return distance.toFixed(2);
        return {
            d_h: Math.abs(point2cartographic.height - point1cartographic.height),
            d_flat: s,
            d_spatial: d
        }

    }

    //移除整个资源
    remove() {
        var viewer = this.viewer

        for (let tempEntity of this.tempEntities) {
            viewer.entities.remove(tempEntity)
        }
        for (let tempPrimitive of this.tempPrimitives) {
            viewer.entities.remove(tempPrimitive)
        }
        for (let lineEntity of this.lineEntities) {
            viewer.entities.remove(lineEntity)
        }

        if (this.handler) {
            this.handler.destroy()
        }
        if (this.viewerOptions) {
            viewer.shadows = this.viewerOptions.shadows
        }
    }
}
