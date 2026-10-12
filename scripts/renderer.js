import * as CG from './transforms.js';
import { Matrix } from './matrix.js';

class Renderer {
    // canvas:              object ({id: __, width: __, height: __})
    // limit_fps_flag:      bool 
    // fps:                 int
    constructor(canvas, limit_fps_flag, fps) {
        this.canvas = document.getElementById(canvas.id);
        this.canvas.width = canvas.width;
        this.canvas.height = canvas.height;
        this.ctx = this.canvas.getContext('2d');
        this.slide_idx = 0;
        this.limit_fps = limit_fps_flag;
        this.fps = fps;
        this.start_time = null;
        this.prev_time = null;

        this.models = {
            slide0: [

                {
                    vertices: [
                        CG.Vector3(400, 150, 1),
                        CG.Vector3(500, 300, 1),
                        CG.Vector3(400, 450, 1),
                        CG.Vector3(300, 300, 1)
                    ],
                    transform: null
                }
            ],
            slide1: [

                {
                    vertices: this.starVertices(12, 120, 95),
                    center: [400, 300],
                    rev_per_sec: 0.25,      // positive = counter-clockwise, negative = clockwise
                    color: [130, 130, 130, 255],
                    transform: new Matrix(3, 3)
                }
            ],
            slide2: [
                // big star: grows / shrinks uniformly
                {
                    vertices: this.starVertices(5, 110, 45),
                    center: [270, 320],
                    cycles_per_sec: 0.5,    // rate of grow / shrink
                    magnitude: [0.3, 0.3],  // scale goes from (1 - magnitude) to (1 + magnitude) in x and y
                    color: [255, 205, 60, 255],
                    transform: new Matrix(3, 3)
                },
                
                // sparkle: grows / shrinks non-uniformly (more in x than in y)
                {
                    vertices: this.starVertices(4, 70, 18),
                    center: [570, 320],
                    cycles_per_sec: 1.0,
                    magnitude: [0.7, 0.2],
                    color: [90, 170, 255, 255],
                    transform: new Matrix(3, 3)
                }
            ],
            slide3: []
        };
    }

    // star centered on (0, 0) with its first point straight up
    // num_points:    int
    // outer_radius:  float (center to tip)
    // inner_radius:  float (center to notch between tips)
    starVertices(num_points, outer_radius, inner_radius) {
        let vertices = [];
        for (let i = 0; i < num_points * 2; i++) {
            let radius = (i % 2 === 0) ? outer_radius : inner_radius;
            let angle = Math.PI / 2.0 + i * Math.PI / num_points;
            vertices.push(CG.Vector3(radius * Math.cos(angle), radius * Math.sin(angle), 1));
        }
        return vertices;
    }

    // flag:  bool
    limitFps(flag) {
        this.limit_fps = flag;
    }

    // n:  int
    setFps(n) {
        this.fps = n;
    }

    // idx: int
    setSlideIndex(idx) {
        this.slide_idx = idx;
    }

    animate(timestamp) {
        // Get time and delta time for animation
        if (this.start_time === null) {
            this.start_time = timestamp;
            this.prev_time = timestamp;
        }
        let time = timestamp - this.start_time;
        let delta_time = timestamp - this.prev_time;
        //console.log('animate(): t = ' + time.toFixed(1) + ', dt = ' + delta_time.toFixed(1));

        // Update transforms for animation
        this.updateTransforms(time, delta_time);

        // Draw slide
        this.drawSlide();

        // Invoke call for next frame in animation
        if (this.limit_fps) {
            setTimeout(() => {
                window.requestAnimationFrame((ts) => {
                    this.animate(ts);
                });
            }, Math.floor(1000.0 / this.fps));
        }
        else {
            window.requestAnimationFrame((ts) => {
                this.animate(ts);
            });
        }

        // Update previous time to current one for next calculation of delta time
        this.prev_time = timestamp;
    }

    //
    updateTransforms(time, delta_time) {
        // TODO: update any transformations needed for animation
        let seconds = time / 1000.0;
        let translate = new Matrix(3, 3);

        // slide 1: rotate about own center, then move to position
        let rotate = new Matrix(3, 3);
        for (let model of this.models.slide1) {
            let theta = model.rev_per_sec * 2.0 * Math.PI * seconds;
            CG.mat3x3Rotate(rotate, theta);
            CG.mat3x3Translate(translate, model.center[0], model.center[1]);
            model.transform = Matrix.multiply([translate, rotate]);
        }

        // slide 2: scale about own center, then move to position
        let scale = new Matrix(3, 3);
        for (let model of this.models.slide2) {
            let wave = Math.sin(model.cycles_per_sec * 2.0 * Math.PI * seconds);
            let sx = 1.0 + model.magnitude[0] * wave;
            let sy = 1.0 + model.magnitude[1] * wave;
            CG.mat3x3Scale(scale, sx, sy);
            CG.mat3x3Translate(translate, model.center[0], model.center[1]);
            model.transform = Matrix.multiply([translate, scale]);
        }
    }

    // draw every model in the list with its transform applied
    drawModels(models) {
        for (let model of models) {
            let vertices = model.vertices.map((vertex) => Matrix.multiply([model.transform, vertex]));
            this.drawConvexPolygon(vertices, model.color);
        }
    }
    
    //
    drawSlide() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        switch (this.slide_idx) {
            case 0:
                this.drawSlide0();
                break;
            case 1:
                this.drawSlide1();
                break;
            case 2:
                this.drawSlide2();
                break;
            case 3:
                this.drawSlide3();
                break;
        }
    }

    //
    drawSlide0() {
        // TODO: draw bouncing ball (circle that changes direction whenever it hits an edge)
        
        
        // Following lines are example of drawing a single polygon
        // (this should be removed/edited after you implement the slide)
        let teal = [238, 103, 48, 255];
        this.drawConvexPolygon(this.models.slide0[0].vertices, teal);
    }

    //
    drawSlide1() {
        // TODO: draw at least 3 polygons that spin about their own centers
        //   - have each polygon spin at a different speed / direction
        this.drawModels(this.models.slide1);
    }

    //
    drawSlide2() {
        // TODO: draw at least 2 polygons grow and shrink about their own centers
        //   - have each polygon grow / shrink different sizes
        //   - try at least 1 polygon that grows / shrinks non-uniformly in the x and y directions
        this.drawModels(this.models.slide2);
    }

    //
    drawSlide3() {
        // TODO: get creative!
        //   - animation should involve all three basic transformation types
        //     (translation, scaling, and rotation)
        
        
    }
    
    // vertex_list:  array of object [Matrix(3, 1), Matrix(3, 1), ..., Matrix(3, 1)]
    // color:        array of int [R, G, B, A]
    drawConvexPolygon(vertex_list, color) {
        this.ctx.fillStyle = 'rgba(' + color[0] + ',' + color[1] + ',' + color[2] + ',' + (color[3] / 255) + ')';
        this.ctx.beginPath();
        let x = vertex_list[0].values[0][0] / vertex_list[0].values[2][0];
        let y = vertex_list[0].values[1][0] / vertex_list[0].values[2][0];
        this.ctx.moveTo(x, y);
        for (let i = 1; i < vertex_list.length; i++) {
            x = vertex_list[i].values[0][0] / vertex_list[i].values[2][0];
            y = vertex_list[i].values[1][0] / vertex_list[i].values[2][0];
            this.ctx.lineTo(x, y);
        }
        this.ctx.closePath();
        this.ctx.fill();
    }
};

export { Renderer };
