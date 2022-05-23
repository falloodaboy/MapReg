import React from 'react'
import styles from './Components.module.css';
import Delaunator from 'delaunator';
import SimplexNoise from 'simplex-noise';


class Map extends React.Component {

    constructor(props:any) {
        super(props);
        this.state = {
            canvas: null
        }

        this.renderMap = this.renderMap.bind(this);
    }

  generateMap(size: number, jitter:number): any[] {
        let points = [];
        for(let x = 0; x <= size; x++) {
            for(let y=0; y <= size; y++) {
                points.push({ x: x + jitter * (Math.random() - Math.random())  , y: y + jitter * (Math.random() - Math.random())});
            }
        }
        points.push({x: -100, y: 0});
        points.push({x: 1000, y:1000});
        points.push({x:-100, y: 1000});
        points.push({x: 1000, y:-100});
        return points;
  }
  
  renderMap(): any {
    if(this.state.canvas != null) {
        let gridSize = 20;
        let points =  this.generateMap(gridSize, 0.5);
        let delaunay = Delaunator.from(points, loc => loc.x, loc => loc.y);
        let centroids = this.calculateCentroids(points, delaunay);
        let ctx = this.state.canvas.getContext("2d");
        ctx!.canvas.width = 800;
        ctx!.canvas.height = 800;
    
        let map = {
            points,
            numRegions: points.length,
            numTriangles: delaunay.halfedges.length / 3,
            numEdges: delaunay.halfedges.length,
            halfedges: delaunay.halfedges,
            centers: centroids,
            triangles: delaunay.triangles
        };
          let elevation = this.assignElevation(map, gridSize);
          let moisture = this.assignMoisture(map, gridSize);
          //this.drawPoints(points, canvas, gridSize);
          this.drawCellBoundaries(this.state.canvas, map, delaunay, gridSize);
          this.drawCellColors(this.state.canvas, map, (r:any) => this.biomeColor(canvas, r, elevation, moisture), gridSize, elevation, delaunay);
       
    }
    else{
        console.log("canvas is null");
    }
   
  }
  drawPoints(points:any, canvas:HTMLCanvasElement, gridSize:number) {
        let ctx = canvas.getContext("2d");
        ctx!.save();
        for(let point of points) {
            ctx!.beginPath()
            ctx!.arc(point.x * canvas.width/ gridSize, point.y * canvas.width/ gridSize, 2, 0, 2*Math.PI);
            ctx!.fill();
        }
        ctx!.restore();
  }

  edgesAroundPoint(delaunay:any, start:any) {
    const result = [];
    let incoming = start;
    do {
        result.push(incoming);
        const outgoing = this.nextHalfedge(incoming);
        incoming = delaunay.halfedges[outgoing];
    } while (incoming !== -1 && incoming !== start);
    return result;
  }

  componentDidMount() {
     
     let gridSize = 20;
     let canvas = document.getElementById("canvas") as HTMLCanvasElement;
     this.setState({
         canvas: canvas
     })
     let points =  this.generateMap(gridSize, 0.5);
     let delaunay = Delaunator.from(points, loc => loc.x, loc => loc.y);
     let centroids = this.calculateCentroids(points, delaunay);
     let ctx = canvas.getContext("2d");
     ctx!.canvas.width = 800;
     ctx!.canvas.height = 800;

     let map = {
         points,
         numRegions: points.length,
         numTriangles: delaunay.halfedges.length / 3,
         numEdges: delaunay.halfedges.length,
         halfedges: delaunay.halfedges,
         centers: centroids,
         triangles: delaunay.triangles
     };
       let elevation = this.assignElevation(map, gridSize);
       let moisture = this.assignMoisture(map, gridSize);
       //this.drawPoints(points, canvas, gridSize);
       this.drawCellBoundaries(canvas, map, delaunay, gridSize);
       this.drawCellColors(canvas, map, (r:any) => this.biomeColor(canvas, r, elevation, moisture), gridSize, elevation, delaunay);
       
  }

