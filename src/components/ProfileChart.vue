<template>
  <svg width="500" height="270">
    <g style="transform: translate(60px, 10px)">
      <path :d="line"></path>
      <path id="line2" :d="line"></path>
    </g>
    <g id="yAxis"></g>
  </svg>
</template>
<script>
import * as d3 from "d3";
export default {
  name: "ProfileChart",
  props: {
    dataSet: Array
  },
  data() {
    return {
      data: [99, 71, 78, 25, 36, 92],
      line: ""
    };
  },
  mounted() {
    // this.calculatePath();
    // this.addChart();
  },
  watch: {
    data(value) {
      console.log(value);
    },
    dataSet(value) {
      console.log(value);
      this.calculatePath(value);
    }
  },
  methods: {
    getScales(value) {
      const x = d3.scaleTime().range([0, 430]);
      const y = d3.scaleLinear().range([250, 0]);
      d3.axisLeft().scale(x);
      d3.axisBottom().scale(y);
      x.domain(d3.extent(value, (d, i) => i));
      y.domain([d3.min(value, d => d), d3.max(value, d => d)]);
      return { x, y };
    },
    calculatePath(value) {
      const scale = this.getScales(value);
      const path = d3
        .line()
        .x((d, i) => scale.x(i))
        .y(d => scale.y(d));
      this.line = path(value);
      
      const yAxis = d3.axisLeft(scale.y);
      const g = d3.select("#yAxis");
      g.attr("transform", "translate(" + 50 + "," + 10 + ")").call(yAxis);
    }
   
  }
};
</script>
<style  scoped>
svg {
  margin: 25px;
  position: absolute;
  left:0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  color: beige;
}

path {
  fill: none;
  stroke: #76bf8a;
  stroke-width: 3px;
}
</style>