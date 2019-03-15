<template>
  <div class="container">
    <div id="cesiumContainer"></div>
    <canvas id="myCanvas"></canvas>
    <!-- <div id="menu">
            <p>
              <button v-on:click="DrawLineKSY()">可视域</button>
            </p>
            <p>
              <button v-on:click="ClearAll()">清除</button>
            </p>
    </div>-->
    <div class="measure">
      <ul>
        <li v-on:click="measureTriangle()">高度</li>
        <li :class="selected?'btn-sel':'btn'" v-on:click="measureDistance()">距离</li>
        <li v-on:click="measureArea()">面积</li>
        <li v-on:click="remove()">清除</li>
        <li v-show="true" v-on:click="heatMap()">热力图</li>
        <li v-on:click="createProfile()">剖面分析</li>
        <li v-on:click="add3DTiles()">3DTiles</li>
        <li v-on:click="createViewLine()">通视(DEM)</li>
        <li v-on:click="createViewLine(1)">通视(3DTiles)</li>
        <li v-on:click="createViewShed()">可视域(DEM)</li>
        <li v-on:click="submergenceAnalysis()">淹没分析</li>
      </ul>
    </div>
    <ProfileChart v-show="profileShow" v-bind:dataSet="profileData"></ProfileChart>
    <SubmergAnalysis v-if="submergAna" v-bind:viewer="viewer"></SubmergAnalysis>
    <div id="credit"></div>
    <PositionMouse v-bind:viewer="viewer"></PositionMouse>
  </div>
</template>

<script>
import Cesium from "cesium/Source/Cesium";
import Viewer from "cesium/Source/Widgets/Viewer/Viewer";
import buildModuleUrl from "cesium/Source/Core/buildModuleUrl";
import "cesium/Source/Widgets/widgets.css";
import Base from "../modules/Base";
import MeasureDistance from "../modules/MeasureDistance";
import MeasureArea from "../modules/MeasureArea";
import MeasureTriangle from "../modules/MeasureTriangle";
import HeatMap from "../modules/heatmap";
import PositionMouse from "./PositionMouse.vue";
import ProfileChart from "./ProfileChart.vue";
import DrawProfile from "../modules/DrawProfile";
import DrawViewLine from "../modules/DrawView";
import ViewShed3D from "../modules/viewshed_3dtiles/ViewShed3D";

