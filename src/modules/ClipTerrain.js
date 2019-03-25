
import Cesium from 'cesium/Source/Cesium'
export default class ClipTerrain {
    constructor(viewer, height = 200) {
        this.viewer = viewer
        this.clipHeight = height
        this.isTerrain = true
        this.handler = null
        this.tempEntities = [];
        this.linePositionList = []
        this.lineEntities = []
        this.clippingPlanesEnabled = true
        // 深度检测
        viewer.scene.globe.depthTestAgainstTerrain = true;
        this._addDisListener()
    }

    _addDisListener() {
        let viewer = this.viewer
        let scene = viewer.scene;
        let linePositionList = this.linePositionList
        viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

        this.handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
        // 绘制面
        this._drawPoly();

        let isDraw = false
        let reDraw = false
        this.handler.setInputAction((movement) => {
            if (reDraw) {
                this._reDraw()
                reDraw = false
            }

            let cartesian = null
            let ray = viewer.camera.getPickRay(movement.position);
            cartesian = viewer.scene.globe.pick(ray, viewer.scene);
            if (cartesian) {
                linePositionList.push(cartesian.clone());

            }
            isDraw = true
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
        this.handler.setInputAction((movement) => {
            if (isDraw) {
                let cartesian = this.isTerrain === true ? scene.pickPosition(movement.endPosition) : viewer.camera.pickEllipsoid(movement.endPosition, scene.globe.ellipsoid);
                let ray = viewer.camera.getPickRay(movement.endPosition);
                cartesian = viewer.scene.globe.pick(ray, viewer.scene);
                if (cartesian) {
                    if (linePositionList.length > 1) {
                        linePositionList.pop();
                        linePositionList.push(cartesian.clone());
                    }
                    if (linePositionList.length === 1) {
                        linePositionList.push(cartesian.clone());
                    }

                }
            }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        this.handler.setInputAction((movement) => {
            if (isDraw) {
                let cartesian = this.isTerrain === true ? scene.pickPosition(movement.position) : viewer.camera.pickEllipsoid(movement.position, scene.globe.ellipsoid);
                let ray = viewer.camera.getPickRay(movement.position);
                cartesian = viewer.scene.globe.pick(ray, viewer.scene);
                if (cartesian) {
                    var tempLength = this.linePositionList.length;
                    if (tempLength < 2) {
                        alert('请选择3个以上的点再执行闭合操作命令');
                        this._reDraw()
                        return;
                    }
                    if (linePositionList.length > 2) {
                        linePositionList.pop();
                        linePositionList.push(cartesian.clone());
                    }

                    const list = linePositionList.map(d => d.clone())
                    list.push(list[0])
                    this._loadStHelens(viewer.scene.globe)
                    // this._drawWall(list)
                    this._drawPolygon(list)
                }
                isDraw = false
                reDraw = true
            }
        }, Cesium.ScreenSpaceEventType.RIGHT_CLICK)
    }
    _reDraw() {
        this.linePositionList.length = 0
        for (let i = 0; i < this.tempEntities.length; i++) {
            const element = this.tempEntities[i];
            this.viewer.entities.remove(element)
        }
    }
    _loadStHelens(globe) {
        // Create clipping planes for polygon around area to be clipped.
        const points = this.linePositionList
        var pointsLength = points.length;

        // Create center points for each clipping plane
        var clippingPlanes = [];
        try {
            for (var i = 0; i < pointsLength; ++i) {
                var nextIndex = (i + 1) % pointsLength;
                var midpoint = Cesium.Cartesian3.add(points[i], points[nextIndex], new Cesium.Cartesian3());
                midpoint = Cesium.Cartesian3.multiplyByScalar(midpoint, 0.5, midpoint);

                var up = Cesium.Cartesian3.normalize(midpoint, new Cesium.Cartesian3());
                var right = Cesium.Cartesian3.subtract(points[nextIndex], midpoint, new Cesium.Cartesian3());
                right = Cesium.Cartesian3.normalize(right, right);

                var normal = Cesium.Cartesian3.cross(right, up, new Cesium.Cartesian3());
                normal = Cesium.Cartesian3.normalize(normal, normal);

                // Compute distance by pretending the plane is at the origin
                var originCenteredPlane = new Cesium.Plane(normal, 0.0);
                var distance = Cesium.Plane.getPointDistance(originCenteredPlane, midpoint);
                clippingPlanes.push(new Cesium.ClippingPlane(normal, distance));
            }
        }
        catch (e) {
            // console.log(e)
        }

        globe.clippingPlanes = new Cesium.ClippingPlaneCollection({
            planes: clippingPlanes,
            edgeWidth: 1.0,
            edgeColor: Cesium.Color.WHITE,
            enabled: true
        });
        points.length = 0
    }
    // 世界坐标转经纬坐标
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

    _drawPoly() {
        let polyStyle = {
            //extrudedHeight:100,
            //extrudedHeightReference:Cesium.HeightReference.CLAMP_TO_GROUND,
            material: Cesium.Color.WHITE.withAlpha(0.3),
            outline: true,
            outlineColor: Cesium.Color.WHITE
        }
        let entity =
            this.viewer.entities.add({
                polygon: polyStyle
            });
        entity.polygon.hierarchy = new Cesium.CallbackProperty(() => {

            return this.linePositionList;
        }, false)
        // entity.polygon.hierarchy = Cesium.Cartesian3.fromDegreesArrayHeights(pArray)
        this.lineEntities.push(entity);

    }
    _drawWall(list) {
        const height = this.clipHeight
        const cartographic = Cesium.Cartographic.fromCartesian(list[0]);
        const h = this.viewer.scene.globe.getHeight(cartographic)
        let minH = h - height
        let ps = []
        const listLatLon = list.map(d => {
            const latLon = this._car3ToLatLon(d)
            ps.push(latLon.lon)
            ps.push(latLon.lat)
            ps.push(height)
            return latLon
        })
        const positions = Cesium.Cartesian3.fromDegreesArrayHeights(ps)
        let maxHeights = new Array(list.length + 1)
        for (let i = 0; i < list.length; i++) {
            const cartographic = Cesium.Cartographic.fromCartesian(list[i]);
            const h = this.viewer.scene.globe.getHeight(cartographic)
            maxHeights[i] = h;

        }
        var stripeMaterial = new Cesium.StripeMaterialProperty({
            evenColor: Cesium.Color.WHITE.withAlpha(0.5),
            oddColor: Cesium.Color.BLUE.withAlpha(0.5),
            repeat: 5.0
        });
        const imgMaterial = new Cesium.ImageMaterialProperty({
            //  image:'http://localhost:8081/models/excavationregion_side.jpg',
            image: 'models/excavationregion_side.jpg',
            // color: Cesium.Color.BLUE,
            // repeat: new Cesium.Cartesian2(4, 4)
        });
        var terrainProvider = new Cesium.CesiumTerrainProvider({
            url: "http://localhost:8080/o_lab"
        })

        // 根据地形计算某经纬度点的高度
        let heightArr = []
        const pts = list.map(d => Cesium.Cartographic.fromCartesian(d))
        var promise = Cesium.sampleTerrainMostDetailed(terrainProvider, pts);
        const viewer = this.viewer
        const that = this
        Cesium.when(promise, function (updatedPositions) {
            let wallStyle1 = {
                positions: positions,
                material: imgMaterial
            }
            heightArr = updatedPositions.map(d => d.height)
            let entity1 =
                viewer.entities.add({
                    maximumHeights: heightArr,
                   minimumHeights: 0,
                    wall: wallStyle1
                });

            that.tempEntities.push(entity1);
        });

        let wallStyle = {
            positions: positions,
            material: imgMaterial
        }
        // let entity =
        //     this.viewer.entities.add({
        //         maximumHeights: maxHeights,
        //         minimumHeights:minH,
        //         wall: wallStyle
        //     });

        //this.tempEntities.push(entity);

    }
    _drawPolygon(list) {

        const cartographic = Cesium.Cartographic.fromCartesian(list[0]);
        // const clampPoint=this.viewer.scene.clampToHeight(cartographic)
        const h = this.viewer.scene.globe.getHeight(cartographic)
        const imgMaterialBottom = new Cesium.ImageMaterialProperty({
            //  image:'http://localhost:8081/models/excavationregion_side.jpg',
            image: 'models/excavationregion_top.jpg',
            // color: Cesium.Color.BLUE,
            // repeat: new Cesium.Cartesian2(4, 4)
        });
        let polyStyle = {
            height: - this.clipHeight,
            heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
            material: imgMaterialBottom,
            outline: true,
            outlineColor: Cesium.Color.WHITE,

        }
        let entity =
            this.viewer.entities.add({
                polygon: polyStyle
            });
        entity.polygon.hierarchy = list
        this.tempEntities.push(entity);
        const imgMaterialSide = new Cesium.ImageMaterialProperty({
            //  image:'http://localhost:8081/models/excavationregion_side.jpg',
            image: 'models/excavationregion_side.jpg',
            // color: Cesium.Color.BLUE,
            // repeat: new Cesium.Cartesian2(4, 4)
        });
        let polyStyleSide = {
            height: - this.clipHeight,
            heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
            extrudedHeight: 0.0,
            // RELATIVE_TO_GROUND /CLAMP_TO_GROUND
            extrudedHeightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
            material: imgMaterialSide,
            outline: true,
            outlineColor: Cesium.Color.WHITE,
            closeTop: false,
            closeBottom: false
        }
        let entitySide =
            this.viewer.entities.add({
                polygon: polyStyleSide
            });
        entitySide.polygon.hierarchy = list
        this.tempEntities.push(entitySide);
    }
    _getPlane() {
        var origin = Cesium.Cartesian3.fromDegrees(-75.59777, 40.03883);
        var normal = Cesium.Ellipsoid.WGS84.geodeticSurfaceNormal(origin);
        var plane = Cesium.Plane.fromPointNormal(origin, normal);
    }
    //移除整个资源
    remove() {
        let viewer = this.viewer

        for (let lineEntity of this.lineEntities) {
            viewer.entities.remove(lineEntity)
        }
        for (let tempEntity of this.tempEntities) {
            viewer.entities.remove(tempEntity)
        }
        this.handler.destroy()
        if (viewer.scene.globe.clippingPlanes)
            viewer.scene.globe.clippingPlanes.enabled = false;
        this.clippingPlanesEnabled = false;
    }
}
