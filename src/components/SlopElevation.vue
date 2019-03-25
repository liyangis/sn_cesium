<template>
  <div class="slopContainer">
    <div>选择分析范围</div>
    <select v-model="selected">
      <option v-for="option in options" :value="option.text" :key="option.value">{{option.text}}</option>
    </select>
    <input type="radio" name="type_map" v-on:click="changeType(0)" v-bind:checked="map_type==0">
    <label>原始图</label>
    <input type="radio" name="type_map" v-on:click="changeType(1)" v-bind:checked="map_type==1">
    <label>坡度图</label>
    <input type="radio" name="type_map" v-on:click="changeType(2)" v-bind:checked="map_type==2">
    <label>高程图</label>
    <input type="checkbox" name="contour" v-on:click="enabledContour">
    <label>等高线</label>
  </div>
</template>
<script>
import Cesium from "cesium/Source/Cesium";
import SlopElevationAnalysis from "../modules/SlopElevationAnalysis";
export default {
  name: "SlopElevation",
  props: {
    viewer: {}
  },
  data() {
    return {
      selected: "全部范围",
      options: [
        { text: "多边形绘制", value: "polygon" },
        {
          text: "全部范围",
          value: "all"
        }
      ],
      map_type: 2,
      viewModel: {},
      selectedShading: "elevation",
      enableContour: false
    };
  },
  mounted() {
    if (!this.slopEleObj) {
      this.slopEleObj = new SlopElevationAnalysis(this.viewer);
    }
  },
  methods: {
    changeType: function(e) {
      this.map_type = e;
    },
    enabledContour: function() {
      this.enableContour = !this.enableContour;
    }
  },
  destroyed() {
    if (this.viewer) {
      this.slopEleObj.viewModel.selectedShading = "none";
      this.slopEleObj.viewModel.enableContour = false;
      this.slopEleObj.updateMaterial(this.slopEleObj.viewModel);
      this.slopEleObj.removeDisListener();
      this.slopEleObj = null;
    }
  },
  watch: {
    map_type: function(value) {
      let type="none"
      switch (value) {
        case 0:
          type="none"
          break;
       case 1:
          type="slope"
          break;
           case 2:
          type="elevation"
          break;
        default:
          break;
      }
      this.slopEleObj.viewModel.selectedShading = type;
      this.slopEleObj.updateMaterial(this.slopEleObj.viewModel);
    },
    enableContour: function(value) {
      this.slopEleObj.viewModel.enableContour = value;
      this.slopEleObj.updateMaterial(this.slopEleObj.viewModel);
    },
    selected: function(value) {
      if (this.slopEleObj) {
        if (value == "多边形绘制") {
          this.slopEleObj.addDisListener();
        } else {
          this.slopEleObj.removeDisListener();
         
        }
      }
    }
  }
};
</script>
<style scoped>
.slopContainer {
  position: absolute;
  left: 0;
  top: 60px;
  background-color: rgba(0, 2, 2, 0.8);
  color: silver;
  padding: 5px;
}
</style>


