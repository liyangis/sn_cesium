<template>
  <div class="routingContainer">
    <label>左键</label>
    <button v-on:click="getRouting()">执行</button>
    <input type="radio" name="type" v-on:click="changeType(0)" v-bind:checked="type==0">
    <label>追踪</label>
    <input type="radio" name="type" v-on:click="changeType(1)" v-bind:checked="type==1">
    <label>俯视</label>
    <input type="radio" name="type" v-on:click="changeType(2)" v-bind:checked="type==1">
    <label>侧视</label>
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
      endPoint: null,
      type: 0
    };
  },
  destroyed() {
    if (this.makeRoutingObj) {
      this.makeRoutingObj.remove();
    }
  },
  methods: {
    getRouting() {
      if (!this.makeRoutingObj) {
        this.makeRoutingObj = new PgRouting(this.viewer);
      }
    },
    changeType(type) {
      if (this.makeRoutingObj) {
        this.makeRoutingObj.changeType(type);
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
button {
  border: 0px;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  margin: 0 3px 0 3px;
}
</style>


