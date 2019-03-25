

import Cesium from 'cesium/Source/Cesium'

export default class QueryByBuffer {
    constructor(viewer, type, r, callback) {
        this.viewer = viewer
        this.queryType = type ? type : "point"
        this.radius = r
        this.handler = null
        this.tempEntities = []
        this.linePositionList = []
        this.lineEntities = []
        this.tempPoints = []
        this.tempMousePoints = []
        this.callback = callback
        // this._addDisListener()
        if (Cesium.PostProcessStageLibrary.isSilhouetteSupported(viewer.scene)) {
            const silhouetteGreen = Cesium.PostProcessStageLibrary.createEdgeDetectionStage();
            silhouetteGreen.uniforms.color = Cesium.Color.LIME;
            silhouetteGreen.uniforms.length = 0.01;
            silhouetteGreen.selected = [];
            this.silhouetteGreen = silhouetteGreen
            this.stage = Cesium.PostProcessStageLibrary.createSilhouetteStage([silhouetteGreen])
            if (!viewer.scene.postProcessStages.contains(this.stage)) {
                viewer.scene.postProcessStages.add(this.stage);
            }

        }
        this._locatePosition()
    }
    _initViewOptions() {
        const viewer = this.viewer
        this.viewerOptions = {

        }
        viewer.shadows = true
    }
    _locatePosition() {
        this.viewer.scene.camera.setView({
            destination: new Cesium.Cartesian3(
                -2171888.995991882,
                4387014.399355803,
                4075525.079282242
            ),
            orientation: {
                heading: 0.07365103679241969,
                pitch: -0.4354793647757442,
                roll: 0.00026862926838955303
            }
        });
    }
    _addDisListener() {
        let viewer = this.viewer
        let scene = viewer.scene
        viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK)
        this.handler = new Cesium.ScreenSpaceEventHandler(scene.canvas)
        this._drawLine(this.tempPoints)
        let isDraw = false
        let reDraw = false
        this.handler.setInputAction((movement) => {
            if (reDraw) {
                this._reDraw()
                reDraw = false
            }
            let cartesian = this._getPosition(movement.position, 1)
            if (cartesian) {
                if (this.queryType == "point") {
                    this.tempMousePoints.push(movement.position)
                    this._drawCircle(cartesian)
                    const results = this._pick(this.tempMousePoints)
                    if (this.callback) {
                        this.callback(results)
                    }
                    isDraw = false
                    reDraw = true
                } else {
                    var tempPoints = this.tempPoints
                    if (cartesian) {
                        tempPoints.push(cartesian.clone())
                        this._drawPoint(this.tempPoints[this.tempPoints.length - 1])
                    }
                    this.tempMousePoints.push(movement.position)
                    isDraw = true
                }

            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
        this.handler.setInputAction((movement) => {
            if (isDraw) {
                let cartesian = this._getPosition(movement.endPosition, 1)
                if (cartesian) {
                    var tempPoints = this.tempPoints
                    if (tempPoints.length > 1) {
                        tempPoints.pop()
                        tempPoints.push(cartesian.clone())
                    }
                    if (tempPoints.length === 1) {
                        tempPoints.push(cartesian.clone())
                    }
                }
            }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)
        this.handler.setInputAction((movement) => {
            if (isDraw) {
                let cartesian = this._getPosition(movement.position, 1)
                if (cartesian) {
                    var tempPoints = this.tempPoints
                    if (tempPoints.length > 2) {
                        tempPoints.pop();
                        tempPoints.push(cartesian.clone());
                    }
                    this._drawPoint(tempPoints[tempPoints.length - 1])
                    this._drawDis(tempPoints)
                    this.tempMousePoints.push(movement.position)
                    const results = this._pick(this.tempMousePoints)
                    if (this.callback) {
                        this.callback(results)
                    }
                }
                isDraw = false
                reDraw = true
            }
        }, Cesium.ScreenSpaceEventType.RIGHT_CLICK)
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
        this.linePositionList.length = 0
        for (let entity of this.tempEntities) {
            this.viewer.entities.remove(entity)
        }
        this.tempEntities = []
        this.tempMousePoints.length = 0
    }
    _computeCircle(radius) {
        var positions = [];
        for (var i = 0; i < 360; i++) {
            var radians = Cesium.Math.toRadians(i);
            positions.push(new Cesium.Cartesian2(radius * Math.cos(radians), radius * Math.sin(radians)));
        }
        return positions;
    }
    _pick(positions) {
        this.silhouetteGreen.selected = [];
        const scene = this.viewer.scene
        const r = this.radius
        let i = 0
        let result = []
        let pickedFeatures = []
        positions.forEach(position => {
            const pickedObjects = scene.drillPick(position, r, r);
            pickedObjects.forEach(feature => {

                if (feature instanceof Cesium.Cesium3DTileFeature) {
                    
                    // feature.color = Cesium.Color.fromRandom();
                    // var propertyNames = feature.getPropertyNames();
                    // var length = propertyNames.length;
                    // for (var i = 0; i < length; ++i) {
                    //     var name = propertyNames[i];
                    //     var value = feature.getProperty(name);

                    // }
                    const objectid = feature.getProperty('objectid_1')
                    const have = result.find(d => d.objectid == objectid)
                    if (!have) {
                        i++
                        result.push({
                            id: i,
                            objectid: objectid,
                            text: feature.getProperty('addr_full_')
                        })
                        pickedFeatures.push(feature)
                    }


                }
            });
        });
        // // 去重
        // let hash = {};
        // const newPicked = pickedFeatures.reduceRight((item, next) => {
        //     hash[item.getProperty('objectid_1')] ? '' : hash[item.getProperty('objectid_1')] = true && item.push(next);
        //     return item
        // }, []);
        // Highlight newly selected feature
        this.silhouetteGreen.selected = pickedFeatures;
        return result

    }
    _drawDis(list) {
        let self = this
        let entity = this.viewer.entities.add({
            polylineVolume: {
                positions: list,
                shape: this._computeCircle(this.radius),
                material: Cesium.Color.RED.withAlpha(0.5)
            }
        })
        entity.position = new Cesium.CallbackProperty(function () {
            return self.linePositionList
        }, false)

        this.tempEntities.push(entity)
    }
    _drawCircle(position) {
        const r = this.radius
        let entity = this.viewer.entities.add({
            position: position ? position : Cesium.Cartesian3.fromDegrees(-80.0, 25.0),
            ellipse: {
                semiMinorAxis: r,
                semiMajorAxis: r,
                //rotation : Cesium.Math.toRadians(-40.0),
                outline: true,
                outlineColor: Cesium.Color.WHITE,
                outlineWidth: 4,
                // stRotation: Cesium.Math.toRadians(22),
                material: Cesium.Color.RED.withAlpha(0.5)
            }
        });
        this.tempEntities.push(entity)
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
        var viewer = this.viewer
        this.silhouetteGreen.selected = [];
        for (let tempEntity of this.tempEntities) {
            viewer.entities.remove(tempEntity)
        }
        for (let lineEntity of this.lineEntities) {
            viewer.entities.remove(lineEntity)
        }
        if (this.handler) {
            this.handler.destroy()
            this.handler = null
        }
        this.tempMousePoints.length = 0

    }
    destroy() {
        if (this.stage) {
            this.viewer.scene.postProcessStages.remove(this.stage);
        }

    }
}
