import Cesium from 'cesium/Source/Cesium'
export default class ViewShed3D{
    constructor(viewer,position){
        this.viewer=viewer
        const scene=viewer.scene
        this.scene=scene
        this.camera=scene.camera
        var camera = new Cesium.Camera(scene);
        this.viewCamera=camera
        this.position=position
        this.viewCamera.position=Cesium.Cartesian3.fromDegrees(-123.075, 44.045000, 5000)  
        this._addPlane()
    }
    _init(){
        const camera=this.viewCamera
        camera.direction = Cesium.Cartesian3.negate(Cesium.Cartesian3.UNIT_Z, new Cesium.Cartesian3());
        camera.up = Cesium.Cartesian3.clone(Cesium.Cartesian3.UNIT_Y);
        camera.frustum.fov = Cesium.Math.PI_OVER_THREE;
        camera.frustum.near = 1.0;
        camera.frustum.far = 2000;
         this.scene.primitives.add(new Cesium.DebugCameraPrimitive({
          camera : camera,
          color : Cesium.Color.YELLOW,
                updateOnChange:false
          }));
    }
    _addPlane() {
      const camera=this.camera
        var controller = this.scene.screenSpaceCameraController;
        var r = 0;
        var center = new Cesium.Cartesian3();

        var hpRoll = new Cesium.HeadingPitchRoll();
        var hpRange = new Cesium.HeadingPitchRange();
        var speed = 10;
        var deltaRadians = Cesium.Math.toRadians(3.0);

        var position = Cesium.Cartesian3.fromDegrees(119.0744619, 39.0503706, 3000.0);
        var speedVector = new Cesium.Cartesian3();
        var fixedFrameTransform = Cesium.Transforms.localFrameToFixedFrameGenerator('north', 'west');
        var planePrimitive = this.scene.primitives.add(Cesium.Model.fromGltf({
            url: '../../SampleData/models/CesiumAir/Cesium_Air.glb',
            modelMatrix: Cesium.Transforms.headingPitchRollToFixedFrame(this.position, hpRoll, Cesium.Ellipsoid.WGS84, fixedFrameTransform),
            minimumPixelSize: 128
        }));

        planePrimitive.readyPromise.then(function(model) {
            // Play and loop all animations at half-speed
            model.activeAnimations.addAll({
                multiplier : 0.5,
                loop : Cesium.ModelAnimationLoop.REPEAT
            });
        
            // Zoom to model
            r = 2.0 * Math.max(model.boundingSphere.radius, camera.frustum.near);
            controller.minimumZoomDistance = r * 0.5;
            Cesium.Matrix4.multiplyByPoint(model.modelMatrix, model.boundingSphere.center, center);
            var heading = Cesium.Math.toRadians(230.0);
            var pitch = Cesium.Math.toRadians(-20.0);
            hpRange.heading = heading;
            hpRange.pitch = pitch;
            hpRange.range = r * 50.0;
            camera.lookAt(center, hpRange);
        });

    }
    
    
}