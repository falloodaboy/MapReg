import React, { createContext } from 'react'
import styles from './Components.module.css';
import Delaunator from 'delaunator';
import SimplexNoise from 'simplex-noise';


interface Polygon {
    station: {x: number, y: number},
    vertices: any[]
}
interface Edge {
    from: any,
    to: any
}
class Map extends React.Component {
    

    constructor(props:any) {
        super(props);
        this.state = {
            canvas: null,
            stationedges: [],
            cetroidedges: []
        }

        this.renderMap = this.renderMap.bind(this);
      
        
    }

  buildGraphs(map:any, delaunay:any) {
        let {triangles, numEdges, points, centers, halfedges} = map;
        let stationedges = [];
        let centroidedges = [];
        
        //build the "red points" graph
        for(let t=0; t < triangles.length; t++) {
            if(t > halfedges[t]) { //if there is no opposing edge (e.g. is a convex hull)
                    const p = points[triangles[t]];
                    const q = points[triangles[this.nextHalfedge(t)]];
                    let nedge:Edge = {
                        from: p,
                        to: q
                    };
                    stationedges.push(nedge);
            }
        }
        let seen = new Set();
        //build the "blue points" graph
        for(let t = 0; t < triangles.length; t++) {
            let p = triangles[this.nextHalfedge(t)];
            if(!seen.has(p)){
                seen.add(p);
                let edges = this.edgesAroundPoint(delaunay, t);
                let vertices = edges.map(e => centers[this.triangleOfEdge(e)]); //vertices of a polygon
                for(let r = 0; r < vertices.length-1; r++){
                    let nedge:Edge = {
                        from: vertices[r],
                        to: vertices[r+1]
                    };
                    centroidedges.push(nedge);
                }
                let nedge:Edge = {
                    from: vertices[vertices.length-1],
                    to: vertices[0]
                };
                centroidedges.push(nedge);
            }
        }

        this.setState({
            canvas: this.state.canvas,
            stationedges: stationedges,
            centroidedges: centroidedges
        });
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
        let points =  this.generateMap(gridSize, 0.4);
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
          //this.drawCellBoundaries(this.state.canvas, map, delaunay, gridSize);
         // this.drawCellColors(this.state.canvas, map, (r:any) => this.biomeColor(canvas, r, elevation, moisture), gridSize, elevation, delaunay);
          this.buildGraphs(map, delaunay);
         // this.drawTriangles(ctx, gridSize, map, delaunay);
         this.generateLine(ctx, map, gridSize);
    }
    else{
        console.log("canvas is null");
    }
   
  }

  drawTriangles(ctx:any, GRIDSIZE: any, map: any, delaunay:any) {
        ctx.save();
        ctx.scale(ctx.canvas.width / GRIDSIZE, ctx.canvas.height / GRIDSIZE);
        ctx.fillStyle = 'green';
        ctx.lineWidth = 0.02;
        let {centers, triangles, numEdges} = map
        let seen = new Set();
        for(let e = 100; e < 101; e++ ){
            let p = triangles[this.nextHalfedge(e)];

            if(!seen.has(p)){
                seen.add(p);
                let vertices = this.edgesAroundPoint(delaunay, e).map(e => centers[this.triangleOfEdge(e)]);
                let res = this.ziggityzaggity(vertices, 5, 2);
               
                    ctx.beginPath();
                    ctx.moveTo(res[0].x, res[0].y);
                    for(let i = 1; i < res.length; i++) {
                        ctx.lineTo(res[i].x, res[i].y);
                    }
                    ctx.stroke();
                
                // ctx.beginPath();
                // ctx.moveTo(vertices[0].x, vertices[0].y);
                // for(let i= 1; i < vertices.length; i++) {
                //     ctx.lineTo(vertices[i].x, vertices[i].y);
                // }
                // ctx.stroke();

            }
        }
  }

  /**
   * Edge cases: horizontal lines and vertical lines
   * Algorithm:
   * 1. take in a set of polygon vertices, number, and amp
   * 2. for each pair of vertices, generate random points between start and stop point.
   */
  ziggityzaggity(vertices:any[], n:number, amp:number) {
        let result = [];
        for(let i=0; i < vertices.length-1; i++){
            let res = this.generateNoisePoints(vertices[i], vertices[i+1], n, amp);

            for(let point of res)
                result.push(point);
               // console.log(result.length);
        }

        return result;
  }

  generateLine(ctx:any, map:any, GRIDSIZE:any) {
      let p = {x: 12, y: 5};
      let q = {x: 15, y: 9};
      ctx.save()
      ctx.scale(ctx.canvas.width/ GRIDSIZE, ctx.canvas.height / GRIDSIZE);
      ctx.lineWidth = 0.02;
      let vert = [];
      vert.push(p);
      vert.push(q);
      let res = this.ziggityzaggity(vert, 10, 1);
      console.log(res);
      ctx.beginPath();
      ctx.moveTo(res[0].x, res[0].y)
      
      for(let point of res) {
          ctx.lineTo(point.x, point.y);     
      }
      ctx.stroke();
      ctx.closePath();

    //   ctx.beginPath();
    //   for(let point of res) {
    //     ctx!.arc(point.x , point.y, 0.09, 0, 2*Math.PI);
    //     ctx.fill();
    //   }
    //   ctx.closePath();

  }
  generateNoisePoints(p:any, q:any, n:number, amp:number){
        let result:any[] = [];
        
        //generate the slope-intercept form
        let slope  = (q.y - p.y) / (q.x - p.x);
        let intercept = (q.y) - (slope*q.x);
        let max = Math.max(p.x, q.x);
        let min = Math.min(p.x, q.x);
        let dist = (max - min) / n;
        let curr = min;
        result.push(p);
        for(let i = 1; i < n; i++) {
            curr += dist;
            let x = curr;  
            let y = (slope*x + intercept);

            result.push({
                x: x,
                y: y + Math.random()
            });
        }

        result.push(q);
        console.log(result);
        return result;
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
     let canvasSetPromise = new Promise<any>((resolve, reject) => {
        this.setState({
            canvas: canvas
        });
        resolve(this.state);
     }); 
     

     canvasSetPromise.then((val:any) =>{
            this.renderMap();
     });

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
    let {centers, halfedges, numEdges} = map;
    let ctx = canvas.getContext('2d');
    ctx.save();
    ctx.scale(canvas.width / GRIDSIZE, canvas.height / GRIDSIZE);
    ctx.lineWidth = 0.05;
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
           // elevation[r] = noise.noise2D(nx / this.WAVELENGTH, ny / this.WAVELENGTH);
            elevation[r] = (1 + noise.noise2D(nx / this.WAVELENGTH, ny / this.WAVELENGTH )) / 2;
            let d = 1.8 * Math.max(Math.abs(nx), Math.abs(ny)); 
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


/**
 *                 let edges = this.state.centroidedges;
                if(edges != null){
                    ctx.save();
                    ctx.lineWidth = 0.02;
                    ctx.scale(ctx.canvas.width / GRIDSIZE, ctx.canvas.height / GRIDSIZE);
                   for(let i= 0; i < edges.length; i++){
                        let p, q;
                        if(edges[i].from.y > edges[i].to.y){
                            q = edges[i].from;
                            p = edges[i].to;
                        }
                        else{
                            p = edges[i].from;
                            q = edges[i].to;
                        }
                        let res = this.ziggityzaggity(p, q, 5, 0.1);
                        for(let point of res) {
                            ctx.beginPath();
                            ctx.moveTo(point.from.x, point.from.y );
                            ctx.lineTo(point.to.x, point.to.y );
                            ctx.stroke();
                        }
                        // ctx.beginPath();
                        // ctx.moveTo(edges[i].from.x, edges[i].from.y );
                        // ctx.lineTo(edges[i].to.x, edges[i].to.y );
                        // ctx.stroke();
                   }
                }

                
        
 */
/**
 *         let results:any = [];
        let points:any = [];
        if(Math.abs(q.x - p.x) <= 0 ) {
            let step = Math.abs(q.x - p.x) / n;
            let count = p.x;
            let prevcoord = 0;
            points.push(p);

            for(let i = 1; i < n; i++) {
                count += step;
                let xcoord = count;
                
                let ycoord = points[prevcoord].y + (Math.round(Math.random()) ? 1 : -1)*amp;
                let nedge:Edge = {
                    from: points[prevcoord],
                    to: {x: xcoord, y: ycoord}
                }
                results.push(nedge);
                points.push(nedge.to);
                prevcoord++;
            }

            let nedge:Edge = {
                from: points[prevcoord],
                to: q
            };
            results.push(nedge);
        }
        else if(q.y == p.y){

        }
        else{
            let step = Math.abs(q.y - p.y) / n;
            let count = p.y;
            points.push(p);
            let prevcoord = 0;
            for(let i = 1; i < n; i++) {
                let xcoord = points[prevcoord].x + (Math.round(Math.random()) ? 1 : -1)*amp;
                count += step;
                let ycoord = count;
                let nedge:Edge = {
                    from: points[prevcoord],
                    to: {x: xcoord, y: ycoord}
                }
                results.push(nedge);
                points.push(nedge.to);
                prevcoord++;
            }

            let nedge:Edge = {
                from: points[prevcoord],
                to: q
            };
            results.push(nedge);
        }

       // console.log(points);
        return results;
 */