import Cesium from 'cesium/Source/Cesium'
export default class computeCirclularFlight {
    constructor(viewer,lon, lat, radius) {
        this.tempEntities = [];
        let positionArr = this.computeCirclularFlight(lon, lat, radius);

        viewer.entities.add({
            polygon: {
                hierarchy: new Cesium.PolygonHierarchy(Cesium.Cartesian3.fromDegreesArray(
                    positionArr
                )),
                height: 0.0,
                extrudedHeight: 1000.0,
                outline: true,
                outlineColor: Cesium.Color.WHITE.withAlpha(0.0),
                outlineWidth: 1,
                material: Cesium.Color.WHITE.withAlpha(0.5)
            }
        });
    }
    computeCirclularFlight(lon, lat, radius) {
        let Ea = 6378137;      //   赤道半径
        let Eb = 6356725;      // 极半径 
        let positionArr = [];
        positionArr.push(lon);
        positionArr.push(lat);
        //需求正北是0° cesium正东是0°
        for (let i = 0; i <= 90; i++) {
            let dx = radius * Math.sin(i * Math.PI / 180.0);
            let dy = radius * Math.cos(i * Math.PI / 180.0);

            let ec = Eb + (Ea - Eb) * (90.0 - lat) / 90.0;
            let ed = ec * Math.cos(lat * Math.PI / 180);

            let BJD = lon + (dx / ed) * 180.0 / Math.PI;
            let BWD = lat + (dy / ec) * 180.0 / Math.PI;

            positionArr.push(BJD);
            positionArr.push(BWD);
        }
        console.log(positionArr);

        return positionArr;
    }


}

// let positionArr = computeCirclularFlight(-112.210693, 36.0994841, 3000);
