import * as turf from '@turf/turf'
import Cesium from 'cesium/Source/Cesium'

export default class MeasureTriangle {
    constructor(viewer, isTerrain, style, callback) {
        this.viewer = viewer
        this.isTerrain = isTerrain
        this.style = style

        this.handler = null
        this.tempEntities = []
        this.lineEntities = []
        this.labelEntities = []
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
        this._addDisListener()
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
        this._drawLine(linePositionList)
        // this._drawPoints(firstPoint)
        this._drawPoints()
        this._drawDis()
        let isDraw = false
        let reDraw = false

        this.handler.setInputAction((movement) => {
            if (reDraw) {
                this._reDraw()
                reDraw = false
            }
            let pickedObject = scene.pick(movement.position)
            if (!Cesium.defined(pickedObject) || pickedObject.primitive instanceof Cesium.Polyline || pickedObject.primitive instanceof Cesium.Primitive) {
                // 方法二
                let ray = viewer.camera.getPickRay(movement.position);
                let cartesian = viewer.scene.globe.pick(ray, viewer.scene);

                if (cartesian) {
                    // this.tempPoints.push(this._car3ToLatLon(cartesian))
                    if (isDraw) {
                        // 结束
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
                            this.disList = [];

                            var distance = this._getSpatialDistance(linePositionList);
                            // this.distance = distance
                            this.d_flat = distance.d_flat;
                            this.d_h = distance.d_h;
                            this.d_spatial = distance.d_spatial;
                            this.countDis_spatial = '空间距离：' + (this.d_spatial > 10000 ? (this.d_spatial / 10000).toFixed(1) + '万km' : this.d_spatial.toFixed(1) + 'km')
                            this.countDis_flat = '地面距离：' + (this.d_flat > 10000 ? (this.d_flat / 10000).toFixed(1) + '万km' : this.d_flat.toFixed(1) + 'km')
                            this.countDis_h = '高度：' + this.d_h.toFixed(3) + 'm';
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
                        // this._drawPoint(firstPoint)
                    }

                }

            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
        this.handler.setInputAction((movement) => {
            // 方法二
            let ray = viewer.camera.getPickRay(movement.endPosition);
            let cartesian = viewer.scene.globe.pick(ray, viewer.scene);
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
        // for (let entity of this.labelEntities) {
        //     this.viewer.entities.remove(entity)
        // }
        // for (let entity of this.lineEntities) {
        //     this.viewer.entities.remove(entity)
        // }
        this.tempEntities = []
        // this.labelEntities = []
        this.firstPoint = null;
        this.hPoint = null;
        this.lastPoint = null;


    }
    _drawDis() {

        let self = this
        let entity = this.viewer.entities.add({
            label: this.style.labelStyle
        })
        entity.position = new Cesium.CallbackProperty(function () {
            return self.labelPosition
        }, false)
        entity.label.text = new Cesium.CallbackProperty(function () {
            return self.countDis_spatial
        }, false)
        this.labelEntities.push(entity)

        let entity1 = this.viewer.entities.add({
            label: this.style.labelStyle
        })
        entity1.position = new Cesium.CallbackProperty(function () {
            return self.firstPoint
        }, false)
        entity1.label.text = new Cesium.CallbackProperty(function () {
            return self.countDis_h
        }, false)
        this.labelEntities.push(entity1)
        let entity2 = this.viewer.entities.add({
            label: this.style.labelStyle
        })
        entity2.position = new Cesium.CallbackProperty(function () {
            return self.hPoint
        }, false)
        entity2.label.text = new Cesium.CallbackProperty(function () {
            return self.countDis_flat
        }, false)
        this.labelEntities.push(entity2)


    }
    _countAll() {
        // console.log(1)
        let tempPoints = this.tempPoints
        let countDis = 0
        // for (let i = 1 i < tempPoints.length i++) {
        // let result = this._getFlatternDistance(tempPoints[i - 1].lat, tempPoints[i - 1].lon, tempPoints[i].lat, tempPoints[i].lon)
        // countDis += Number(result)
        // }
        countDis = this._getFlatternDistance(tempPoints)
        let dis = countDis > 10000 ? (countDis / 10000).toFixed(1) + '万km' : countDis.toFixed(1) + 'km'
        var entity =
            this.viewer.entities.add({
                position: Cesium.Cartesian3.fromDegrees(tempPoints[tempPoints.length - 1].lon, tempPoints[tempPoints.length - 1].lat),
                label: this.style.labelStyle,

            })
        entity.label.text = '距离' + dis
        this.tempEntities.push(entity)
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



    _drawDiv(cartesian3) {
        let viewer = this.viewer
        let container = viewer.container
        let textDiv = document.createElement('div')
        this.textDivs.push(textDiv)
        container.appendChild(textDiv)
        textDiv.setAttribute('style', 'width:200pxheight:30pxborder:1px solid rgb(61,154,250)border-radius:4pxbox-shadow:0px 0px 30px rgb(61,154,250) inset, 0px 0px 30px rgb(61,154,250)position:absolute')

        viewer.clock.onTick.addEventListener(function () {
            let cartesian = Cesium.SceneTransforms.wgs84ToWindowCoordinates(viewer.scene, cartesian3)
            // console.log(cartesian)
            textDiv.style.left = `${cartesian.x - 100}px`
            textDiv.style.top = `${cartesian.y}px`
        })
    }
    _removeDiv() {
        for (let textDiv of this.textDivs) {
            this.viewer.container.removeChild(textDiv)
            this.textDivs = []
        }
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
    //计算总距离-平面距离
    _getFlatternDistance(points) {
        let arr = []
        for (let point of points) {
            arr.push([point.lon, point.lat])
        }
        let line = turf.lineString(arr)
        let length = turf.length(line, {
            units: ''
        })
        return length
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
        for (let lableEntity of this.labelEntities) {
            viewer.entities.remove(lableEntity)
        }
        if (this.handler) {
            this.handler.destroy()
        }
    }
}
