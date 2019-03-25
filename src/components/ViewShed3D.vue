<template>
  <div class="viewshed-container">
    <button class="btn-dem" v-on:click="demShow()">地形-点光源</button>
    <button class="btn-dem-spot">地形-聚光灯</button>
    <button class="btn-3dtiles">模型-点光源</button>
    <button class="btn-3dtiles-spot">模型-聚光灯</button>
    <button class="btn-3dtiles-spot" v-on:click="clear()">清除</button>
    <input type="number" name="height" id="height" v-model="height">高度
  </div>
</template>
<script>
import Cesium from "cesium/Source/Cesium";

export default {
  name: "ViewShed3D",
  props: {
    viewer: {}
  },
  data() {
    return {
      height: 10,
      camera: {}
    };
  },
  watch: {
    height(value) {
      this.cartographic.height = parseInt(value) * 10;
      const cartographic = this.cartographic;
      this.camera.position = Cesium.Cartographic.toCartesian(cartographic);
      const modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(
        Cesium.Cartographic.toCartesian(cartographic)
      );
      this.plane.modelMatrix = modelMatrix;
    }
  },
  methods: {
    clear: function() {
      const viewer = this.viewer;
      if (this.circle) {
        viewer.scene.primitives.remove(this.circle);
        this.circle = null;
      }
    },
    demShow: function() {
      const that = this;
      const viewer = this.viewer;
      const scene = viewer.scene;
      viewer.terrainShadows = Cesium.ShadowMode.ENABLED;
      viewer.shadows = true;
      var rectangle = viewer.camera.computeViewRectangle();
      const cartographic = Cesium.Rectangle.center(rectangle);
      cartographic.height = this.height * 10;
      this.cartographic = cartographic;
      const position = Cesium.Cartographic.toCartesian(cartographic);
      var hpRoll = new Cesium.HeadingPitchRoll();
      const converter = Cesium.Transforms.eastNorthUpToFixedFrame;
      const model_plane = Cesium.Model.fromGltf({
        url: "models/CesiumAir/Cesium_Air.glb",
        modelMatrix: Cesium.Transforms.headingPitchRollToFixedFrame(
          position,
          hpRoll,
          Cesium.Ellipsoid.WGS84,
          converter
        ),
        minimumPixelSize: 128,
        shadows: Cesium.ShadowMode.DISABLED
      });
      var planePrimitive = scene.primitives.add(model_plane);
      planePrimitive.readyPromise.then(function(model) {
        // 2. Using a HeadingPitchRange offset
        // var center = Cesium.Cartesian3.fromDegrees(-72.0, 40.0);
        var heading = Cesium.Math.toRadians(50.0);
        var pitch = Cesium.Math.toRadians(-20.0);
        var range = 500.0;
        // scene.camera.lookAt(
        //   position,
        //   new Cesium.HeadingPitchRange(heading, pitch, range)
        // );
      });
      this.plane = planePrimitive;
      // 定位到某地形区域
      // 设置光源为点光源
      // 点光源的camera坐标位置，和高度

      const camera1 = new Cesium.Camera(scene);

      camera1.position = position;
      camera1.direction = Cesium.Cartesian3.negate(
        Cesium.Cartesian3.UNIT_Z,
        new Cesium.Cartesian3()
      );
      let pri = viewer.scene.primitives.add(
        new Cesium.DebugCameraPrimitive({
          camera: camera1,
          color: Cesium.Color.YELLOW,
          updateOnChange: true
          // shadows: Cesium.ShadowMode.ENABLED
        })
      );
      this.camera = camera1;
      viewer.shadowMap._lightCamera = camera1;
      var defaults = {
        depthTest: {
          enabled: false
        }
      };
      var rs = Cesium.RenderState.fromCache(defaults);

      var instance = new Cesium.GeometryInstance({
        geometry: new Cesium.EllipseGeometry({
          center: position,
          semiMinorAxis: 600.0,
          semiMajorAxis: 600.0
        })
      });
      this.circle = viewer.scene.primitives.add(
        new Cesium.Primitive({
          geometryInstances: instance,
          appearance: new Cesium.EllipsoidSurfaceAppearance({
            material: Cesium.Material.fromType("Color"),
            renderState: rs
          })
        })
      );
    },
    demSpotShow: function() {}
  }
};
</script>
<style scoped>
.viewshed-container {
  position: absolute;
  left: 0;
  top: 60px;
  background-color: rgba(0, 2, 2, 0.8);
  color: silver;
  padding: 5px;
}
</style>
