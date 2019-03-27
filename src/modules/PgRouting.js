import Cesium from 'cesium/Source/Cesium'
export default class PgRouting {
    constructor(viewer) {
        this.viewer = viewer
        this.handler = null
        this.tempEntities = []
        this.startPoint = null
        this.endPoint = null
        this.modelPosition = null
        this._addDisListener()
    }
    _addDisListener() {
        let viewer = this.viewer
        let scene = viewer.scene

        this.createModel(this.modelPosition)
        viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK)
        this.handler = new Cesium.ScreenSpaceEventHandler(scene.canvas)
        let isDraw = false
        let reDraw = false
        this.handler.setInputAction((movement) => {
            if (reDraw) {
                this._reDraw()
                reDraw = false
            }

            let cartesian = this._getPosition(movement.position)
            if (cartesian) {
                if (!isDraw) {
                    // this.tempPoints.push(this._car3ToLatLon(cartesian))
                    this.startPoint = cartesian.clone()
                    this._drawPoint(this.startPoint)
                    isDraw = true
                } else {
                    this.endPoint = cartesian.clone()
                    this._drawPoint(this.endPoint)
                    // 执行路径规划查询
                    const start = this._car3ToLatLon(this.startPoint)
                    const end = this._car3ToLatLon(this.endPoint)
                    isDraw = false
                    reDraw = true
                    this.getRouting(start, end)
                    
                }

            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK)


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
    _reDraw() {
        this.tempPoints = []
        this.startPoint = null
        this.endPoint = null
        for (let entity of this.tempEntities) {
            this.viewer.entities.remove(entity)
        }
        this.tempEntities = []
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
    //移除整个资源
    remove() {
        var viewer = this.viewer
        for (let tempEntity of this.tempEntities) {
            viewer.entities.remove(tempEntity)
        }
        if (this.handler) {
            this.handler.destroy()
        }
    }
    _car3ToLatLon(cartesian) {
        let cartographic = Cesium.Cartographic.fromCartesian(cartesian);
        let longitudeString = Cesium.Math.toDegrees(cartographic.longitude);
        let latitudeString = Cesium.Math.toDegrees(cartographic.latitude);
        return {
            lon: longitudeString,
            lat: latitudeString,
            height: cartographic.height
        };
    }
    getRouting(start, end) {
        const viewer = this.viewer
        var myHeaders = new Headers();
        myHeaders.append("Content-Type", "text/json");
        const bodystr = `viewparams=x1%3A${start.lon}%3By1%3A${start.lat}%3Bx2%3A${end.lon}%3By2%3A${end.lat}`
        fetch(
            //'http://localhost:8088/geoserver/ljgh/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=ljgh%3Anavigation&maxFeatures=50&outputFormat=application%2Fjson' +'&viewparams=x1%3A116.36698150687153%3By1%3A39.87541007969412%3Bx2%3A116.35702514635341%3By2%3A39.88516044610151',
            'http://localhost:8088/geoserver/ljgh/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=ljgh%3Anavigation&maxFeatures=50&outputFormat=application%2Fjson&' + bodystr,
            {
                headers: myHeaders,
                method: 'get',
                mode: 'cors'

            }).then((response) => {
                return response.json().then(function (json) {
                    var datasource = Cesium.GeoJsonDataSource.load(json,
                        {
                            clampToGround: true
                        });
                    viewer.dataSources.add(datasource);
                    viewer.zoomTo(datasource)
                })

            })
    }
    createModel(position) {
        const url = 'models/CesiumMilkTruck/CesiumMilkTruck-kmc.glb'
        const viewer = this.viewer

        var heading = Cesium.Math.toRadians(135);
        var pitch = 0;
        var roll = 0;
        var hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);
        var orientation = Cesium.Transforms.headingPitchRollQuaternion(position, hpr);

        var entity = viewer.entities.add({
            name: url,
            orientation: orientation,
            model: {
                uri: url,
                minimumPixelSize: 128,
                maximumScale: 20000
            }
        });
        viewer.trackedEntity = entity;
        entity.position = new Cesium.CallbackProperty(function () {
            return position
        }, false)
    }


}