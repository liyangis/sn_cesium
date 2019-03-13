
import Cesium from 'cesium/Source/Cesium'
// 淹没分析
export default class SubmergenceAnalysis {
    constructor(viewer, isTerrain = true, height_max, height_min, speed) {
        this.viewer = viewer
        this.isTerrain = isTerrain

        this.handler = null
        this.tempEntities = []
        this.lineEntities = []
        this.linePositionList = []
        this.tempPoints = []
        this.extrudedHeight = height_min
        this.height_max = height_max
        this.height_min = height_min
        this.speed = speed
        this._initViewStatus(this.viewer)
        this._addDisListener()
    }
    _initViewStatus(viewer) {
        var scene = viewer.scene
        scene.globe.depthTestAgainstTerrain = true
        scene.camera.setView({
            // 摄像头的位置
            destination: Cesium.Cartesian3.fromDegrees(115.9216,39.9870, 1500.0),
            orientation: {
                heading:Cesium.Math.toRadians(0.0),//默认朝北0度，顺时针方向，东是90度
                pitch: Cesium.Math.toRadians(-20),//默认朝下看-90,0为水平看，
                roll: Cesium.Math.toRadians(0)//默认0
            }
        });
    }

    _addDisListener() {
        let viewer = this.viewer
        let scene = viewer.scene
        let linePositionList = this.linePositionList
        viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK)
        this.handler = new Cesium.ScreenSpaceEventHandler(scene.canvas)
        // 绘制线
        this._drawLine(linePositionList)
        // 绘制面
        this._drawPoly(this.extrudedHeight)

    }
    _reDraw() {
        this.tempPoints = []
        this.linePositionList.length = 0
        this.areaPositionList.length = 0
        for (let entity of this.tempEntities) {
            this.viewer.entities.remove(entity)
        }
        this.tempEntities = []
    }

    _drawLine(linePositionList) {
        let lineStyle = {
            width: 2,
            material: Cesium.Color.CHARTREUSE
        }

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


    _drawPoly() {
        const that = this
        let entity =
            this.viewer.entities.add({
                polygon: {
                    hierarchy: {},
                    material: new Cesium.Color.fromBytes(64, 157, 253, 150),
                    perPositionHeight: true,

                }
            })
        entity.polygon.hierarchy = new Cesium.PolygonHierarchy(Cesium.Cartesian3.fromDegreesArray([
            115.8784, 40.0198,
            115.9473, 49.0381,
            115.9614, 40.0073,
            115.9042, 39.9912
        ]))
        entity.polygon.extrudedHeight = new Cesium.CallbackProperty(() => that.extrudedHeight, false)
        this.lineEntities.push(entity)
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


    //移除整个资源
    remove() {
        let viewer = this.viewer
        for (let tempEntity of this.tempEntities) {
            viewer.entities.remove(tempEntity)
        }
        for (let lineEntity of this.lineEntities) {
            viewer.entities.remove(lineEntity)
        }
        this.handler.destroy()
    }
    start() {
        const that = this
        this.timer = window.setInterval(() => {
            if ((that.height_max > that.extrudedHeight) && (that.extrudedHeight >= that.height_min)) {
                that.extrudedHeight = that.extrudedHeight + that.speed
            } else {
                that.extrudedHeight = that.height_min
            }
        }, 500)

    }
    clear() {
        if (this.timer) {
            window.clearInterval(this.timer)
            this.timer = null
            this.extrudedHeight=this.height_min;
        }
    }


}
