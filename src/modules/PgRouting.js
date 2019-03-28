import Cesium from 'cesium/Source/Cesium'
export default class PgRouting {
    constructor(viewer) {
        this.viewer = viewer
        this.handler = null
        this.tempEntities = []
        this.startPoint = null
        this.endPoint = null
        this.modelPosition = null
        this.modelEntity=null
        this._initViewOptions()
        this._locatePosition()
        this._addDisListener()

    }
    _initViewOptions() {
        const viewer = this.viewer
        this.viewerOptions = {
            shouldAnimate: viewer.shouldAnimate
        }
        viewer.shouldAnimate = true
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
                    this._drawPoint(this.startPoint, true)
                    isDraw = true
                    self.modelPosition = this.startPoint;
                } else {
                    this.endPoint = cartesian.clone()
                    this._drawPoint(this.endPoint, false)
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
    _drawLine(linePositionList, type) {
        let lineStyle = {
            width: 2,
            material: type ? Cesium.Color.YELLOW : new Cesium.PolylineDashMaterialProperty({
                color: Cesium.Color.RED
            }),
            clampToGround: true
        }

        let entity = this.viewer.entities.add({
            polyline: lineStyle,
        })

        entity.polyline.positions = linePositionList

        this.tempEntities.push(entity)
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
    changeType(type) {
        const viewer = this.viewer
        if (type == 0) {
            viewer.trackedEntity = this.modelEntity;
        } else if (type == 1) {
            viewer.trackedEntity = undefined;
            viewer.zoomTo(this.tempEntities, new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-90),2500));
        } else {
            viewer.trackedEntity = undefined;
            viewer.zoomTo(this.tempEntities, new Cesium.HeadingPitchRange(Cesium.Math.toRadians(-90), Cesium.Math.toRadians(-15), 2500));
        }

    }
    _reDraw() {
        this.tempPoints = []
        this.startPoint = null
        this.endPoint = null
        for (let entity of this.tempEntities) {
            this.viewer.entities.remove(entity)
        }
        this.tempEntities = []
        if (this.dataSource) {
            this.viewer.dataSources.remove(this.dataSource)
            this.dataSource = null
        }
        this.modelPosition = null
        this.modelEntity=null
    }