import SubmergAnalysis from "./SubmergAnalysis.vue";
export default {
  name: "CesiumMap",
  mounted: function() {
    // buildModuleUrl.setBaseUrl("../static/cesium/");
    buildModuleUrl.setBaseUrl("../cesium/");
    let opts = {
      animation: false, //是否显示动画控件
      baseLayerPicker: false, //是否显示图层选择控件
      geocoder: false, //是否显示地名查找控件
      timeline: false, //是否显示时间线控件
      sceneModePicker: false, //是否显示投影方式控件
      navigationHelpButton: false, //是否显示帮助信息控件
      infoBox: false, //是否显示点击要素之后显示的信息
      homeButton: false,
      selectionIndicator: false,
      creditContainer: "credit",
      shouldAnimate: true,
      // terrainProvider: Cesium.createWorldTerrain()
      terrainProvider: new Cesium.CesiumTerrainProvider({
        url: "http://localhost:8080/o_lab",
        requestVertexNormals: true
      })
    };
    this.viewer = new Viewer("cesiumContainer", opts);
    var viewer = this.viewer;
    this.base = new Base(viewer);
    this.base.showBeijingPositon();
    // 深度检测
    // viewer.scene.globe.depthTestAgainstTerrain = true;
  },
  data() {
    return {
      viewer: {},
      selected: false,
      profileShow: false,
      profileData: null,
      submergAna: false
    };
  },
  components: {
    PositionMouse,
    ProfileChart,
    SubmergAnalysis
  },
  methods: {
    measureTriangle: function() {
      if (this.measureAre) {
        this.measureAre.remove();
        this.measureAre = null;
      }
      if (this.measureDis) {
        this.measureDis.remove();
        this.measureDis = null;
      }

      this.measureTri = new MeasureTriangle(
        this.viewer,
        false,
        {
          labelStyle: {
            font: "15px sans-serif",
            pixelOffset: new Cesium.Cartesian2(0.0, -30),
            fillColor: new Cesium.Color(1, 1, 1, 1),
            showBackground: true,
            disableDepthTestDistance: Number.POSITIVE_INFINITY
          },
          lineStyle: {
            width: 2,
            material: Cesium.Color.CHARTREUSE
          }
        },
        () => {}
      );
    },
    measureDistance: function() {
      this.remove();
      this.measureDis = new MeasureDistance(
        this.viewer,
        false,
        {
          labelStyle: {
            pixelOffset: new Cesium.Cartesian2(0.0, -30),
            fillColor: new Cesium.Color(1, 1, 1, 1),
            showBackground: true,
            disableDepthTestDistance: Number.POSITIVE_INFINITY
          },
          lineStyle: {
            width: 2,
            material: Cesium.Color.CHARTREUSE
            // 是否贴地
            // clampToGround: true,
          }
        },
        () => {}
      );
    },

    measureArea: function() {
      this.remove();
      this.measureAre = new MeasureArea(this.viewer, false, {
        labelStyle: {
          pixelOffset: new Cesium.Cartesian2(0.0, -30),
          fillColor: new Cesium.Color(1, 1, 1, 1),
          showBackground: true,
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        },
        lineStyle: {
          width: 1,
          material: Cesium.Color.CHARTREUSE
        },
        polyStyle: {
          hierarchy: {},
          outline: true,
          outlineColor: Cesium.Color.MAGENTA,
          outlineWidth: 2,
          material: Cesium.Color.CHARTREUSE,
          // 默认贴地
          arcType: Cesium.ArcType.GEODESIC
        }
      });
    },

    remove: function() {
      if (this.measureAre) {
        this.measureAre.remove();
        this.measureAre = null;
      }
      if (this.measureDis) {
        this.measureDis.remove();
        this.measureDis = null;
      }
      if (this.measureTri) {
        this.measureTri.remove();
        this.measureTri = null;
      }
      if (this.profileObj) {
        this.profileObj.remove();
        this.profileObj = null;
        this.profileShow = false;
      }
      if (this.viewSlightLine) {
        this.viewSlightLine.remove();
        this.viewSlightLine = null;
      }
    },
    heatMap: function() {
      this.heatMapObj = new HeatMap(this.viewer);
    },
    createProfile: function() {
      this.profileShow = false;
      this.profileObj = new DrawProfile(
        this.viewer,
        {
          lineStyle: {
            width: 2,
            material: Cesium.Color.CHARTREUSE,

            // 是否贴地
            clampToGround: true
          }
        },
        data => {
          this.profileShow = true;
          this.profileData = data;
        }
      );
    },
    add3DTiles: function() {
      // Load the NYC buildings tileset
      if (!this.tilesetObj) {
        var tileset = this.base.get3Dtiles();
        this.viewer.scene.primitives.add(tileset);
        this.tilesetObj = tileset;
      }
      this.base.show3DtilesPosition();
    },
    createViewLine: function(type = 0) {
      this.remove();
      this.viewSlightLine = new DrawViewLine(
        this.viewer,
        type,
        {
          lineStyle: {
            width: 2,
            material: Cesium.Color.CHARTREUSE
            // 是否贴地
            // clampToGround: true,
          }
        },
        data => {
          this.profileShow = true;
          this.profileData = data;
        }
      );
    },
    submergenceAnalysis: function() {
      this.submergAna = !this.submergAna;
    },
    createViewShed: function() {
      if (!this.viewShedObj) {
        this.viewShedObj = new ViewShed3D(this.viewer);
      }
    },

  }
};
</script>

<style scoped>
#cesiumContainer {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

.container {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

#credit {
  display: none;
}

.measure {
  position: absolute;
  top: 1px;
  background-color: #555758;
  padding: 5px;
  height: 30px;
  color: #fff;
}

ul {
  margin: 0;
  padding: 0;
}

ul li {
  list-style-type: none;
  float: left;
  cursor: pointer;
  margin: 0px 3px;
  border: 1px;
}

.btn-sel {
  border: 1px;
}

.btn {
  border: 0px;
}

#menu {
  position: absolute;
  top: 50px;
}
</style>