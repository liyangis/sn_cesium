import * as turf from '@turf/turf'
import Cesium from 'cesium/Source/Cesium'

export default class MeasureDistance {
    constructor(viewer, isTerrain, style, callback) {
        this.viewer = viewer
        this.isTerrain = isTerrain
        this.style = style

        this.handler = null
        this.tempEntities = []
        this.lineEntities = []
        this.labelEntities = null
        this.linePositionList = []
        this.labelPosition = {
            x: 1,
            y: 1,
            z: 1
        }
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
        viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK)
        this.handler = new Cesium.ScreenSpaceEventHandler(scene.canvas)
        this._drawLine(linePositionList)
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
                let cartesian = this.isTerrain === true ? scene.pickPosition(movement.position) : viewer.camera.pickEllipsoid(movement.position, scene.globe.ellipsoid)
                // 方法二
                let ray = viewer.camera.getPickRay(movement.position);
                cartesian = viewer.scene.globe.pick(ray, viewer.scene);
                var tempPoints = this.tempPoints
                if (cartesian) {
                    // this.tempPoints.push(this._car3ToLatLon(cartesian))
                    tempPoints.push(cartesian.clone())
                    linePositionList.push(cartesian.clone())
                    this._drawPoint(this.tempPoints[this.tempPoints.length - 1])
                }
                isDraw = true
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
        this.handler.setInputAction((movement) => {
            if (isDraw) {
                let cartesian = this.isTerrain === true ? scene.pickPosition(movement.endPosition) : viewer.camera.pickEllipsoid(movement.endPosition, scene.globe.ellipsoid)
                // 方法二
                let ray = viewer.camera.getPickRay(movement.endPosition);
                cartesian = viewer.scene.globe.pick(ray, viewer.scene);
                if (cartesian) {
                    var tempPoints = this.tempPoints
                    if (linePositionList.length > 1) {
                        linePositionList.pop()
                        linePositionList.push(cartesian.clone())
                        this.labelPosition = cartesian.clone()
                    }
                    if (linePositionList.length === 1) {
                        linePositionList.push(cartesian.clone())
                    }
                    if (tempPoints.length > 1) {
                        tempPoints.pop()
                        tempPoints.push(cartesian.clone())
                    }
                    if (tempPoints.length === 1) {
                        tempPoints.push(cartesian.clone())
                    }
                    // var distance = this._getFlatternDistance(tempPoints)

                    var distance = this._getSpatialDistance(tempPoints);
                    this.distance = distance
                    this.countDis = distance > 10000 ? (distance / 10000).toFixed(1) + '万km' : distance.toFixed(1) + 'km'
                }
            }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)
        this.handler.setInputAction((movement) => {
            if (isDraw) {
                let cartesian = this.isTerrain === true ? scene.pickPosition(movement.position) : viewer.camera.pickEllipsoid(movement.position, scene.globe.ellipsoid)
                 // 方法二
                 let ray = viewer.camera.getPickRay(movement.position);
                 cartesian = viewer.scene.globe.pick(ray, viewer.scene);
                if (cartesian) {

                    var tempPoints = this.tempPoints
                    tempPoints.push(cartesian.clone())
                    linePositionList.push(cartesian.clone())
                    this._drawPoint(tempPoints[tempPoints.length - 1])
                    // this._drawDiv(cartesian)
                    // this._countAll()
                    // this.countDis = null
                    this.callback(this.tempPoints, this.distance)
                }
                isDraw = false
                reDraw = true
            }
        }, Cesium.ScreenSpaceEventType.RIGHT_CLICK)
    }
    _reDraw() {
        this.tempPoints = []
        this.linePositionList.length = 0
        for (let entity of this.tempEntities) {
            this.viewer.entities.remove(entity)
        }
        this.tempEntities = []
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
            return self.countDis
        }, false)
        this.lineEntities.push(entity)
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

    _drawPoint1(point) {
        let entity =
            this.viewer.entities.add({
                position: Cesium.Cartesian3.fromDegrees(point.lon, point.lat),
                point: {
                    pixelSize: 5,
                    color: new Cesium.Color.fromBytes(96, 210, 255),
                    // disableDepthTestDistance: Number.POSITIVE_INFINITY,
                    // heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
                }
            })
        this.tempEntities.push(entity)
    }
    _drawPoint(point_Cartesian3) {
        let entity =
            this.viewer.entities.add({
                position: point_Cartesian3,
                point: {
                    pixelSize: 10,
                    color:  Cesium.Color.GOLD,
                    // disableDepthTestDistance: Number.POSITIVE_INFINITY,
                    // heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
                }
            })
        this.tempEntities.push(entity)
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

        var distance = 0;
        for (var i = 0; i < positions.length - 1; i++) {

            var point1cartographic = Cesium.Cartographic.fromCartesian(positions[i]);
            var point2cartographic = Cesium.Cartographic.fromCartesian(positions[i + 1]);
            /**根据经纬度计算出距离**/
            var geodesic = new Cesium.EllipsoidGeodesic();
            geodesic.setEndPoints(point1cartographic, point2cartographic);
            var s = geodesic.surfaceDistance;
            //console.log(Math.sqrt(Math.pow(distance, 2) + Math.pow(endheight, 2)));
            //返回两点之间的距离
            s = Math.sqrt(Math.pow(s, 2) + Math.pow(point2cartographic.height - point1cartographic.height, 2));
            distance = distance + s;
        }
        // return distance.toFixed(2);
        return distance;

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
        if (this.handler) {
            this.handler.destroy()
        }
    }
}
