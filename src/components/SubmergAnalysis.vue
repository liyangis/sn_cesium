<template>
  <div class="sub_ana_container">
    <label>最大高度:</label>
    <input type="number" v-model="height_max">
    <label>最小高度:</label>
    <input type="number" v-model="height_min">
    <label>淹没速度:</label>
    <input type="number" v-model="speed">
    <button class="btn" v-on:click="start()">开始</button>
    <button class="btn" v-on:click="clear()">清除</button>
    <input type="radio" name="type_map" v-on:click="changeType" v-bind:checked="map_type">
    <label>范围图</label>
    <input type="radio" name="type_map" v-on:click="changeType" v-bind:checked="!map_type">
    <label>深度图</label>
  </div>
</template>
<script>
import Cesium from "cesium/Source/Cesium";
import SubmergenceAnalysis from "../modules/submerg-analysis";
export default {
  name: "SubmergAnalysis",
  props: {
    viewer: {}
  },
  data() {
    return {
      height_max: 800,
      height_min: 300,
      speed: 20,
      map_type: true
    };
  },
  mounted() {
    this._initViewStatus(this.viewer);
  },
  destroyed() {
    if (this.viewer) {
      var skyAtmosphere = this.viewer.scene.skyAtmosphere;
      this.viewer.scene.globe.clippingPlanes.enabled = false;
      if (this.obj) {
        this.obj.remove();
      }
    }
  },
  methods: {
    start() {
      if (!this.obj) {
        this.obj = new SubmergenceAnalysis(
          this.viewer,
          true,
          this.height_max,
          this.height_min,
          this.speed,
          this.map_type
        );
      }
      this.obj.start();
    },

    clear() {
      this.obj && this.obj.clear();
    },
    changeType() {
      this.map_type = !this.map_type;
    },
    _initViewStatus(viewer) {
      var scene = viewer.scene;
      scene.globe.depthTestAgainstTerrain = true;
      scene.camera.setView({
        // 摄像头的位置
        destination: Cesium.Cartesian3.fromDegrees(115.9216, 39.987, 1500.0),
        orientation: {
          heading: Cesium.Math.toRadians(0.0), //默认朝北0度，顺时针方向，东是90度
          pitch: Cesium.Math.toRadians(-20), //默认朝下看-90,0为水平看，
          roll: Cesium.Math.toRadians(0) //默认0
        }
      });
    }
  },
  watch: {
    height_max(value) {
      this.obj && (this.obj.height_max = value);
    },
    height_min(value) {
      this.obj && (this.obj.height_min = value);
    },
    speed(value) {
      this.obj && (this.obj.speed = value);
    },
    map_type(value) {
      if (this.obj) {
        this.obj.map_type = value;
        this.obj.changeMapType(value);
      }
    }
  }
};
</script>
<style scoped>
.sub_ana_container {
  position: absolute;
  top: 50px;
  width: auto;
  height: auto;
  border: solid 1px;
  padding: 12px;
  color: rgb(221, 218, 218);
}
.btn {
  color: white;
  background-color: #555758;
  border: #555758;
  margin: 6px;
}
input {
  width: 100px;
}
label {
  margin: 8px;
  color: rgb(221, 218, 218);
}
input[type="radio"] {
  width: 30px;
}
</style>

