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
  </div>
</template>
<script>
import SubmergenceAnalysis from "../modules/submerg-analysis";
export default {
  name: "SubmergAnalysis",
  props: {
    viewer: {}
  },
  data() {
    return {
      height_max: 1000,
      height_min: 200,
      speed: 20
    };
  },
  methods: {
    start() {
      if (!this.obj) {
        this.obj = new SubmergenceAnalysis(
          this.viewer,
          true,
          this.height_max,
          this.height_min,
          this.speed
        );
      }
      this.obj.start();
    },

    clear() {
      this.obj && this.obj.clear();
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
</style>

