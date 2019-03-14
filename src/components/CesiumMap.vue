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
    <div id="latlng_show">
      <div class="item">
        <font size="3" color="white">
          经度：
          <span id="longitude_show">{{log_String}}</span>
        </font>
      </div>
      <div class="item">
        <font size="3" color="white">
          纬度：
          <span id="latitude_show">{{lat_String}}</span>
        </font>
      </div>
      <div class="item">
        <font size="3" color="white">
          视角高：
          <span id="altitude_show">{{alti_String}}</span>km
        </font>
      </div>
    </div>
  </div>
</template>

<script>
import Cesium from "cesium/Source/Cesium";
import Viewer from "cesium/Source/Widgets/Viewer/Viewer";
import buildModuleUrl from "cesium/Source/Core/buildModuleUrl";
import "cesium/Source/Widgets/widgets.css";

import MeasureDistance from "../modules/MeasureDistance";
import MeasureArea from "../modules/MeasureArea";
import MeasureTriangle from "../modules/MeasureTriangle";
// import Measure from "../modules/measure";
import HeatMap from "../modules/heatmap";

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
      // terrainProvider: Cesium.createWorldTerrain()
      terrainProvider: new Cesium.CesiumTerrainProvider({
        url: "http://localhost:8080/o_lab",
        requestVertexNormals: true
      })
      // // 使用离线地图
      // imageryProvider: Cesium.createTileMapServiceImageryProvider({
      //   url: "../Cesium/Assets/Textures/NaturalEarthII"
      // })
    };
    this.viewer = new Viewer("cesiumContainer", opts);
    var viewer = this.viewer;
    // 深度检测
    // viewer.scene.globe.depthTestAgainstTerrain = true;
    // 实时坐标
    this.showPosition();
    // 初始位置
    // this.viewer.camera.setView({
    //   destination: Cesium.Cartesian3.fromDegrees(115.911245, 39.7667, 1500.0),
    //   orientation: {
    //     heading: Cesium.Math.toRadians(175.0),
    //     pitch: Cesium.Math.toRadians(-35.0),
    //     roll: 0.0
    //   }
    // });
    //设置相机位置、视角
    viewer.scene.camera.setView({
      destination: new Cesium.Cartesian3(
        -1206939.1925299785,
        5337998.241228442,
        3286279.2424502545
      ),
      orientation: {
        heading: 1.4059101895600987,
        pitch: -0.20917672793046682,
        roll: 2.708944180085382e-13
      }
    });
  },
  data() {
    return {
      viewer: {},
      selected: false,
      log_String: "",
      lat_String: "",
      alti_String: "",
      profileShow: false,
      profileData: null,
      submergAna: false
    };
  },
  components: {
    ProfileChart,
    SubmergAnalysis
  },
  methods: {
    measureTriangle: function() {
      // Measure.measureTriangle(this.viewer, null);

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
      // Measure.measureLineSpace(this.viewer, null);
      if (this.measureAre) {
        this.measureAre.remove();
        this.measureAre = null;
      }
      if (this.measureTri) {
        this.measureTri.remove();
        this.measureTri = null;
      }

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
      //  Measure.measureAreaSpace(this.viewer, null);
      if (this.measureDis) {
        this.measureDis.remove();
        this.measureDis = null;
      }
      if (this.measureTri) {
        this.measureTri.remove();
        this.measureTri = null;
      }
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
        var tileset = new Cesium.Cesium3DTileset({
          url: Cesium.IonResource.fromAssetId(5741)
        });
        tileset.style = new Cesium.Cesium3DTileStyle({
          color: {
            conditions: [
              ["${height} >= 300", "rgba(45, 0, 75, 0.5)"],
              ["${height} >= 200", "rgb(102, 71, 151)"],
              ["${height} >= 100", "rgb(170, 162, 204)"],
              ["${height} >= 50", "rgb(224, 226, 238)"],
              ["${height} >= 25", "rgb(252, 230, 200)"],
              ["${height} >= 10", "rgb(248, 176, 87)"],
              ["${height} >= 5", "rgb(198, 106, 11)"],
              ["true", "rgb(127, 59, 8)"]
            ]
          }
        });
        this.viewer.scene.primitives.add(tileset);
        this.tilesetObj = tileset;
      }

      // Set the initial camera view to look at Manhattan
      var initialPosition = Cesium.Cartesian3.fromDegrees(
        -74.01051302800248,
        40.70414333714821,
        353
      );
      var initialOrientation = new Cesium.HeadingPitchRoll.fromDegrees(
        21.27879878293835,
        -21.34390550872461,
        0.0716951918898415
      );
      this.viewer.scene.camera.setView({
        destination: initialPosition,
        orientation: initialOrientation,
        endTransform: Cesium.Matrix4.IDENTITY
      });
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
    showPosition: function() {
      let that = this;
      //具体事件的实现
      var ellipsoid = this.viewer.scene.globe.ellipsoid;

      var canvas = this.viewer.scene.canvas;
      var handler = new Cesium.ScreenSpaceEventHandler(canvas);
      handler.setInputAction(function(movement) {
        //捕获椭球体，将笛卡尔二维平面坐标转为椭球体的笛卡尔三维坐标，返回球体表面的点
        var cartesian = that.viewer.camera.pickEllipsoid(
          movement.endPosition,
          ellipsoid
        );
        if (cartesian) {
          //将笛卡尔三维坐标转为地图坐标（弧度）
          var cartographic = that.viewer.scene.globe.ellipsoid.cartesianToCartographic(
            cartesian
          );
          //将地图坐标（弧度）转为十进制的度数
          that.lat_String = Cesium.Math.toDegrees(
            cartographic.latitude
          ).toFixed(4);
          that.log_String = Cesium.Math.toDegrees(
            cartographic.longitude
          ).toFixed(4);
          that.alti_String = (
            that.viewer.camera.positionCartographic.height / 1000
          ).toFixed(2);
        }
      }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    }
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

#latlng_show {
  width: 340px;
  height: 30px;
  position: absolute;
  bottom: 40px;
  right: 20px;
  z-index: 1;
  font-size: 15px;
}

#latlng_show .item {
  width: 100px;
  height: 30px;
  float: left;
}

#menu {
  position: absolute;
  top: 50px;
}
</style>