import Cesium from 'cesium/Source/Cesium'
export default class ViewShed3DAnalysis {
    constructor(viewer, position = null) {
        this.viewer = viewer
        var canvas = viewer.canvas;
        canvas.setAttribute('tabindex', '0'); // needed to put focus on the canvas
        canvas.addEventListener('click', function () {
            canvas.focus();
        });
        canvas.focus();
        this.viewer.shouldAnimate = true
        const scene = viewer.scene

        this.scene = scene
        this.camera = scene.camera
        var camera = new Cesium.Camera(scene);
        this.viewCamera = camera
        this.position = position
        this.viewCamera.position = Cesium.Cartesian3.fromDegrees(-123.0744619, 44.0503706, 5000);
        // this.createModel('models/CesiumAir/Cesium_Air.glb', 5000.0)
        // this.createPlanePrimitive('models/CesiumAir/Cesium_Air.glb', 5000.0)
        // this.test()
        this.addAnimate()
    }
    createModel(url, height) {
        this.viewer.entities.removeAll();
        var position = Cesium.Cartesian3.fromDegrees(-123.0744619, 44.0503706, height);
        var heading = Cesium.Math.toRadians(135);
        var pitch = 0;
        var roll = 0;
        var hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);
        var orientation = Cesium.Transforms.headingPitchRollQuaternion(position, hpr);

