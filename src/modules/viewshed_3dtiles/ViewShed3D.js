import Cesium from 'cesium/Source/Cesium'
export default class ViewShed3D {
    constructor(viewer, position = null) {
        this.viewer = viewer
        const scene = viewer.scene
        this.scene = scene
        this.camera = scene.camera
        var camera = new Cesium.Camera(scene);
        this.viewCamera = camera
        this.position = position
        this.viewCamera.position = Cesium.Cartesian3.fromDegrees(-123.0744619, 44.0503706, 5000);
        this.createModel('models/CesiumAir/Cesium_Air.glb', 5000.0)
    }
    createModel(url, height) {
        this.viewer.entities.removeAll();
        var position = Cesium.Cartesian3.fromDegrees(-123.0744619, 44.0503706, height);
        var heading = Cesium.Math.toRadians(135);
        var pitch = 0;
        var roll = 0;
        var hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);
        var orientation = Cesium.Transforms.headingPitchRollQuaternion(position, hpr);

        var entity = this.viewer.entities.add({
            name: url,
            position: position,
            orientation: orientation,
            model: {
                uri: url,
                minimumPixelSize: 128,
                maximumScale: 20000
            }
        });
        this.viewer.trackedEntity = entity;
        const scene = this.viewer.scene
        var camera1 = new Cesium.Camera(scene);
        camera1.position = position
        camera1.direction = Cesium.Cartesian3.negate(Cesium.Cartesian3.UNIT_Z, new Cesium.Cartesian3());
        camera1.up = Cesium.Cartesian3.clone(Cesium.Cartesian3.UNIT_Y);
        camera1.frustum.fov = Cesium.Math.PI_OVER_THREE;
        camera1.frustum.near = 1.0;
        camera1.frustum.far = 2000;
        scene.primitives.add(new Cesium.DebugCameraPrimitive({
            camera: camera1,
            color: Cesium.Color.YELLOW,
            updateOnChange: false
        }));
    }
}