  drawCellColors(canvas:any, map:any, colorFn: any, gridSize: number, elevation: any, delaunay: any) {
        let ctx = canvas.getContext("2d");
        ctx.save();
        ctx.scale(canvas.width / gridSize, canvas.height / gridSize);
        let seen = new Set();
        let {triangles, numEdges, centers} = map;
        for(let e = 0; e < numEdges; e++) {
            let r = triangles[this.nextHalfedge(e)];
            if(!seen.has(r)) {
                seen.add(r);
                let vertices = this.edgesAroundPoint(delaunay, e)
                .map(e => centers[this.triangleOfEdge(e)]);
                ctx.fillStyle = colorFn(r);
                ctx.beginPath();
                ctx.moveTo(vertices[0].x, vertices[0].y);
                for(let i= 1; i < vertices.length; i++) {
                    ctx.lineTo(vertices[i].x, vertices[i].y);
                }
                ctx.fill();
            }
           
        }
       
  }

  drawCellBoundaries(canvas:any, map:any, delaunay: any, GRIDSIZE:any) {
    let {points, centers, halfedges, numEdges} = map;
    let ctx = canvas.getContext('2d');
    ctx.save();
    ctx.scale(canvas.width / GRIDSIZE, canvas.height / GRIDSIZE);
    ctx.lineWidth = 0.1;
    ctx.strokeStyle = "black";
    for (let e = 0; e < numEdges; e++) {
        if (e < delaunay.halfedges[e]) {
            const p = centers[this.triangleOfEdge(e)];
            const q = centers[this.triangleOfEdge(halfedges[e])];
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
        }
    }
    ctx.restore();
}
  triangleOfEdge(e:any)  { return Math.floor(e / 3); }

  nextHalfedge(e:any) { return (e % 3 === 2) ? e - 2 : e + 1; }

  calculateCentroids(points:any, delaunay:any) {
    const numTriangles = delaunay.halfedges.length / 3;
    let centroids = [];
    for (let t = 0; t < numTriangles; t++) {
        let sumOfX = 0, sumOfY = 0;
        for (let i = 0; i < 3; i++) {
            let s = 3*t + i;
            let p = points[delaunay.triangles[s]];
            sumOfX += p.x;
            sumOfY += p.y;
        }
        centroids[t] = {x: sumOfX / 3, y: sumOfY / 3};
    }
    return centroids;
  }

  WAVELENGTH = 0.45;

  assignElevation(map:any, gridSize: number) {
        let noise = new SimplexNoise();
        let {points, numRegions} = map;
        let elevation = [];
        for(let r = 0; r < numRegions; r++) {
            let nx = points[r].x / gridSize - 0.5;
            let ny = points[r].y / gridSize - 0.5;
            elevation[r] = (1 + noise.noise2D(nx / this.WAVELENGTH, ny / this.WAVELENGTH)) / 2;
            let d = 2 * Math.max(Math.abs(nx), Math.abs(ny)); 
            elevation[r] = (1 + elevation[r] - d ) / 2;
           
        }
        return elevation;
  }


  assignMoisture(map:any, gridSize:number) {
        let noise = new SimplexNoise();
        let {points, triangles, numRegions} = map;
        let moisture = []
        for(let r = 0; r < numRegions; r++) {
            let nx = points[r].x / gridSize - 0.5;
            let ny = points[r].y / gridSize - 0.5;
            moisture[r] = (1 + noise.noise2D(nx / this.WAVELENGTH, ny / this.WAVELENGTH)) / 2;
        }

        return moisture;
  }

  biomeColor(canvas:any, r: any, elevation: any, moisture: any) {
        let e = (elevation[r] - 0.5) *2;
        let m = moisture[r];
        let rr, g, b;
        
        if(e < 0) {
            rr = 48 + 48*e;
            g = 64 + 64*e;
            b = 127 + 127*e;
        }
        else {
            m = m * (1-e);
            e = e**2;
            rr = 210 - 100 * m;
            g = 185 - 45 * m;
            b = 139 - 45 * m;
            rr = 255 * e + rr * (1-e),
            g = 255 * e + g * (1-e),
            b = 255 * e + b * (1-e);
        }

        return `rgb(${rr}, ${g}, ${b})`;
  }


  render() {
    return (
        <div>
            <nav className={styles.navbar}>
                <button className={styles.navItem} onClick={this.renderMap}> Generate Map </button>
            </nav>
            <canvas className={styles.mapCanvas} id="canvas" ></canvas>
        </div>
      )
  }

}

export default Map