        var entity = this.viewer.entities.add({
            name: url,
            position: position,
            orientation: orientation,
            model: {
                uri: url,
                minimumPixelSize: 128,
                maximumScale: 20000
            }
        });
        this.viewer.trackedEntity = entity;
        const scene = this.viewer.scene
        var camera1 = new Cesium.Camera(scene);
        camera1.position = position
        camera1.direction = Cesium.Cartesian3.negate(Cesium.Cartesian3.UNIT_Z, new Cesium.Cartesian3());
        camera1.up = Cesium.Cartesian3.clone(Cesium.Cartesian3.UNIT_Y);
        camera1.frustum.fov = Cesium.Math.PI_OVER_THREE;
        camera1.frustum.near = 1.0;
        camera1.frustum.far = 2000;
        scene.primitives.add(new Cesium.DebugCameraPrimitive({
            camera: camera1,
            color: Cesium.Color.YELLOW,
            updateOnChange: false
        }));
    }
    createPlanePrimitive(url, height) {
        const viewer = this.viewer
        const scene = this.scene
        const primitives = scene.primitives
        var position = Cesium.Cartesian3.fromDegrees(117.075, 40.045000, height);
        var hpRoll = new Cesium.HeadingPitchRoll();
        const converter = Cesium.Transforms.eastNorthUpToFixedFrame
        var planePrimitive = scene.primitives.add(Cesium.Model.fromGltf({
            url: 'models/CesiumAir/Cesium_Air.glb',
            modelMatrix: Cesium.Transforms.headingPitchRollToFixedFrame(position, hpRoll, Cesium.Ellipsoid.WGS84, converter),
            minimumPixelSize: 128
        }));
        planePrimitive.readyPromise.then(function (model) {
            // 2. Using a HeadingPitchRange offset
            // var center = Cesium.Cartesian3.fromDegrees(-72.0, 40.0);
            var heading = Cesium.Math.toRadians(50.0);
            var pitch = Cesium.Math.toRadians(-20.0);
            var range = 500.0;
            scene.camera.lookAt(position, new Cesium.HeadingPitchRange(heading, pitch, range));
        })
        // this.primitives.push({ primitive: planePrimitive, converter: converter, position: position });
        // 添加飞机视域
        var camera1 = new Cesium.Camera(scene);
        // camera1.position = Cesium.Cartesian3.fromDegrees(-123.075, 44.045000, 5000);
        camera1.position = position
        camera1.direction = Cesium.Cartesian3.negate(Cesium.Cartesian3.UNIT_Z, new Cesium.Cartesian3());
        camera1.up = Cesium.Cartesian3.clone(Cesium.Cartesian3.UNIT_Y);
        camera1.frustum.fov = Cesium.Math.PI_OVER_THREE;
        camera1.frustum.near = 1.0;
        camera1.frustum.far = 2;
        viewer.scene.primitives.add(new Cesium.DebugCameraPrimitive({
            camera: camera1,
            color: Cesium.Color.YELLOW,
            updateOnChange: false
        }));
    }
    addAnimate() {
        const viewer = this.viewer
        const scene = viewer.scene
        //Set the random number seed for consistent results.
        Cesium.Math.setRandomNumberSeed(3);
        //Set bounds of our simulation time
        var start = Cesium.JulianDate.fromDate(new Date(2015, 2, 25, 16));
        var stop = Cesium.JulianDate.addSeconds(start, 360, new Cesium.JulianDate());
        //Make sure viewer is at the desired time.
        viewer.clock.startTime = start.clone();
        viewer.clock.stopTime = stop.clone();
        viewer.clock.currentTime = start.clone();
        viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP; //Loop at the end
        viewer.clock.multiplier = 10;

        //Set timeline to simulation bounds
        // viewer.timeline.zoomTo(start, stop);
        //Compute the entity position property.
        let flightPositions = this.computeCirclularFlight(-112.110693, 36.0994841, 0.03, start);
        this.flightPositions = flightPositions
        const that = this
        // 添加飞机视域
        const flightOrientation = new Cesium.VelocityOrientationProperty(flightPositions)

        var clock = viewer.clock;
        const orientation = flightOrientation.getValue(clock.currentTime)
        var camera1 = new Cesium.Camera(scene);
        var position = flightPositions.getValue(clock.currentTime);
        // camera1.flyTo({
        //     destination: position, orientation: orientation
        // })
        camera1.position = position;//flightPositions.getValue(clock.currentTime);
        // camera1.direction = Cesium.Cartesian3.negate(Cesium.Cartesian3.UNIT_Z, new Cesium.Cartesian3());
        // camera1.up = Cesium.Cartesian3.clone(Cesium.Cartesian3.UNIT_Y);
        camera1.frustum.fov = Cesium.Math.PI_OVER_THREE;
        camera1.frustum.near = 1.0;
        camera1.frustum.far = 2;
        viewer.scene.primitives.add(new Cesium.DebugCameraPrimitive({
            camera: camera1,
            color: Cesium.Color.YELLOW,
            updateOnChange: true
        }));

        scene.postRender.addEventListener(function () {
            if (flightPositions) {
                try {
                    const position = flightPositions.getValue(clock.currentTime);
                    camera1.position = position;
                    const orientation = flightOrientation.getValue(clock.currentTime)
                    const rotation = Cesium.Quaternion.computeAngle(orientation)
                    // camera1.flyTo({
                    //     destination: position, orientation: orientation
                    // })

                } catch (e) { }


            }

        });
        //Actually create the entity
        var entity = viewer.entities.add({

            //Set the entity availability to the same interval as the simulation time.
            availability: new Cesium.TimeIntervalCollection([new Cesium.TimeInterval({
                start: start,
                stop: stop
            })]),

            //Use our computed positions
            position: flightPositions,

            //Automatically compute orientation based on position movement.
            orientation: new Cesium.VelocityOrientationProperty(flightPositions),

            //Load the Cesium plane model to represent the entity
            model: {
                uri: 'models/CesiumAir/Cesium_Air.gltf',
                minimumPixelSize: 64
            },

            //Show the path as a pink line sampled in 1 second increments.
            path: {
                resolution: 1,
                material: new Cesium.PolylineGlowMaterialProperty({
                    glowPower: 0.1,
                    color: Cesium.Color.YELLOW
                }),
                width: 10
            }
        });
        entity.position.setInterpolationOptions({
            interpolationDegree: 1,
            interpolationAlgorithm: Cesium.LinearApproximation
        });
        viewer.zoomTo(viewer.entities, new Cesium.HeadingPitchRange(Cesium.Math.toRadians(-90), Cesium.Math.toRadians(-15), 7500));
    }
    //Generate a random circular pattern with varying heights.
    computeCirclularFlight(lon, lat, radius, start) {
        var property = new Cesium.SampledPositionProperty();
        for (var i = 0; i <= 360; i += 45) {
            var radians = Cesium.Math.toRadians(i);
            var time = Cesium.JulianDate.addSeconds(start, i, new Cesium.JulianDate());
            var position = Cesium.Cartesian3.fromDegrees(lon + (radius * 1.5 * Math.cos(radians)), lat + (radius * Math.sin(radians)), Cesium.Math.nextRandomNumber() * 500 + 1750);
            property.addSample(time, position);

            //Also create a point for each sample we generate.
            this.viewer.entities.add({
                position: position,
                point: {
                    pixelSize: 8,
                    color: Cesium.Color.TRANSPARENT,
                    outlineColor: Cesium.Color.YELLOW,
                    outlineWidth: 3
                }
            });
        }
        return property;
    }
    test() {
        var viewer = this.viewer;
        var canvas = viewer.canvas;
        canvas.setAttribute("tabindex", "0"); // needed to put focus on the canvas
        canvas.addEventListener("click", function () {
            canvas.focus();
        });
        canvas.focus();

        var scene = viewer.scene;
        var camera = viewer.camera;
        var controller = scene.screenSpaceCameraController;
        var r = 0;
        var center = new Cesium.Cartesian3();

        var hpRoll = new Cesium.HeadingPitchRoll();
        var hpRange = new Cesium.HeadingPitchRange();
        var deltaRadians = Cesium.Math.toRadians(1.0);

        var localFrames = [
            {
                pos: Cesium.Cartesian3.fromDegrees(-123.075, 44.045, 5000.0),
                converter: Cesium.Transforms.eastNorthUpToFixedFrame,
                comments: "Classical East North Up\nlocal Frame"
            },
            {
                pos: Cesium.Cartesian3.fromDegrees(-123.075, 44.05, 5500.0),
                converter: Cesium.Transforms.localFrameToFixedFrameGenerator(
                    "north",
                    "west"
                ),
                comments: "North West Up\nlocal Frame"
            },
            {
                pos: Cesium.Cartesian3.fromDegrees(-123.075, 44.04, 4500.0),
                converter: Cesium.Transforms.localFrameToFixedFrameGenerator(
                    "south",
                    "up"
                ),
                comments: "South Up West\nlocal Frame"
            },
            {
                pos: Cesium.Cartesian3.fromDegrees(-123.075, 44.05, 4500.0),
                converter: Cesium.Transforms.localFrameToFixedFrameGenerator(
                    "up",
                    "east"
                ),
                comments: "Up East North\nlocal Frame"
            },
            {
                pos: Cesium.Cartesian3.fromDegrees(-123.075, 44.04, 5500.0),
                converter: Cesium.Transforms.localFrameToFixedFrameGenerator(
                    "down",
                    "east"
                ),
                comments: "Down East South\nlocal Frame"
            }
        ];

        var primitives = [];
        var hprRollZero = new Cesium.HeadingPitchRoll();

        for (var i = 0; i < localFrames.length; i++) {
            var position = localFrames[i].pos;
            var converter = localFrames[i].converter;
            var comments = localFrames[i].comments;
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

            primitives.push({
                primitive: planePrimitive,
                converter: converter,
                position: position
            });
            createViewshed(scene, position);
            var modelMatrix = Cesium.Transforms.headingPitchRollToFixedFrame(
                position,
                hprRollZero,
                Cesium.Ellipsoid.WGS84,
                converter
            );
            scene.primitives.add(
                new Cesium.DebugModelMatrixPrimitive({
                    modelMatrix: modelMatrix,
                    length: 300.0,
                    width: 10.0
                })
            );

            var positionLabel = position.clone();
            positionLabel.z = position.z + 300.0;
            viewer.entities.add({
                position: positionLabel,
                label: {
                    text: comments,
                    font: "18px Helvetica",
                    fillColor: Cesium.Color.WHITE,
                    outlineColor: Cesium.Color.BLACK,
                    outlineWidth: 2,
                    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                    verticalOrigin: Cesium.VerticalOrigin.CENTER,
                    HorizontalOrigin: Cesium.HorizontalOrigin.RIGHT
                }
            });
        }
        primitives[0].primitive.readyPromise.then(function (model) {
            // Play and loop all animations at half-speed
            model.activeAnimations.addAll({
                multiplier: 0.5,
                loop: Cesium.ModelAnimationLoop.REPEAT
            });

            // Zoom to model
            r = 2.0 * Math.max(model.boundingSphere.radius, camera.frustum.near);
            controller.minimumZoomDistance = r * 0.5;
            Cesium.Matrix4.multiplyByPoint(
                model.modelMatrix,
                model.boundingSphere.center,
                center
            );
            var heading = Cesium.Math.toRadians(90.0);
            var pitch = Cesium.Math.toRadians(0.0);
            hpRange.heading = heading;
            hpRange.pitch = pitch;
            hpRange.range = r * 100.0;
            camera.lookAt(center, hpRange);
        });

        function createViewshed(scene, position) {
            var camera1 = new Cesium.Camera(scene);
            camera1.position = position;
            camera1.direction = Cesium.Cartesian3.negate(
                Cesium.Cartesian3.UNIT_Z,
                new Cesium.Cartesian3()
            );
            camera1.up = Cesium.Cartesian3.clone(Cesium.Cartesian3.UNIT_Y);
            camera1.frustum.fov = Cesium.Math.PI_OVER_THREE;
            camera1.frustum.near = 1.0;
            camera1.frustum.far = 200;
            viewer.scene.primitives.add(
                new Cesium.DebugCameraPrimitive({
                    camera: camera1,
                    color: Cesium.Color.YELLOW,
                    updateOnChange: false
                })
            );
        }
    }
}