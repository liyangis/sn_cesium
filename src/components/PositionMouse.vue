<template>
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
        <span id="altitude_show">{{alti_String}}</span>
      </font>
      </div>
       <div class="item">
      <font size="3" color="white">
        海拔：
        <span id="altitude_show">{{height_String}}</span>
      </font>
      </div>
    </div>
  </div>
</template>
<script>
import Cesium from "cesium/Source/Cesium"; 
export default {
  name: "PositionMouse",
  props: {
    viewer: {}
  },
  data() {
    return {
      log_String: "",
      lat_String: "",
      alti_String: "",
      height_String: ""
    };
  },
  mounted: function() {},
  watch: {
    viewer(value) {
      this.showPosition();
    }
  },
  methods: {
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
          const h=that.viewer.scene.globe.getHeight(cartographic)
          that.alti_String = (
            that.viewer.camera.positionCartographic.height / 1000
          ).toFixed(2)+'km';
           that.height_String= 
            (h?h.toFixed(2):0)
        +'m';
        }
      }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    }
  }
};
</script>
<style scoped>
#latlng_show {
 
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
</style>