    _drawPoint(point_Cartesian3, isStart) {
        let entity =
            this.viewer.entities.add({
                position: point_Cartesian3,
                point: {
                    pixelSize: 20,
                    color: isStart ? Cesium.Color.GOLD : Cesium.Color.BLUE,
                    // disableDepthTestDistance: Number.POSITIVE_INFINITY,
                    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
                }
                // billboard : {
                //     image : isStart?'models/location4.png':'models/logo.png', // default: undefined
                //     width:30,
                //     height:30
                // }
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
            this.handler = null
        }
        this.modelEntity=null
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
        const self = this
        var myHeaders = new Headers();
        myHeaders.append("Content-Type", "text/json");
        const bodystr = `viewparams=x1%3A${start.lon}%3By1%3A${start.lat}%3Bx2%3A${end.lon}%3By2%3A${end.lat}`
        fetch(
            //'http://localhost:8088/geoserver/ljgh/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=ljgh%3Anavigation&maxFeatures=50&outputFormat=application%2Fjson' +'&viewparams=x1%3A116.36698150687153%3By1%3A39.87541007969412%3Bx2%3A116.35702514635341%3By2%3A39.88516044610151',
            // 'http://localhost:8088/geoserver/ljgh/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=ljgh%3Anavigation&maxFeatures=50&outputFormat=application%2Fjson&' + bodystr,
            'http://localhost:8088/geoserver/ljgh/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=ljgh%3Anavigation_astar&maxFeatures=50&outputFormat=application%2Fjson&' + bodystr,
            {
                headers: myHeaders,
                method: 'get',
                mode: 'cors'

            }).then((response) => {
                return response.json().then(function (json) {
                    var datasource = Cesium.GeoJsonDataSource.load(json,
                        {
                            strokeWidth: 2,
                            clampToGround: true
                        });
                    viewer.dataSources.add(datasource).then(dt => {
                        self.dataSource = dt
                        const data = json.features[0].properties.st_astext
                        var s = json.features[0].properties.st_astext.substr(11)
                        s = s.substr(0, s.length - 1)
                        let sArr = s.split(',')
                        sArr = sArr.map(d => d.split(' '))
                        // const ps = dt.entities.values[0].polyline.positions._value
                        // const p0 = ps[0]
                        // const p1 = ps[ps.length - 1]
                        const lon = parseFloat(sArr[0][0])
                        const lat = parseFloat(sArr[0][1])
                        const lon1 = parseFloat(sArr[sArr.length - 1][0])
                        const lat1 = parseFloat(sArr[sArr.length - 1][1])
                        const p0 = Cesium.Cartesian3.fromDegrees(lon, lat)
                        const p1 = Cesium.Cartesian3.fromDegrees(lon1, lat1)
                        self._drawLine([self.startPoint, p0])
                        self._drawLine([p1, self.endPoint])
                        // self._computePath.bind(self)(json)
                        self._computePath.bind(self)(sArr)

                    });
                    // viewer.zoomTo(datasource)
                })

            })
    }
    createModel(position) {
        const self = this
        const url = 'models/CesiumMilkTruck/CesiumMilkTruck.glb'
        const viewer = this.viewer
        var vehicleEntity = viewer.entities.add({
            name: url,
            orientation: new Cesium.VelocityOrientationProperty(position),
            model: {
                uri: url,
                minimumPixelSize: 50,
                maximumScale: 50
            },
            position: position
        });
        self.tempEntities.push(vehicleEntity)
        self.modelEntity=vehicleEntity
        // viewer.trackedEntity = vehicleEntity
        const scene = viewer.scene
        const clock = viewer.clock;
        var objectsToExclude = [vehicleEntity];
        viewer.scene.postRender.addEventListener(function () {
            if (self.modelPosition && clock.currentTime) {
                var position = self.modelPosition.getValue(clock.currentTime);
                if (position) {
                    vehicleEntity.position = scene.clampToHeight(position, objectsToExclude);
                }

            }
        });
    }

    _computePath(datasource) {
        const viewer = this.viewer
        const startPoint = this.startPoint
        const endPoint = this.endPoint

        //Set the random number seed for consistent results.
        Cesium.Math.setRandomNumberSeed(3);
        //Set bounds of our simulation time
        var start = Cesium.JulianDate.fromDate(new Date(2015, 2, 25, 16));
        var property = new Cesium.SampledPositionProperty();
        property.setInterpolationOptions({
            interpolationDegree: 1,
            interpolationAlgorithm: Cesium.LinearApproximation
        })
        // const positions = datasource.features[0].geometry.coordinates
        const positions = datasource

        var stop = Cesium.JulianDate.addSeconds(start, (positions.length + 2) * 45, new Cesium.JulianDate());
        //Make sure viewer is at the desired time.
        viewer.clock.startTime = start.clone();
        viewer.clock.stopTime = stop.clone();
        viewer.clock.currentTime = start.clone();
        // viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP; //Loop at the end
        viewer.clock.multiplier = 10;
        let linePositions = []
        property.addSample(start, startPoint);
        for (var i = 0; i < positions.length; i++) {
            var time = Cesium.JulianDate.addSeconds(start, 45 * (i + 1), new Cesium.JulianDate());
            const p = positions[i]
            const lon = parseFloat(p[0])
            const lat = parseFloat(p[1])
            var position = Cesium.Cartesian3.fromDegrees(lon, lat);
            property.addSample(time, position);
            linePositions.push(position)

        }
        property.addSample(stop, endPoint);
        this.createModel(property)
        this.modelPosition = property
        this._drawLine(linePositions, true)
        viewer.zoomTo(this.tempEntities)
    }


}