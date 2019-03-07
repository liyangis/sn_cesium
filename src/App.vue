<template>
  <div id="app">
    <cesiumViewer></cesiumViewer>
      </div>
</template>

<script>
import cesiumViewer from "./components/Map.vue"
export default {
  name: 'App',
  components : {
    'cesiumViewer' : cesiumViewer
  }
}
</script>

<style>
html, body {
 width: 100%; 
 height: 100%; 
 margin: 0; 
 padding: 0; 
 overflow: hidden;
}
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  width: 100%;
  height: 100%;
}
</style>
