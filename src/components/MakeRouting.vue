<template>
  <div class="routingContainer">
    <label>鼠标左键点击输入起点和终点</label>
    <button v-on:click="getRouting()">执行</button>
  </div>
</template>
<script>
import PgRouting from "../modules/PgRouting";
export default {
  name: "MakeRouting",
  props: {
    viewer: {}
  },
  data() {
    return {
      startPoint: null,
      endPoint: null
    };
  },
  methods: {
    getRouting() {
      if (!this.makeRoutingObj) {
        this.makeRoutingObj = new PgRouting(this.viewer);
      }
    }
  }
};
</script>
<style scoped>
.routingContainer {
  position: absolute;
  left: 0;
  top: 60px;
  background-color: rgba(0, 2, 2, 0.8);
  color: silver;
  padding: 5px;
}
</style>


