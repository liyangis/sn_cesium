
import Cesium from 'cesium/Source/Cesium'
export default class ClipTerrain {
    constructor(viewer, height = 500) {
        this.viewer = viewer
        this.clipHeight = height
        this.isTerrain = true
        this.handler = null
        this.tempEntities = [];
        this.linePositionList = []
        this.areaPositionList = []
        this.tempPositionList = []
        this.lineEntities = []
        this.clippingPlanesEnabled = true
        this._addDisListener()
    }

    _addDisListener() {
        let viewer = this.viewer
        let scene = viewer.scene;
        let linePositionList = this.linePositionList
        viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

        let areaPositionList = this.areaPositionList
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
                areaPositionList.push(cartesian.clone())
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
                        this.labelPosition = cartesian.clone();
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
                    linePositionList.push(cartesian.clone());
                    this._loadStHelens(viewer.scene.globe)
                }
                isDraw = false
                reDraw = true
            }
        }, Cesium.ScreenSpaceEventType.RIGHT_CLICK)
    }
    _reDraw() {
        this.linePositionList.length = 0
        this.areaPositionList.length = 0
    }
    _loadStHelens(globe) {
        // Create clipping planes for polygon around area to be clipped.
        const points = this.linePositionList
        var pointsLength = points.length;

        // Create center points for each clipping plane
        var clippingPlanes = [];
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
        globe.clippingPlanes = new Cesium.ClippingPlaneCollection({
            planes: clippingPlanes,
            edgeWidth: 1.0,
            edgeColor: Cesium.Color.WHITE,
            enabled: true
        });
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
            // return this.areaPositionList;
            return this.linePositionList;
        }, false)
        // entity.polygon.hierarchy = Cesium.Cartesian3.fromDegreesArrayHeights(pArray)
        this.lineEntities.push(entity);

    }
    //移除整个资源
    remove() {
        let viewer = this.viewer

        for (let lineEntity of this.lineEntities) {
            viewer.entities.remove(lineEntity)
        }
        this.handler.destroy()
        viewer.scene.globe.clippingPlanes.enabled = false;
        this.clippingPlanesEnabled = false;
    }
}
