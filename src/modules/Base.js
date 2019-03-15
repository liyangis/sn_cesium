import Cesium from "cesium/Source/Cesium";
export default class Base {
  constructor(viewer) {
    this.viewer = viewer
    this.terrain = new Cesium.CesiumTerrainProvider({
      url: "http://localhost:8080/o_lab",
      requestVertexNormals: true
    })
    this.imageryProvider = Cesium.createTileMapServiceImageryProvider({
      url: "../Cesium/Assets/Textures/NaturalEarthII"
    })
  }
  showLocation() {
    //设置相机位置、视角
    this.viewer.scene.camera.setView({
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
  }
  showBeijingPositon() {
    this.viewer.scene.camera.setView({
      // 摄像头的位置
      destination: Cesium.Cartesian3.fromDegrees(115.9216, 39.987, 1500.0),
      orientation: {
        heading: Cesium.Math.toRadians(0.0), //默认朝北0度，顺时针方向，东是90度
        pitch: Cesium.Math.toRadians(-20), //默认朝下看-90,0为水平看，
        roll: Cesium.Math.toRadians(0) //默认0
      }
    });
  }
  show3DtilesPosition() {

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
  }
  get3Dtiles() {
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
    return tileset
  }

  test() {
    const viewer = this.viewer;
    const scene = this.viewer.scene;
    const primitives = scene.primitives;
    var position = Cesium.Cartesian3.fromDegrees(117.075, 40.045, 50);
    var hpRoll = new Cesium.HeadingPitchRoll();
    const converter = Cesium.Transforms.eastNorthUpToFixedFrame;
    var planePrimitive = scene.primitives.add(
      Cesium.Model.fromGltf({
        url: "models/CesiumAir/Cesium_Air.glb",
        modelMatrix: Cesium.Transforms.headingPitchRollToFixedFrame(
          position,
          hpRoll,
          Cesium.Ellipsoid.WGS84,
          converter
        ),
        minimumPixelSize: 128
      })
    );
    planePrimitive.readyPromise.then(function (model) {
      // 2. Using a HeadingPitchRange offset
      // var center = Cesium.Cartesian3.fromDegrees(-72.0, 40.0);
      var heading = Cesium.Math.toRadians(50.0);
      var pitch = Cesium.Math.toRadians(-20.0);
      var range = 500.0;
      scene.camera.lookAt(
        position,
        new Cesium.HeadingPitchRange(heading, pitch, range)
      );
    });
    // this.primitives.push({ primitive: planePrimitive, converter: converter, position: position });
    // 添加飞机视域
    var camera1 = new Cesium.Camera(scene);
    // camera1.position = Cesium.Cartesian3.fromDegrees(-123.075, 44.045000, 5000);
    camera1.position = position;
    camera1.direction = Cesium.Cartesian3.negate(
      Cesium.Cartesian3.UNIT_Z,
      new Cesium.Cartesian3()
    );
    camera1.up = Cesium.Cartesian3.clone(Cesium.Cartesian3.UNIT_Y);
    camera1.frustum.fov = Cesium.Math.PI_OVER_THREE;
    camera1.frustum.near = 1.0;
    camera1.frustum.far = 200;
    let pri=viewer.scene.primitives.add(
      new Cesium.DebugCameraPrimitive({
        camera: camera1,
        color: Cesium.Color.YELLOW,
        updateOnChange: false

      })
    );
    // 动态更改camera1的位置
    setTimeout(()=>{
      const position=camera1.position
      camera1.position=new Cesium.Cartesian3(position.x+10,position.y,position.z)
    },5000)
  }


}
export var BaseFunction = (function () {
  const base = {}

  return base
})()

// // Click the projection picker to switch between orthographic and perspective projections.
// var viewer = new Cesium.Viewer('cesiumContainer', {
//   projectionPicker : true
// });

// // start with orthographic projection
// viewer.projectionPicker.viewModel.switchToOrthographic();

// var position = Cesium.Cartesian3.fromDegrees(-123.0744619, 44.0503706, 0.0);
// var hpr = new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(135), 0.0, 0.0);
// var orientation = Cesium.Transforms.headingPitchRollQuaternion(position, hpr);

// var entity = viewer.entities.add({
//   position : position,
//   orientation : orientation,
//   model : {
//       uri : '../../SampleData/models/CesiumMilkTruck/CesiumMilkTruck-kmc.glb',
//       minimumPixelSize : 128,
//       maximumScale : 20000
//   }
// });
// var frustum = new Cesium.PerspectiveOffCenterFrustum({
//   left : -1.0,
//   right : 1.0,
//   top : 1.0,
//   bottom : -1.0,
//   near : 1.0,
//   far : 100.0
// });
// var frustum1 = new Cesium.OrthographicFrustum();
// frustum1.near = 1;
// frustum1.far = 500;

// viewer.trackedEntity = entity;
// var camera1 = new Cesium.Camera(viewer.scene);
// camera1.position =  Cesium.Cartesian3.fromDegrees(-123.0744619, 44.0503706, 50);
// camera1.direction = Cesium.Cartesian3.negate(Cesium.Cartesian3.UNIT_Z, new Cesium.Cartesian3());
// camera1.up = Cesium.Cartesian3.clone(Cesium.Cartesian3.UNIT_Y);
// camera1.frustum= new Cesium.PerspectiveFrustum({
// fov : Cesium.Math.PI_OVER_THREE  ,
//   aspectRatio : 1,
//   near : 1.0,
//   far : 100.0})

// viewer.scene.primitives.add(new Cesium.DebugCameraPrimitive({
// camera : camera1,
// color : Cesium.Color.YELLOW,
//       updateOnChange:true
// }));
// var h=50
// setInterval(() => {
//   h=h+10
// console.log(h)
// camera1.position= Cesium.Cartesian3.fromDegrees(-123.0744619, 44.0503706, h);
// }, 5000);
