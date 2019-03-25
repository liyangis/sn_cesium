<template>
  <div class="queryContainer">
    半径（米）:
    <input type="number" class="buffer-radius" v-model="bufferRadius">
    <input type="radio" name="type" v-on:click="changeType(0)" v-bind:checked="type=='point'">
    <label>点</label>
    <input type="radio" name="type" v-on:click="changeType(1)" v-bind:checked="type=='polyline'">
    <label>线</label>
    <button v-on:click="query()">确定</button>
    <button v-on:click="clear()">清除</button>
    <div class="result">
      <ul>
        <li v-for="item in queryResults" :key="item.id">
          <div class="item">
            <div class="item-id">{{item.id}}</div>
            <div class="item-text">{{item.text}}</div>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>
<script>
import QueryByBuffer from "../modules/query/queryByBuffer";
export default {
  name: "QueryBuffer",
  props: {
    viewer: {}
  },
  data() {
    return {
      type: "point",
      bufferRadius: 100,
      queryResults: []
    };
  },
  mounted: function() {
    const that = this;
    if (!this.queryObj) {
      this.queryObj = new QueryByBuffer(
        this.viewer,
        this.type,
        Number.parseInt(this.bufferRadius),
        e => {
          that.queryResults = e;
        }
      );
    }
  },
  destroyed() {
    if (this.queryObj) {
      this.queryObj.remove();
      this.queryObj.destroy();
      this.queryObj = null;
    }
  },
  methods: {
    changeType(e) {
      this.type = e ? "polyline" : "point";
    },
    query(type) {
      const that = this;
      if (this.queryObj) {
        this.queryObj._addDisListener();
      }
    },
    clear() {
      if (this.queryObj) {
        this.queryObj.remove();
        //this.queryObj = null;
      }
      this.queryResults.splice(0);
    }
  },
  watch: {
    bufferRadius(value) {
      if (this.queryObj) {
        this.queryObj.bufferRadius = Number.parseInt(value);
      }
    },
    type() {
      if (this.queryObj) {
        this.queryObj.queryType = this.type;
      }
    }
  }
};
</script>
<style scoped>
.queryContainer {
  position: absolute;
  left: 0;
  top: 60px;
  background-color: rgba(0, 2, 2, 0.8);
  color: silver;
  padding: 5px;
}
.result {
  margin-top: 5px;
  height: 300px;
  overflow-y: auto;
}
ul {
  padding: 0;
  margin: 0;
}
li {
  margin: 5px 0 5px 0;
  list-style: none;
  border-top: 1px solid #d8dae1;
}
.item-id {
  float: left;
  margin-right: 3px;
  /* line-height: 10px; */
  width: 25px;
}
.item-text {
  overflow: hidden;
}
button {
  border: 0px;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  margin: 0 3px 0 3px;
}
.buffer-radius {
  width: 50px;
}
</style>


