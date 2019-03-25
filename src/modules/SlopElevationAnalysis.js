import Cesium from 'cesium/Source/Cesium'
// 坡度和等高线分析
export default class SlopElevationAnalysis {
    constructor(viewer) {
        this.viewer = viewer
        this.elevationRamp = [0.0, 0.045, 0.1, 0.15, 0.37, 0.54, 1.0];
        this.slopeRamp = [0.0, 0.29, 0.5, Math.sqrt(2) / 2, 0.87, 0.91, 1.0];
        this.minHeight = -414.0; // approximate dead sea elevation
        this.maxHeight = 8777.0; // approximate everest elevation
        this.contourColor = Cesium.Color.RED.clone();
        this.contourUniforms = {};
        this.shadingUniforms = {};
        this._showLocation()

        // The viewModel tracks the state of our mini application.
        this.viewModel = {
            enableContour: false,
            contourSpacing: 150.0,
            contourWidth: 2.0,
            selectedShading: 'elevation',
            changeColor: function () {
                this.contourUniforms.color = Cesium.Color.fromRandom({ alpha: 1.0 }, contourColor);
            }
        };
        this.updateMaterial(this.viewModel)
        this.linePositionList = []
        this.lineEntities = []


    }
    _initViewOptions() {
        const viewer = this.viewer
        const skyAtm = viewer.skyAtmosphere
        this.viewerOptions = {
            skyAtmosphere: skyAtm
        }
        viewer.skyAtmosphere = false
    }
    addDisListener() {
        let viewer = this.viewer
        this._initViewOptions()
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
                    if (tempLength > 2) {
                        this.linePositionList.pop();
                        this.linePositionList.push(cartesian.clone());
                    }
                    this._clip(viewer.scene.globe)
                    this.linePositionList.length = 0
                }
                isDraw = false
                reDraw = true
            }
        }, Cesium.ScreenSpaceEventType.RIGHT_CLICK)
    }
    removeDisListener() {
        const viewer = this.viewer
        if (this.handler) {
            this.handler.destroy()
            this.handler = null
        }
        if (this.viewer.scene.globe.clippingPlanes) this.viewer.scene.globe.clippingPlanes.enabled = false;
        this.linePositionList.length = 0
        for (let lineEntity of this.lineEntities) {
            viewer.entities.remove(lineEntity)
        }
        this.lineEntities.length = 0
        // 回复原始viewer状态
        if (this.viewerOptions)
            viewer.skyAtmosphere = this.viewerOptions.skyAtmosphere

    }
    _showLocation() {
        //设置相机位置、视角
        this.viewer.scene.camera.setView({
            destination: new Cesium.Cartesian3(
                -2150844.0729017877,
                4422980.466115983,
                4073751.2901644544
            ),
            orientation: {
                heading: 0.05204345940394628,
                pitch: -0.7162450366469195,
                roll: 0.00022858775907597106
            }
        });
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
    _reDraw() {
        this.linePositionList.length = 0
    }
    // 尝试由挖洞转为多边形裁剪
    _clip(globe) {
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

            var normal = Cesium.Cartesian3.cross(up, right, new Cesium.Cartesian3());
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
            enabled: true,
            unionClippingRegions: true
        });
    }
    _getElevationContourMaterial() {
        // Creates a composite material with both elevation shading and contour lines
        return new Cesium.Material({
            fabric: {
                type: 'ElevationColorContour',
                materials: {
                    contourMaterial: {
                        type: 'ElevationContour'
                    },
                    elevationRampMaterial: {
                        type: 'ElevationRamp'
                    }
                },
                components: {
                    diffuse: 'contourMaterial.alpha == 0.0 ? elevationRampMaterial.diffuse : contourMaterial.diffuse',
                    alpha: 'max(contourMaterial.alpha, elevationRampMaterial.alpha)'
                }
            },
            translucent: false
        });
    }
    _getSlopeContourMaterial() {
        // Creates a composite material with both slope shading and contour lines
        return new Cesium.Material({
            fabric: {
                type: 'SlopeColorContour',
                materials: {
                    contourMaterial: {
                        type: 'ElevationContour'
                    },
                    slopeRampMaterial: {
                        type: 'SlopeRamp'
                    }
                },
                components: {
                    diffuse: 'contourMaterial.alpha == 0.0 ? slopeRampMaterial.diffuse : contourMaterial.diffuse',
                    alpha: 'max(contourMaterial.alpha, slopeRampMaterial.alpha)'
                }
            },
            translucent: false
        });
    }
    _getColorRamp(selectedShading) {
        var ramp = document.createElement('canvas');
        ramp.width = 100;
        ramp.height = 1;
        var ctx = ramp.getContext('2d');

        var values = selectedShading === 'elevation' ? this.elevationRamp : this.slopeRamp;

        var grd = ctx.createLinearGradient(0, 0, 100, 0);
        grd.addColorStop(values[0], '#000000'); //black
        grd.addColorStop(values[1], '#2747E0'); //blue
        grd.addColorStop(values[2], '#D33B7D'); //pink
        grd.addColorStop(values[3], '#D33038'); //red
        grd.addColorStop(values[4], '#FF9742'); //orange
        grd.addColorStop(values[5], '#ffd700'); //yellow
        grd.addColorStop(values[6], '#ffffff'); //white

        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, 100, 1);

        return ramp;
    }
    updateMaterial(viewModel) {
        const viewer = this.viewer
        let shadingUniforms = this.shadingUniforms
        let minHeight = this.minHeight
        let maxHeight = this.maxHeight
        let contourUniforms = this.contourUniforms
        let contourColor = this.contourColor
        var hasContour = viewModel.enableContour;
        var selectedShading = viewModel.selectedShading;
        var globe = viewer.scene.globe;

        var material;
        if (hasContour) {
            if (selectedShading === 'elevation') {
                material = this._getElevationContourMaterial();
                shadingUniforms = material.materials.elevationRampMaterial.uniforms;
                shadingUniforms.minHeight = minHeight;
                shadingUniforms.maxHeight = maxHeight;
                contourUniforms = material.materials.contourMaterial.uniforms;
            } else if (selectedShading === 'slope') {
                material = this._getSlopeContourMaterial();
                shadingUniforms = material.materials.slopeRampMaterial.uniforms;
                contourUniforms = material.materials.contourMaterial.uniforms;
            } else {
                material = Cesium.Material.fromType('ElevationContour');
                contourUniforms = material.uniforms;
            }
            contourUniforms.width = viewModel.contourWidth;
            contourUniforms.spacing = viewModel.contourSpacing;
            contourUniforms.color = contourColor;
        } else if (selectedShading === 'elevation') {
            material = Cesium.Material.fromType('ElevationRamp');
            shadingUniforms = material.uniforms;
            shadingUniforms.minHeight = minHeight;
            shadingUniforms.maxHeight = maxHeight;
        } else if (selectedShading === 'slope') {
            material = Cesium.Material.fromType('SlopeRamp');
            shadingUniforms = material.uniforms;
        }
        if (selectedShading !== 'none') {
            shadingUniforms.image = this._getColorRamp(selectedShading);
        }

        globe.material = material;
    }
    remove() {
        var viewer = this.viewer
        this.linePositionList.length = 0
        for (let lineEntity of this.lineEntities) {
            viewer.entities.remove(lineEntity)
        }
        this.lineEntities.length = 0
        this.handler.destroy()

    }
}