import * as turf from '@turf/turf'
import Cesium from 'cesium/Source/Cesium'
 
export default class MeasureArea {
    constructor(viewer, isTerrain, style) {
		this.viewer = viewer;
		this.isTerrain = isTerrain;
		this.style = style
 
        this.handler = null
		this.tempEntities = [];
		this.lineEntities = []
		this.linePositionList = [];
        this.areaPositionList = []
		this.labelPosition = {
			x: 1,
			y: 1,
			z: 1
		};
		this.countArea = "";
		this.tempPoints = []
		this.textDivs = []
 
		this._addDisListener()
	}
    _addDisListener() {
        let viewer = this.viewer
        let scene = viewer.scene;
        let linePositionList = this.linePositionList
        // let areaPositionList = this.areaPositionList
        this.handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
        this._drawLine(linePositionList);
        this._countArea()
        this._drawPoly();
        let isDraw = false
        let reDraw = false
        this.handler.setInputAction((movement) => {
            if (reDraw) {
                this._reDraw()
                reDraw = false
            }
            let pickedObject = scene.pick(movement.position);
            if (!Cesium.defined(pickedObject) || pickedObject.primitive instanceof Cesium.Polyline) {
                let cartesian = this.isTerrain === true ? scene.pickPosition(movement.position) : viewer.camera.pickEllipsoid(movement.position, scene.globe.ellipsoid);
                if (cartesian) {
                    this.tempPoints.push(this._car3ToLatLon(cartesian));
                    linePositionList.push(cartesian);
                    // areaPositionList.push(cartesian)
                    this._drawPoint(this.tempPoints[this.tempPoints.length - 1]);
                }
                isDraw = true
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
        this.handler.setInputAction((movement) => {
            if (isDraw) {
                let cartesian = this.isTerrain === true ? scene.pickPosition(movement.endPosition) : viewer.camera.pickEllipsoid(movement.endPosition, scene.globe.ellipsoid);
                if (cartesian) {
                    let tempPoints = this.tempPoints
                    if (linePositionList.length > 1) {
                        linePositionList.pop();
                        linePositionList.push(cartesian);
                        this.labelPosition = cartesian
                    }
                    if (linePositionList.length === 1) {
                        linePositionList.push(cartesian);
                    }
                    if (tempPoints.length>2) {
                        tempPoints.pop()
                        tempPoints.push(this._car3ToLatLon(cartesian));
 
                    }
                    if(tempPoints.length===2){
                        tempPoints.push(this._car3ToLatLon(cartesian));
                    }
                    if (tempPoints.length<2) {
                        return ;
                    }
                    var area = this._SphericalPolygonAreaMeters(tempPoints)
					this.countArea = area > 1000000 ? (area / 1000000).toFixed(1) + 'k㎡' : area.toFixed(1) + '㎡'
                    if (area > 10000000000) this.countArea = (area / 10000000000).toFixed(1) + '万k㎡'
                }
            }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        this.handler.setInputAction((movement) => {
            if (isDraw) {
                let cartesian = this.isTerrain === true ? scene.pickPosition(movement.position) : viewer.camera.pickEllipsoid(movement.position, scene.globe.ellipsoid);
                if (cartesian) {
                    var tempLength = this.tempPoints.length;
                    if (tempLength < 2) {
                        alert('请选择3个以上的点再执行闭合操作命令');
                        this._reDraw()
                        return ;
                    }
                    let tempPoints = this.tempPoints
                    tempPoints.push(this._car3ToLatLon(cartesian));
                    linePositionList.push(cartesian);
                    this._drawPoint(tempPoints[tempPoints.length - 1]);
                    // this._drawDiv(cartesian)
                    // this._drawPoly(tempPoints);
                    // this._drawArea(tempPoints)
                    // this.countArea = null
                }
                isDraw = false
                reDraw = true
            }
        }, Cesium.ScreenSpaceEventType.RIGHT_CLICK)
    }
    _reDraw(){
        this.tempPoints = []
        this.linePositionList.length = 0
        for (let entity of  this.tempEntities) {
            this.viewer.entities.remove(entity)
        }
        this.tempEntities=[]
    }
    _drawArea(tempPoints){
        let area = this._SphericalPolygonAreaMeters(tempPoints)
        let are = area > 1000000 ? (area / 1000000).toFixed(1) + 'k㎡' : area.toFixed(1) + '㎡'
        if (area > 10000000000) are = (area / 10000000000).toFixed(1) + '万k㎡'
 
        var entity =
            viewer.entities.add({
                position: Cesium.Cartesian3.fromDegrees(tempPoints[tempPoints.length - 1].lon, tempPoints[tempPoints.length - 1].lat),
                label: this.style.labelStyle
            });
        entity.label.text = '面积' + are
        this.tempEntities.push(entity);
    }
    _countArea(){
		let self = this;
		let entity =this.viewer.entities.add({
				label: this.style.labelStyle
			});
		entity.position = new Cesium.CallbackProperty(function() {
			return self.labelPosition;
		}, false)
		entity.label.text = new Cesium.CallbackProperty(function() {
			return self.countArea;
		}, false)
		this.lineEntities.push(entity);
	}
 
    _drawLine(linePositionList) {
		let lineStyle = this.style.lineStyle
		let self = this;
		let entity =this.viewer.entities.add({
				polyline: lineStyle,
			});
 
		entity.polyline.positions = new Cesium.CallbackProperty(function() {
			return linePositionList;
		}, false)
 
        this.lineEntities.push(entity);
	}
    _drawPoint(point) {
		let entity =
			this.viewer.entities.add({
				position: Cesium.Cartesian3.fromDegrees(point.lon, point.lat),
				point: {
                    pixelSize: 5,
					color: new Cesium.Color.fromBytes(96, 210, 255),
					// disableDepthTestDistance: Number.POSITIVE_INFINITY,
					// heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
				}
			});
		this.tempEntities.push(entity);
	}
 
    _drawDiv(cartesian3) {
        let viewer = this.viewer
        let container = viewer.container
        let textDiv = document.createElement('div')
        this.textDivs.push(textDiv)
        container.appendChild(textDiv)
        textDiv.setAttribute('style', 'width:200px;height:30px;border:1px solid rgb(61,154,250);border-radius:4px;box-shadow:0px 0px 30px rgb(61,154,250) inset, 0px 0px 30px rgb(61,154,250);position:absolute;')
 
        viewer.clock.onTick.addEventListener(function(clock) {
            let cartesian = Cesium.SceneTransforms.wgs84ToWindowCoordinates(viewer.scene, cartesian3);
            // console.log(cartesian)
            textDiv.style.left = `${cartesian.x-100}px`
            textDiv.style.top = `${cartesian.y}px`
        })
    }
    _removeDiv(){
        for (let textDiv of this.textDivs) {
            this.viewer.container.removeChild(textDiv)
            this.textDivs = []
        }
    }
 
    _drawPoly() {
        // let points = this.tempPoints
        // if (points.length<3) {
        //     return ;
        // }
		let polyStyle = this.style.polyStyle
		// let pArray = [];
		// for (let i = 0; i < points.length; i++) {
		// 	pArray.push(points[i].lon);
		// 	pArray.push(points[i].lat);
		// 	// pArray.push(points[i].height)
		// }
		// polyStyle.hierarchy = new Cesium.PolygonHierarchy(Cesium.Cartesian3.fromDegreesArray(pArray))
		let entity =
			this.viewer.entities.add({
				polygon: polyStyle
			});
        entity.polygon.hierarchy = new Cesium.CallbackProperty(()=> {
			return this.linePositionList;
		}, false)
		// entity.polygon.hierarchy = Cesium.Cartesian3.fromDegreesArrayHeights(pArray)
		this.lineEntities.push(entity);
	}
 
	// 世界坐标转经纬坐标
	_car3ToLatLon(cartesian) {
		let cartographic = Cesium.Cartographic.fromCartesian(cartesian);
		let longitudeString = Cesium.Math.toDegrees(cartographic.longitude);
		let latitudeString = Cesium.Math.toDegrees(cartographic.latitude);
		return {
			lon: longitudeString,
			lat: latitudeString,
			height: cartographic.height
		};
	}
    // 计算面积
	_SphericalPolygonAreaMeters(points) {
		let arr = []
		for (let point of points) {
			arr.push([point.lon, point.lat])
		}
		arr.push([points[0].lon, points[0].lat])
		let arr1 = []
		arr1.push(arr)
		let polygon = turf.polygon(arr1)
		let area = turf.area(polygon);
		// console.log(area)
		return area;
	}
 
    //移除整个资源
	remove(){
		let viewer = this.viewer
		// for (let textDiv of this.textDivs) {
		// 	viewer.container.removeChild(textDiv)
		// }
		for (let tempEntity of this.tempEntities) {
			viewer.entities.remove(tempEntity)
		}
		for (let lineEntity of this.lineEntities) {
			viewer.entities.remove(lineEntity)
		}
        this.handler.destroy()
	}
 
}