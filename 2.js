// 2.js

"use strict";

// Vertex shader program
const VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +
    'attribute float a_select;\n' +
    'attribute vec4 a_normal;\n' +
    'attribute mat4 a_transformMatrix;\n' +
    'uniform mat4 u_mvpMatrix;\n' +
    'uniform bool u_useTransformMatrix;\n' +
    'uniform float u_pointSize;\n' +
    'uniform float u_pointSizeSelect;\n' +
    'uniform vec4 u_color;\n' +
    'uniform vec4 u_colorSelect;\n' +
    'varying vec4 v_color;\n' +
    'varying vec4 v_normal;\n' +
    'varying vec4 v_position;\n' +
    'void main() {\n' +
    '  if (u_useTransformMatrix)\n' +
    '    gl_Position = u_mvpMatrix * a_transformMatrix * a_Position;\n' +
    '  else\n' +
    '    gl_Position = u_mvpMatrix * a_Position;\n' +
    '  if (a_select != 0.0)\n' +
    '  {\n' +
    '    v_color = u_colorSelect;\n' +
    '    gl_PointSize = u_pointSizeSelect;\n' +
    '  }\n' +
    '  else\n' +
    '  {\n' +
    '    v_color = u_color;\n' +
    '    gl_PointSize = u_pointSize;\n' +
    '  }\n' +
    '  v_normal = a_normal;\n' +
    '  v_position = a_Position;\n' +
    '}\n';

// Fragment shader program
const FSHADER_SOURCE =
    'precision mediump float;\n' +
    'varying vec4 v_color;\n' +
    'varying vec4 v_normal;\n' +
    'varying vec4 v_position;\n' +
    'uniform bool u_drawPolygon;\n' +
    'uniform vec3 u_LightColor;\n' +     // Light color
    'uniform vec4 u_LightPosition;\n' + // Position of the light source (in the world coordinate system)
    'uniform vec3 u_AmbientLight;\n' +   // Color of an ambient light
    'uniform vec3 u_colorAmbient;\n' +
    'uniform vec3 u_colorSpec;\n' +
    'uniform float u_shininess;\n' +
    'void main() {\n' +
    '  if (u_drawPolygon) {\n' +
    // Make the length of the normal 1.0
    '    vec3 normal =  normalize(gl_FrontFacing ? v_normal.xyz : -v_normal.xyz);\n' +
    // Calculate the light direction and make it 1.0 in length
    '    vec3 lightDirection = normalize(vec3(u_LightPosition - v_position));\n' +
    // Dot product of the light direction and the orientation of a surface (the normal)
    '    float nDotL = max(dot(lightDirection, normal), 0.0);\n' +
    // Calculate the color due to diffuse reflection
    '    vec3 diffuse = u_LightColor * v_color.rgb * nDotL;\n' +
    // Calculate the color due to ambient reflection
    '    vec3 ambient = u_AmbientLight * u_colorAmbient;\n' +
    '    vec3 r = reflect( -lightDirection, normal );\n' +
    '    vec3 spec = vec3(0.0);\n' +
    '    if( nDotL > 0.0 )\n' +
    '      spec = u_LightColor * u_colorSpec *\n' +
    '             pow( max( dot(r,lightDirection), 0.0 ), u_shininess );\n' +
    '    \n' +
    // Add the surface colors due to diffuse reflection and ambient reflection
    '    gl_FragColor = vec4(spec + diffuse + ambient, v_color.a);\n' +
    '  } else {\n' +
    '    gl_FragColor = v_color;\n' +
    '  }\n' +
    '}\n';

function main() {
    // Retrieve <canvas> element
    const canvas = document.getElementById('webgl');

    // Get the rendering context for WebGL
    const gl = getWebGLContext(canvas);
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }
    
    // Initialize shaders
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to intialize shaders.');
        return;
    }

    const viewport = [0, 0, canvas.width, canvas.height];
    gl.viewport(viewport[0], viewport[1], viewport[2], viewport[3]);

    const Xmin = document.getElementById("Xmin");
    const Xmax = document.getElementById("Xmax");
    const Ymin = document.getElementById("Ymin");
    const Ymax = document.getElementById("Ymax");
    const Z = document.getElementById("Z");
    const N_ctr = document.getElementById("N_ctr");
    const M_ctr = document.getElementById("M_ctr");
    const N = document.getElementById("N");
    const M = document.getElementById("M");
    const alpha = document.getElementById("alpha");
    const uniform = document.getElementById("uniform");
    const chordal = document.getElementById("chordal");
    const centripetal = document.getElementById("centripetal");

    Data.init(gl, viewport, eval(Xmin.value), eval(Xmax.value), eval(Ymin.value), eval(Ymax.value), eval(Z.value),
        N_ctr, M_ctr, N, M, uniform, chordal, centripetal, alpha);

    canvas.onmousemove = function (ev) { mousemove(ev, canvas); };

    canvas.onmousedown = function (ev) { mousedown(ev, canvas); };

    canvas.onmouseup = function (ev) { mouseup(ev, canvas); };

    (function () {

        function handleMouseWheel(event) {
            event = EventUtil.getEvent(event);
            const delta = EventUtil.getWheelDelta(event);
            Data.mousewheel(delta);
            EventUtil.preventDefault(event);
        }

        EventUtil.addHandler(canvas, "mousewheel", handleMouseWheel);
        EventUtil.addHandler(document, "DOMMouseScroll", handleMouseWheel);

    })();

    const lineSurfaceSpline = document.getElementById("chkLineSurfaceSpline");
    const controlPolygon = document.getElementById("chkControlPolygon");
    const showControlPoints = document.getElementById("chkShowPoints");
    const visualizeSplineWithPoints = document.getElementById("chkVisualizeWithPoints");
    const visualizeSplineWithLines = document.getElementById("chkVisualizeWithLines");
    const visualizeSplineWithSurface = document.getElementById("chkVisualizeWithSurface");

    lineSurfaceSpline.onclick = function () { Data.plotMode(1); };
    visualizeSplineWithPoints.onclick = function () { Data.plotMode(4); };
    visualizeSplineWithLines.onclick = function () { Data.plotMode(5); };
    visualizeSplineWithSurface.onclick = function () { Data.plotMode(6); };
    showControlPoints.onclick = function () { Data.plotMode(7); };

    Xmin.onchange = function () {
        Data.setDependentGeomParameters(
            eval(Xmin.value), eval(Xmax.value), eval(Ymin.value), eval(Ymax.value), eval(Z.value));
        Data.generateControlPoints(N_ctr.value, M_ctr.value,
            eval(Xmin.value), eval(Xmax.value), eval(Ymin.value), eval(Ymax.value), eval(Z.value));
    };
    Xmax.onchange = function () {
        Data.setDependentGeomParameters(
            eval(Xmin.value), eval(Xmax.value), eval(Ymin.value), eval(Ymax.value), eval(Z.value));
        Data.generateControlPoints(N_ctr.value, M_ctr.value,
            eval(Xmin.value), eval(Xmax.value), eval(Ymin.value), eval(Ymax.value), eval(Z.value));
    };
    Ymin.onchange = function () {
        Data.setDependentGeomParameters(
            eval(Xmin.value), eval(Xmax.value), eval(Ymin.value), eval(Ymax.value), eval(Z.value));
        Data.generateControlPoints(N_ctr.value, M_ctr.value,
            eval(Xmin.value), eval(Xmax.value), eval(Ymin.value), eval(Ymax.value), eval(Z.value));
    };
    Ymax.onchange = function () {
        Data.setDependentGeomParameters(
            eval(Xmin.value), eval(Xmax.value), eval(Ymin.value), eval(Ymax.value), eval(Z.value));
        Data.generateControlPoints(N_ctr.value, M_ctr.value,
            eval(Xmin.value), eval(Xmax.value), eval(Ymin.value), eval(Ymax.value), eval(Z.value));
    };
    Z.onchange = function () {
        Data.setDependentGeomParameters(
            eval(Xmin.value), eval(Xmax.value), eval(Ymin.value), eval(Ymax.value), eval(Z.value));
        Data.generateControlPoints(N_ctr.value, M_ctr.value,
            eval(Xmin.value), eval(Xmax.value), eval(Ymin.value), eval(Ymax.value), eval(Z.value));
    };
    N_ctr.onchange = function () {
        Data.generateControlPoints(N_ctr.value, M_ctr.value,
            eval(Xmin.value), eval(Xmax.value), eval(Ymin.value), eval(Ymax.value), eval(Z.value));
    };
    M_ctr.onchange = function () {
        Data.generateControlPoints(N_ctr.value, M_ctr.value,
            eval(Xmin.value), eval(Xmax.value), eval(Ymin.value), eval(Ymax.value), eval(Z.value));
    };
    N.onchange = function () { Data.plotMode(2); };
    M.onchange = function () { Data.plotMode(2); };
    alpha.onchange = function () { Data.plotMode(0); };
    uniform.onclick = function () { Data.plotMode(2); };
    chordal.onclick = function () { Data.plotMode(2); };
    centripetal.onclick = function () { Data.plotMode(2); };
    controlPolygon.onclick = function () { Data.plotMode(3); };

    gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.DEPTH_TEST);

    // Specify the color for clearing <canvas>
    gl.clearColor(0.8, 0.8, 0.8, 1.0);

    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    Data.generateControlPoints(N_ctr.value, M_ctr.value,
        eval(Xmin.value), eval(Xmax.value), eval(Ymin.value), eval(Ymax.value), eval(Z.value));
}

function project(obj, mvpMatrix, viewport) {
    const win = vec4.transformMat4(vec4.create(), obj, mvpMatrix);

    if (win[3] == 0.0)
        return;

    win[0] /= win[3];
    win[1] /= win[3];
    win[2] /= win[3];

    win[0] = win[0] * 0.5 + 0.5;
    win[1] = win[1] * 0.5 + 0.5;
    win[2] = win[2] * 0.5 + 0.5;

    win[0] = viewport[0] + win[0] * viewport[2];
    win[1] = viewport[1] + win[1] * viewport[3];

    return win;
}

function unproject(win, modelView, projection, viewport) {

    const invertMV = mat4.invert(mat4.create(), modelView);
    const invertP = mat4.invert(mat4.create(), projection);

    const invertMVP = mat4.multiply(mat4.create(), invertMV, invertP);

    win[0] = (win[0] - viewport[0]) / viewport[2];
    win[1] = (win[1] - viewport[1]) / viewport[3];

    win[0] = win[0] * 2 - 1;
    win[1] = win[1] * 2 - 1;
    win[2] = win[2] * 2 - 1;

    const obj = vec4.transformMat4(vec4.create(), win, invertMVP);

    if (obj[3] == 0.0)
        return;

    obj[0] /= obj[3];
    obj[1] /= obj[3];
    obj[2] /= obj[3];

    return obj;
}

class Point {
    constructor(x, y, z) {
        this.select = false;
        // �������� ��������������� ���������� u � v
        this.u = 0;
        this.v = 0;
        this.x = x;
        this.y = y;
        this.z = z;
        this.transformMatrix = mat4.create();
        this.winx = 0.0;
        this.winz = 0.0;
        this.winy = 0.0;
        //this.setRect();
    }
    setPoint(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.setRect();
    }
    setRect() {
        this.left = this.winx - 10;
        this.right = this.winx + 10;
        this.bottom = this.winy - 10;
        this.up = this.winy + 10;
    }
    calculateWindowCoordinates(mvpMatrix, viewport) {
        const worldCoord = vec4.fromValues(this.x, this.y, this.z, 1.0);

        //------------Get window coordinates of point-----------
        const winCoord = project(worldCoord, mvpMatrix, viewport);
        winCoord[1] = (winCoord[1]); // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

        this.winx = winCoord[0];
        this.winy = winCoord[1];
        this.winz = winCoord[2];

        this.setRect();//create a bounding rectangle around point
    }
    ptInRect(x, y) {
        const inX = this.left <= x && x <= this.right;
        const inY = this.bottom <= y && y <= this.up;
        return inX && inY;
    }
    setTransformMatrix(T) {
        this.transformMatrix = T;
    }
}

const Camera = {
    //cartesian coordinates
    x0: 0.0,
    y0: 0.0,
    z0: 0.0,
    //spherical coordinates
    r: 0.0,
    theta: 0.0,
    phi: 0.0,
    //initial spherical coordinates
    r_0: 0.0,
    theta_0: 0.0,
    phi_0: 0.0,
    //point the viewer is looking at
    x_ref: 0.0,
    y_ref: 0.0,
    z_ref: 0.0,
    //up vector
    Vx: 0.0,
    Vy: 0.0,
    Vz: 0.0,
    //view volume bounds
    xw_min: 0.0,
    xw_max: 0.0,
    yw_min: 0.0,
    yw_max: 0.0,
    d_near: 0.0,
    d_far: 0.0,
    convertFromCartesianToSpherical: function () {
        const R = this.r + this.r_0;
        const Theta = this.theta + this.theta_0;
        const Phi = this.phi + this.phi_0;

        this.convertFromCartesianToSphericalCoordinates(R, Theta, Phi);

        this.Vx = -R * Math.cos(Theta) * Math.cos(Phi);
        this.Vy = -R * Math.cos(Theta) * Math.sin(Phi);
        this.Vz = R * Math.sin(Theta);

        this.xw_min = -R;
        this.xw_max = R;
        this.yw_min = -R;
        this.yw_max = R;
        this.d_near = 0.0;
        this.d_far = 2 * R;
    },
    convertFromCartesianToSphericalCoordinates: function (r, theta, phi) {
        this.x0 = r * Math.sin(theta) * Math.cos(phi);
        this.y0 = r * Math.sin(theta) * Math.sin(phi);
        this.z0 = r * Math.cos(theta);
    },
    normalizeAngle: function (angle) {
        let lAngle = angle;
        while (lAngle < 0)
            lAngle += 360 * 16;
        while (lAngle > 360 * 16)
            lAngle -= 360 * 16;

        return lAngle;
    },
    getLookAt: function (r, theta, phi) {
        this.r = r;
        this.phi = glMatrix.toRadian(phi / 16.0);
        this.theta = glMatrix.toRadian(theta / 16.0);
        this.convertFromCartesianToSpherical();

        return mat4.lookAt(mat4.create(),
            [Camera.x0, Camera.y0, Camera.z0],
            [Camera.x_ref, Camera.y_ref, Camera.z_ref],
            [Camera.Vx, Camera.Vy, Camera.Vz]);
    },
    getProjMatrix: function () {
        return mat4.ortho(mat4.create(),
            this.xw_min, this.xw_max, this.yw_min, this.yw_max, this.d_near, this.d_far);
    },
    getAxesPoints: function () {
    		return [0.5 * this.xw_min, 0, 0,
    						this.xw_max, 0, 0,
    						0, 0.5 * this.yw_min, 0,
    						0, this.yw_max, 0,
    						0, 0, -0.5 * (this.d_far - this.d_near) / 2.0,
    						0, 0,  (this.d_far - this.d_near) / 2.0];
    },
    getAxesTipLength: function () {
    		return 0.2 * (this.d_far - this.d_near);

    }
}

const Data = {
    pointsCtr: [],
    m10PointsCtr: [],
    m01PointsCtr: [],
    m11PointsCtr: [],
    m10Ctr: [],
    m01Ctr: [],
    m11Ctr: [],
    pointsVector10Ctr: [],
    pointsVector01Ctr: [],
    pointsVector11Ctr: [],
    //pointsVector10TipCtr: [],
    //pointsVector01TipCtr: [],
    //pointsVector11TipCtr: [],
    pointsSpline: [],
    indicesCtr: [],
    indicesAxesTip: [],
    indicesVector10TipCtr: [],
    indicesVector01TipCtr: [],
    indicesVector11TipCtr: [],
    pointsSpline: [],
    indicesSplineLines: [],
    indicesSplineSurface: [],
    normalsSpline: [],
    countAttribData: 3 + 1 + 16, //x,y,z,sel
    verticesAxes: {},
    verticesCtr: {},
    verticesVector10Ctr: {},
    verticesVector01Ctr: {},
    verticesVector11Ctr: {},
    verticesVector10TipCtr: {},
    verticesVector01TipCtr: {},
    verticesVector11TipCtr: {},
    verticesSpline: {},
    FSIZE: 0,
    ISIZE: 0,
    gl: null,
    vertexBufferAxes: null,
    vertexBufferAxesTip: null,
    indexBufferAxesTip: null,
    vertexBufferCtr: null,
    indexBufferCtr: null,
    vertexBufferVector10Ctr: null,
    vertexBufferVector01Ctr: null,
    vertexBufferVector11Ctr: null,
    vertexBufferVector10TipCtr: null,
    vertexBufferVector01TipCtr: null,
    vertexBufferVector11TipCtr: null,
    vertexBufferSpline: null,
    indexBufferVector10TipCtr: null,
    indexBufferVector01TipCtr: null,
    indexBufferVector11TipCtr: null,
    indexBufferSplineLines: null,
    indexBufferSplineSurface: null,
    verticesAxesTip: {},
    a_Position: -1,
    a_select: -1,
    a_normal: -1,
    a_transformMatrix: -1,
    u_color: null,
    u_colorSelect: null,
    u_pointSize: null,
    u_pointSizeSelect: null,
    u_drawPolygon: false,
    u_useTransformMatrix: false,
    u_mvpMatrix: null,
    u_LightColor: null,
    u_LightPosition: null,
    u_AmbientLight: null,
    u_colorAmbient: null,
    u_colorSpec: null,
    u_shininess: null,
    movePoint: false,
    moveVector10: false,
    moveVector01: false,
    moveVector11: false,
    iMove: -1,
    jMove: -1,
    OldPt: null,
    OldPtm10: null,
    OldPtm01: null,
    OldPtm11: null,
    tPt: null,
    leftButtonDown: false,
    drawControlPolygon: false,
    showControlPoints: true,
    visualizeSplineWithPoints: true,
    visualizeSplineWithLines: false,
    visualizeSplineWithSurface: false,
    uniform: null,
    chordal: null,
    centripetal: null,
    N_ctr: null,
    M_ctr: null,
    N: null,
    M: null,
    alpha: null,
    Xmid: 0.0,
    Ymid: 0.0,
    //DX: 0.0,
    xRot: 0,
    yRot: 0,
    wheelDelta: 0.0,
    proj: mat4.create(),
    cam: mat4.create(),
    world: mat4.create(),
    viewport: [],
    lastPosX: 0,
    lastPosY: 0,
    nLongitudes: 0,
    nLatitudes: 0,
    lengthVector: 0.0,
    heighTip: 0.0,
    init: function (gl, viewport, Xmin, Xmax, Ymin, Ymax, Z, N_ctr, M_ctr, N, M, uniform, chordal, centripetal, alpha) {
        this.gl = gl;
        this.verticesAxes = new Float32Array(18); // 6 points * 3 coordinates
        
        // Create a buffer object
        this.vertexBufferAxes = this.gl.createBuffer();
        if (!this.vertexBufferAxes) {
            console.log('Failed to create the buffer object for axes');
            return -1;
        }
        
        this.vertexBufferAxesTip = this.gl.createBuffer();
        if (!this.vertexBufferAxesTip) {
            console.log('Failed to create the buffer object for axes tips');
            return -1;
        }
        // Create a buffer object
        this.vertexBufferCtr = this.gl.createBuffer();
        if (!this.vertexBufferCtr) {
            console.log('Failed to create the buffer object for control points');
            return -1;
        }

        this.vertexBufferVector10Ctr = this.gl.createBuffer();
        if (!this.vertexBufferVector10Ctr) {
            console.log('Failed to create the buffer object for vector 10');
            return -1;
        }

        this.vertexBufferVector01Ctr = this.gl.createBuffer();
        if (!this.vertexBufferVector01Ctr) {
            console.log('Failed to create the buffer object for vector 01');
            return -1;
        }

        this.vertexBufferVector11Ctr = this.gl.createBuffer();
        if (!this.vertexBufferVector11Ctr) {
            console.log('Failed to create the buffer object for vector 11');
            return -1;
        }

        this.vertexBufferVector10TipCtr = this.gl.createBuffer();
        if (!this.vertexBufferVector10TipCtr) {
            console.log('Failed to create the buffer object for vector 10 tips');
            return -1;
        }

        this.vertexBufferVector01TipCtr = this.gl.createBuffer();
        if (!this.vertexBufferVector01TipCtr) {
            console.log('Failed to create the buffer object for vector 01 tips');
            return -1;
        }

        this.vertexBufferVector11TipCtr = this.gl.createBuffer();
        if (!this.vertexBufferVector11TipCtr) {
            console.log('Failed to create the buffer object for vector 11 tips');
            return -1;
        }

        this.vertexBufferSpline = this.gl.createBuffer();
        if (!this.vertexBufferSpline) {
            console.log('Failed to create the buffer object for spline points');
            return -1;
        }
        
                this.indexBufferAxesTip = this.gl.createBuffer();
        if (!this.indexBufferAxesTip) {
            console.log('Failed to create the index object for axes tips');
            return -1;
        }

        this.indexBufferCtr = this.gl.createBuffer();
        if (!this.indexBufferCtr) {
            console.log('Failed to create the index object for control points');
            return -1;
        }

        this.indexBufferVector10TipCtr = this.gl.createBuffer();
        if (!this.indexBufferVector10TipCtr) {
            console.log('Failed to create the index object for vector 10 tips');
            return -1;
        }

        this.indexBufferVector01TipCtr = this.gl.createBuffer();
        if (!this.indexBufferVector01TipCtr) {
            console.log('Failed to create the index object for vector 01 tips');
            return -1;
        }

        this.indexBufferVector11TipCtr = this.gl.createBuffer();
        if (!this.indexBufferVector11TipCtr) {
            console.log('Failed to create the index object for vector 11 tips');
            return -1;
        }

        this.indexBufferSplineLines = this.gl.createBuffer();
        if (!this.indexBufferSplineLines) {
            console.log('Failed to create the index object for spline lines');
            return -1;
        }

        this.indexBufferSplineSurface = this.gl.createBuffer();
        if (!this.indexBufferSplineSurface) {
            console.log('Failed to create the index object for spline surface');
            return -1;
        }

        this.a_Position = this.gl.getAttribLocation(this.gl.program, 'a_Position');
        if (this.a_Position < 0) {
            console.log('Failed to get the storage location of a_Position');
            return -1;
        }

        this.a_select = this.gl.getAttribLocation(this.gl.program, 'a_select');
        if (this.a_select < 0) {
            console.log('Failed to get the storage location of a_select');
            return -1;
        }

        this.a_normal = this.gl.getAttribLocation(this.gl.program, 'a_normal');
        if (this.a_normal < 0) {
            console.log('Failed to get the storage location of a_normal');
            return -1;
        }

        this.a_transformMatrix = this.gl.getAttribLocation(this.gl.program, 'a_transformMatrix');
        if (this.a_transformMatrix < 0) {
            console.log('Failed to get the storage location of a_transformMatrix');
            return -1;
        }

        // Get the storage location of u_color
        this.u_color = this.gl.getUniformLocation(this.gl.program, 'u_color');
        if (!this.u_color) {
            console.log('Failed to get u_color variable');
            return;
        }

        // Get the storage location of u_colorSelect
        this.u_colorSelect = gl.getUniformLocation(this.gl.program, 'u_colorSelect');
        if (!this.u_colorSelect) {
            console.log('Failed to get u_colorSelect variable');
            return;
        }

        // Get the storage location of u_pointSize
        this.u_pointSize = gl.getUniformLocation(this.gl.program, 'u_pointSize');
        if (!this.u_pointSize) {
            console.log('Failed to get u_pointSize variable');
            return;
        }

        // Get the storage location of u_pointSize
        this.u_pointSizeSelect = gl.getUniformLocation(this.gl.program, 'u_pointSizeSelect');
        if (!this.u_pointSizeSelect) {
            console.log('Failed to get u_pointSizeSelect variable');
            return;
        }

        // Get the storage location of u_useTransformMatrix
        this.u_useTransformMatrix = this.gl.getUniformLocation(this.gl.program, 'u_useTransformMatrix');
        if (!this.u_useTransformMatrix) {
            console.log('Failed to get u_useTransformMatrix variable');
            return;
        }

        // Get the storage location of u_drawPolygon
        this.u_drawPolygon = this.gl.getUniformLocation(this.gl.program, 'u_drawPolygon');
        if (!this.u_drawPolygon) {
            console.log('Failed to get u_drawPolygon variable');
            return;
        }

        // Get the storage location of u_LightColor
        this.u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
        if (!this.u_LightColor) {
            console.log('Failed to get u_LightColor variable');
            return;
        }

        // Get the storage location of u_LightPosition
        this.u_LightPosition = gl.getUniformLocation(gl.program, 'u_LightPosition');
        if (!this.u_LightPosition) {
            console.log('Failed to get u_LightPosition variable');
            return;
        }

        // Get the storage location of u_AmbientLight
        this.u_AmbientLight = gl.getUniformLocation(gl.program, 'u_AmbientLight');
        if (!this.u_AmbientLight) {
            console.log('Failed to get u_AmbientLight variable');
            return;
        }

        // Get the storage location of u_colorAmbient
        this.u_colorAmbient = gl.getUniformLocation(gl.program, 'u_colorAmbient');
        if (!this.u_colorAmbient) {
            console.log('Failed to get u_colorAmbient variable');
            return;
        }

        // Get the storage location of u_colorSpec
        this.u_colorSpec = gl.getUniformLocation(gl.program, 'u_colorSpec');
        if (!this.u_colorSpec) {
            console.log('Failed to get u_colorSpec variable');
            return;
        }

        // Get the storage location of u_shininess
        this.u_shininess = gl.getUniformLocation(gl.program, 'u_shininess');
        if (!this.u_shininess) {
            console.log('Failed to get u_shininess variable');
            return;
        }

        this.u_mvpMatrix = gl.getUniformLocation(gl.program, 'u_mvpMatrix');
        if (!this.u_mvpMatrix) {
            console.log('Failed to get the storage location of u_mvpMatrix');
            return;
        }

        this.gl.uniform3f(this.u_LightColor, 1.0, 1.0, 1.0);
        // Set the ambient light
        this.gl.uniform3f(this.u_AmbientLight, 0.2, 0.2, 0.2);
        // Set the material ambient color
        this.gl.uniform3f(this.u_colorSpec, 0.2313, 0.2313, 0.2313);
        // Set the material specular color
        this.gl.uniform3f(this.u_colorSpec, 0.7739, 0.7739, 0.7739);
        // Set the material shininess
        this.gl.uniform1f(this.u_shininess, 90);

        this.viewport = viewport;

        this.N_ctr = N_ctr;
        this.M_ctr = M_ctr;
        this.N = N;
        this.M = M;
        this.uniform = uniform;
        this.chordal = chordal;
        this.centripetal = centripetal;
        this.alpha = alpha;

        this.lengthVector = 1.5;
        this.heighTip = 0.4 * this.lengthVector;

        this.setDependentGeomParameters(Xmin, Xmax, Ymin, Ymax, Z);

        this.OldPt = new Point(0, 0);
        this.OldPtm10 = new Point(0, 0);
        this.OldPtm01 = new Point(0, 0);
        this.OldPtm11 = new Point(0, 0);
        this.tPt = new Point(0, 0);
    },
    setDependentGeomParameters: function (Xmin, Xmax, Ymin, Ymax, Z) {
        this.Xmid = Xmin + (Xmax - Xmin) / 2.0;
        this.Ymid = Ymin + (Ymax - Ymin) / 2.0;

        Camera.r_0 = Math.sqrt(Math.pow((Xmax - Xmin) / 2.0 + this.lengthVector, 2) +
            Math.pow((Ymax - Ymin) / 2.0 + this.lengthVector, 2) +
            Math.pow(Z + this.lengthVector, 2));

        this.resetCamera(false);
    },
    generateControlPoints: function (n, m, Xmin, Xmax, Ymin, Ymax, Z) {
        let i, j;
        let x, y, z;
        let pt;
        let vec;

        this.pointsCtr = new Array(n);
        this.m10Ctr = new Array(n);
        this.m01Ctr = new Array(n);
        this.m11Ctr = new Array(n);
        this.m10PointsCtr = new Array(n);
        this.m01PointsCtr = new Array(n);
        this.m11PointsCtr = new Array(n);
        this.pointsVector10Ctr = new Array(n);
        this.pointsVector01Ctr = new Array(n);
        this.pointsVector11Ctr = new Array(n);
        for (i = 0; i < n; i++) {
            this.pointsCtr[i] = new Array(m);
            this.m10Ctr[i] = new Array(m);
            this.m01Ctr[i] = new Array(m);
            this.m11Ctr[i] = new Array(m);
            this.m10PointsCtr[i] = new Array(m);
            this.m01PointsCtr[i] = new Array(m);
            this.m11PointsCtr[i] = new Array(m);
            this.pointsVector10Ctr[i] = new Array(m);
            this.pointsVector01Ctr[i] = new Array(m);
            this.pointsVector11Ctr[i] = new Array(m);
            for (j = 0; j < m; j++) {
                this.pointsVector10Ctr[i][j] = new Array(2);
                this.pointsVector01Ctr[i][j] = new Array(2);
                this.pointsVector11Ctr[i][j] = new Array(2);
            }
        }

        this.create_coord_tip("10", this.heighTip, n, m);
        this.create_coord_tip("01", this.heighTip, n, m);
        this.create_coord_tip("11", this.heighTip, n, m);

        this.create_indexes_tip("10", n, m);
        this.create_indexes_tip("01", n, m);
        this.create_indexes_tip("11", n, m);

        for (i = 0; i < n; i++)
            for (j = 0; j < m; j++) {
                x = Xmin + i * (Xmax - Xmin) / (n - 1) - this.Xmid;
                y = Ymin + j * (Ymax - Ymin) / (m - 1) - this.Ymid;
                z = Z * Math.sin(x) * Math.sin(y);

                this.add_coords(i, j, x, y, z);
            }

        for (i = 0; i < n; i++)
            for (j = 0; j < m; j++) {

                x = 0.0;
                y = 0.0;
                z = 0.0;

                if (i == n - 1) {
                    x = this.pointsCtr[i][j].x - this.pointsCtr[i - 1][j].x;
                    y = this.pointsCtr[i][j].y - this.pointsCtr[i - 1][j].y;
                    z = this.pointsCtr[i][j].z - this.pointsCtr[i - 1][j].z;
                }
                if (i == 0) {
                    x = this.pointsCtr[i + 1][j].x - this.pointsCtr[i][j].x;
                    y = this.pointsCtr[i + 1][j].y - this.pointsCtr[i][j].y;
                    z = this.pointsCtr[i + 1][j].z - this.pointsCtr[i][j].z;
                }

                vec = vec3.normalize(vec3.create(), vec3.fromValues(x, y, z));
                vec = vec3.scale(vec, vec, this.lengthVector);

                pt = new Point(vec[0], vec[1], vec[2]);

                this.m10Ctr[i][j] = pt;

                x = 0.0;
                y = 0.0;
                z = 0.0;

                if (j == m - 1) {
                    x = this.pointsCtr[i][j].x - this.pointsCtr[i][j - 1].x;
                    y = this.pointsCtr[i][j].y - this.pointsCtr[i][j - 1].y;
                    z = this.pointsCtr[i][j].z - this.pointsCtr[i][j - 1].z;
                }
                if (j == 0) {
                    x = this.pointsCtr[i][j + 1].x - this.pointsCtr[i][j].x;
                    y = this.pointsCtr[i][j + 1].y - this.pointsCtr[i][j].y;
                    z = this.pointsCtr[i][j + 1].z - this.pointsCtr[i][j].z;
                }

                vec = vec3.normalize(vec3.create(), vec3.fromValues(x, y, z));
                vec = vec3.scale(vec, vec, this.lengthVector);

                pt = new Point(vec[0], vec[1], vec[2]);

                this.m01Ctr[i][j] = pt;
            }

        for (i = 0; i < n; i++)
            for (j = 0; j < m; j++) {

                x = 0.0;
                y = 0.0;
                z = 0.0;

                if ((j == m - 1) && ((i == 0) || (i == n - 1))) {
                    x = this.m10Ctr[i][j].x - this.m10Ctr[i][j - 1].x;
                    y = this.m10Ctr[i][j].y - this.m10Ctr[i][j - 1].y;
                    z = this.m10Ctr[i][j].z - this.m10Ctr[i][j - 1].z;
                }
                if ((j == 0) && ((i == 0) || (i == n - 1))) {
                    x = this.m10Ctr[i][j + 1].x - this.m10Ctr[i][j].x;
                    y = this.m10Ctr[i][j + 1].y - this.m10Ctr[i][j].y;
                    z = this.m10Ctr[i][j + 1].z - this.m10Ctr[i][j].z;
                }

                vec = vec3.normalize(vec3.create(), vec3.fromValues(x, y, z));
                vec = vec3.scale(vec, vec, this.lengthVector);

                pt = new Point(vec[0], vec[1], vec[2]);

                this.m11Ctr[i][j] = pt;


                x = this.pointsCtr[i][j].x + this.m10Ctr[i][j].x;
                y = this.pointsCtr[i][j].y + this.m10Ctr[i][j].y;
                z = this.pointsCtr[i][j].z + this.m10Ctr[i][j].z;
                pt = new Point(x, y, z);
                this.m10PointsCtr[i][j] = pt;

                x = this.pointsCtr[i][j].x + this.m01Ctr[i][j].x;
                y = this.pointsCtr[i][j].y + this.m01Ctr[i][j].y;
                z = this.pointsCtr[i][j].z + this.m01Ctr[i][j].z;
                pt = new Point(x, y, z);
                this.m01PointsCtr[i][j] = pt;

                x = this.pointsCtr[i][j].x + this.m11Ctr[i][j].x;
                y = this.pointsCtr[i][j].y + this.m11Ctr[i][j].y;
                z = this.pointsCtr[i][j].z + this.m11Ctr[i][j].z;
                pt = new Point(x, y, z);
                this.m11PointsCtr[i][j] = pt;

                this.setVector(this.pointsCtr[i][j].x, this.pointsCtr[i][j].y, this.pointsCtr[i][j].z,
                    this.m10PointsCtr[i][j].x, this.m10PointsCtr[i][j].y, this.m10PointsCtr[i][j].z,
                    "10", true, i, j);
                this.setVector(this.pointsCtr[i][j].x, this.pointsCtr[i][j].y, this.pointsCtr[i][j].z,
                    this.m01PointsCtr[i][j].x, this.m01PointsCtr[i][j].y, this.m01PointsCtr[i][j].z,
                    "01", true, i, j);
                this.setVector(this.pointsCtr[i][j].x, this.pointsCtr[i][j].y, this.pointsCtr[i][j].z,
                    this.m11PointsCtr[i][j].x, this.m11PointsCtr[i][j].y, this.m11PointsCtr[i][j].z,
                    "11", true, i, j);


                //            m_data_vector10_ctr.add_coord(QVector3D(PtCtr[i][j].x, PtCtr[i][j].y, PtCtr[i][j].z));
                //            m_data_vector10_ctr.add_coord(QVector3D(Ptm10Ctr[i][j].x, Ptm10Ctr[i][j].y, Ptm10Ctr[i][j].z));

                //            m_data_vector01_ctr.add_coord(QVector3D(PtCtr[i][j].x, PtCtr[i][j].y, PtCtr[i][j].z));
                //            m_data_vector01_ctr.add_coord(QVector3D(Ptm01Ctr[i][j].x, Ptm01Ctr[i][j].y, Ptm01Ctr[i][j].z));

                //            m_data_vector11_ctr.add_coord(QVector3D(PtCtr[i][j].x, PtCtr[i][j].y, PtCtr[i][j].z));
                //            m_data_vector11_ctr.add_coord(QVector3D(Ptm11Ctr[i][j].x, Ptm11Ctr[i][j].y, Ptm11Ctr[i][j].z));

                //            m_data_ctr.add_coord(QVector3D(PtCtr[i][j].x, PtCtr[i][j].y, PtCtr[i][j].z));
            }

        this.add_vertices(n, m);
        this.FSIZE = this.verticesCtr.BYTES_PER_ELEMENT;

        this.createIndicesCtr(n, m);
        this.ISIZE = this.indicesCtr.BYTES_PER_ELEMENT;

        if (this.drawNaturalCubeSurfaceSpline)
            this.calculateNaturalCubeSurfaceSpline();

        this.setVertexBuffersAndDraw();
    },
    resetCamera: function (resetAngles) {
    	if (resetAngles) {
        this.xRot = 0;
        this.yRot = 0;
      }
        this.wheelDelta = 0.0;
    },
    setLeftButtonDown: function (value) {
        this.leftButtonDown = value;
    },
    add_coords: function (i, j, x, y, z) {
        const pt = new Point(x, y, z);
        this.pointsCtr[i][j] = pt;
    },
    setAxes: function () {
    		this.verticesAxes.set(Camera.getAxesPoints());
    },
    create_coord_tip: function (orient, height, n, m) {
        let r, phi, x, y, z;
        let i, j, k, p, q;
        let countParametersOneTip;
        let m_count;
        let verticesVectorTipCtr;

        let pt;

        const rTop = 0;
        const rBase = 0.25 * height;
        this.nLongitudes = 36;
        this.nLatitudes = 2;

        countParametersOneTip = this.nLatitudes * this.nLongitudes * this.countAttribData;

        m_count = n * m * countParametersOneTip;

        //pointsVectorTipCtr = new Array(n);
        //for (p = 0; p < n; p++) {
        //    pointsVectorTipCtr[p] = new Array(m);
        //    for (q = 0; q < m; q++) {
        //        pointsVectorTipCtr[p][q] = new Array(this.nLatitudes);
        //        for (i = 0; i < nLatitudes; i++)
        //            pointsVectorTipCtr[p][q][i] = new Array(this.nLongitudes);
        //    }
        //}

        switch (orient) {
            case "10":
                this.verticesVector10TipCtr = new Float32Array(m_count);
                verticesVectorTipCtr = this.verticesVector10TipCtr;
                break;
            case "01":
                this.verticesVector01TipCtr = new Float32Array(m_count);
                verticesVectorTipCtr = this.verticesVector01TipCtr;
                break;
            case "11":
                this.verticesVector11TipCtr = new Float32Array(m_count);
                verticesVectorTipCtr = this.verticesVector11TipCtr;
                break;
            case "axes":
                this.verticesAxesTip = new Float32Array(m_count);
                verticesVectorTipCtr = this.verticesAxesTip;
                break;
        }

        k = 0;
        for (p = 0; p < n; p++)
            for (q = 0; q < m; q++)
                for (i = 0; i < this.nLatitudes; i++)
                    for (j = 0; j < this.nLongitudes; j++) {
                        r = rBase + (rTop - rBase) / (this.nLatitudes - 1) * i;
                        phi = 2 * Math.PI / this.nLongitudes * j;

                        if (((orient == "10") && ((p == 0) || (p == n - 1))) ||
                            ((orient == "01") && ((q == 0) || (q == m - 1))) ||
                            ((orient == "11") &&
                                (((p == 0) || (p == n - 1)) && ((q == 0) || (q == m - 1)))) ||
                            ((orient == "axes") && ((p == 0) && (q == 0)))
                                ) {
                            x = r * Math.cos(phi);
                            y = r * Math.sin(phi);
                            z = height / (this.nLatitudes - 1) * i - height;
                        }
                        else {
                            x = 0.0;
                            y = 0.0;
                            z = 0.0;
                        }

                        //pt = new Point(x, y, z);
                        //pointsVectorTipCtr[p][q][i][j] = pt;

                        //console.log("p = ", p, "  q = ", q, "  i = ", i, "  j = ", j, "  x = ", x, "  y = ", y, "  z = ", z);

                        verticesVectorTipCtr[k++] = x;
                        verticesVectorTipCtr[k++] = y;
                        verticesVectorTipCtr[k++] = z;
                        verticesVectorTipCtr[k++] = false;
                        verticesVectorTipCtr[k++] = 1.0;
                        verticesVectorTipCtr[k++] = 0.0;
                        verticesVectorTipCtr[k++] = 0.0;
                        verticesVectorTipCtr[k++] = 0.0;
                        verticesVectorTipCtr[k++] = 0.0;
                        verticesVectorTipCtr[k++] = 1.0;
                        verticesVectorTipCtr[k++] = 0.0;
                        verticesVectorTipCtr[k++] = 0.0;
                        verticesVectorTipCtr[k++] = 0.0;
                        verticesVectorTipCtr[k++] = 0.0;
                        verticesVectorTipCtr[k++] = 1.0;
                        verticesVectorTipCtr[k++] = 0.0;
                        verticesVectorTipCtr[k++] = 0.0;
                        verticesVectorTipCtr[k++] = 0.0;
                        verticesVectorTipCtr[k++] = 0.0;
                        verticesVectorTipCtr[k++] = 1.0;
                    }
    },
    create_indexes_tip: function (orient, n, m) {
        let i, j, k, p, q;
        let countIndicesOneTip, countPointsOneTip, disp;
        let m_countTipIndices;
        let indicesVectorCtr;

        countIndicesOneTip = (this.nLatitudes - 1) * this.nLongitudes * 2 * 3;
        countPointsOneTip = this.nLatitudes * this.nLongitudes;
        m_countTipIndices = n * m * countIndicesOneTip;

        switch (orient) {
            case "10":
                this.indicesVector10TipCtr = new Uint16Array(m_countTipIndices);
                indicesVectorCtr = this.indicesVector10TipCtr;
                break;
            case "01":
                this.indicesVector01TipCtr = new Uint16Array(m_countTipIndices);
                indicesVectorCtr = this.indicesVector01TipCtr;
                break;
            case "11":
                this.indicesVector11TipCtr = new Uint16Array(m_countTipIndices);
                indicesVectorCtr = this.indicesVector11TipCtr;
                break;
            case "axes":
                this.indicesAxesTip = new Uint16Array(m_countTipIndices);
                indicesVectorCtr = this.indicesAxesTip;
                break;
        }

        k = 0;
        for (p = 0; p < n; p++)
            for (q = 0; q < m; q++) {
                disp = (p * m + q) * countPointsOneTip;
                for (i = 0; i < this.nLatitudes - 1; i++)
                    for (j = 0; j < this.nLongitudes; j++) {
                        if (j != this.nLongitudes - 1) {
                            indicesVectorCtr[k++] = disp + this.nLongitudes * i + j;
                            indicesVectorCtr[k++] = disp + this.nLongitudes * i + j + 1;
                            indicesVectorCtr[k++] = disp + this.nLongitudes * (i + 1) + j + 1;

                            indicesVectorCtr[k++] = disp + this.nLongitudes * (i + 1) + j + 1;
                            indicesVectorCtr[k++] = disp + this.nLongitudes * (i + 1) + j;
                            indicesVectorCtr[k++] = disp + this.nLongitudes * i + j;
                        }
                        else {
                            indicesVectorCtr[k++] = disp + this.nLongitudes * i + j;
                            indicesVectorCtr[k++] = disp + this.nLongitudes * i;
                            indicesVectorCtr[k++] = disp + this.nLongitudes * (i + 1);

                            indicesVectorCtr[k++] = disp + this.nLongitudes * (i + 1);
                            indicesVectorCtr[k++] = disp + this.nLongitudes * (i + 1) + j;
                            indicesVectorCtr[k++] = disp + this.nLongitudes * i + j;
                        }
                    }
            }
    },
    setVector: function (x1, y1, z1, x2, y2, z2, orient, create, i, j) {
        let pt;
        let ptm;

        //let rBase;
        //let length;

        //let ux, uy, vx, vy, norm;

        let pointsVectorCtr;
        //let pointsVectorTipCtr;
        let verticesVectorTipCtr;

        const number = i * this.M_ctr.value + j;

        switch (orient) {
            case "10":
                pointsVectorCtr = this.pointsVector10Ctr;
                //pointsVectorTipCtr = this.pointsVector10TipCtr;
                verticesVectorTipCtr = this.verticesVector10TipCtr;
                break;
            case "01":
                pointsVectorCtr = this.pointsVector01Ctr;
                //pointsVectorTipCtr = this.pointsVector01TipCtr;
                verticesVectorTipCtr = this.verticesVector01TipCtr;
                break;
            case "11":
                pointsVectorCtr = this.pointsVector11Ctr;
                //pointsVectorTipCtr = this.pointsVector11TipCtr;
                verticesVectorTipCtr = this.verticesVector11TipCtr;
                break;
        }

        if (create) //create mode
        {
            pt = new Point(x1, y1, z1);
            ptm = new Point(x2, y2, z2);

            //console.log("i = ", i, "  j = ", j);
            pointsVectorCtr[i][j][0] = pt;
            pointsVectorCtr[i][j][1] = ptm;
        }
        else //update mode
        {
            pointsVectorCtr[i][j][0].setPoint(x1, y1, z1);
            pointsVectorCtr[i][j][1].setPoint(x2, y2, z2);
        }

        const vec = vec3.normalize(vec3.create(), vec3.fromValues(x2 - x1, y2 - y1, z2 - z1));
        const q = quat.rotationTo(quat.create(), [0.0, 0.0, 1.0], vec);
        const rotateMatrix = mat4.fromQuat(mat4.create(), q);

        const translateMatrix = mat4.fromTranslation(mat4.create(), vec3.fromValues(x2, y2, z2));

        const transformMatrix = mat4.mul(mat4.create(), translateMatrix, rotateMatrix);

        this.setTransformMatrix(verticesVectorTipCtr, transformMatrix, number);

        if (!create) //update mode
            this.updateVerticesVectorCtr(orient, i, j)
    },
    setSelectVector: function (orient, select, i, j) {
        let pointsVectorCtr;

        switch (orient) {
            case "10":
                pointsVectorCtr = this.pointsVector10Ctr;
                break;
            case "01":
                pointsVectorCtr = this.pointsVector01Ctr;
                break;
            case "11":
                pointsVectorCtr = this.pointsVector11Ctr;
                break;
        }

        pointsVectorCtr[i][j][0].select = select;
        pointsVectorCtr[i][j][1].select = select;
        //this.pointsVectorTipCtr[3 * i].select = select;
        //this.pointsVectorTipCtr[3 * i + 1].select = select;
        //this.pointsVectorTipCtr[3 * i + 2].select = select;

        this.updateVerticesVectorCtr(orient, i, j);
    },
    updateVerticesVectorCtr: function (orient, i, j) {
        let pointsVectorCtr;
        let verticesVectorCtr;
        let verticesVectorTipCtr;

        switch (orient) {
            case "10":
                pointsVectorCtr = this.pointsVector10Ctr;
                verticesVectorCtr = this.verticesVector10Ctr;
                verticesVectorTipCtr = this.verticesVector10TipCtr;
                break;
            case "01":
                pointsVectorCtr = this.pointsVector01Ctr;
                verticesVectorCtr = this.verticesVector01Ctr;
                verticesVectorTipCtr = this.verticesVector01TipCtr;
                break;
            case "11":
                pointsVectorCtr = this.pointsVector11Ctr;
                verticesVectorCtr = this.verticesVector11Ctr;
                verticesVectorTipCtr = this.verticesVector11TipCtr;
                break;
        }

        const number = i * this.M_ctr.value + j;

        verticesVectorCtr[2 * number * this.countAttribData] = pointsVectorCtr[i][j][0].x;
        verticesVectorCtr[2 * number * this.countAttribData + 1] = pointsVectorCtr[i][j][0].y;
        verticesVectorCtr[2 * number * this.countAttribData + 2] = pointsVectorCtr[i][j][0].z;
        verticesVectorCtr[2 * number * this.countAttribData + 3] = pointsVectorCtr[i][j][0].select;
        verticesVectorCtr[(2 * number + 1) * this.countAttribData] = pointsVectorCtr[i][j][1].x;
        verticesVectorCtr[(2 * number + 1) * this.countAttribData + 1] = pointsVectorCtr[i][j][1].y;
        verticesVectorCtr[(2 * number + 1) * this.countAttribData + 2] = pointsVectorCtr[i][j][1].z;
        verticesVectorCtr[(2 * number + 1) * this.countAttribData + 3] = pointsVectorCtr[i][j][1].select;

        const countParametersOneTip = this.nLatitudes * this.nLongitudes * this.countAttribData;
        const disp = number * countParametersOneTip;

        for (let l = 0; l < this.nLatitudes; l++)
            for (let k = 0; k < this.nLongitudes; k++)
                verticesVectorTipCtr[disp + (l * this.nLongitudes + k) * this.countAttribData + 3] = pointsVectorCtr[i][j][1].select;
    },
    setTransformMatrix: function (verticesVectorTip, transformMatrix, i) {
        const countParametersOneTip = this.nLatitudes * this.nLongitudes * this.countAttribData;
        const disp = i * countParametersOneTip;

        for (let j = 0; j < this.nLatitudes; j++)
            for (let k = 0; k < this.nLongitudes; k++)
                for (let l = 0; l < 16; l++) {
                    verticesVectorTip[disp + (j * this.nLongitudes + k) * this.countAttribData + 4 + l] = transformMatrix[l];
                }
    },
    createIndicesCtr: function (n, m) {
        let i, j, k = 0;
        this.indicesCtr = new Uint16Array(2 * n * m);

        for (i = 0; i < n; i++)
            for (j = 0; j < m; j++)
                this.indicesCtr[k++] = i * m + j;
        for (j = 0; j < m; j++)
            for (i = 0; i < n; i++)
                this.indicesCtr[k++] = i * m + j;
    },
    createIndicesSplineLines: function (n, m) {
        let i, j, k = 0;
        this.indicesSplineLines = new Uint16Array(2 * n * m);

        for (i = 0; i < n; i++) {
            for (j = 0; j < m; j++)
                this.indicesSplineLines[k++] = i * m + j;
        }
        for (j = 0; j < m; j++) {
            for (i = 0; i < n; i++)
                this.indicesSplineLines[k++] = i * m + j;
        }
    },
    createIndicesSplineSurface: function (n, m) {
        let k = 0;
        this.indicesSplineSurface = new Uint16Array(6 * (n - 1) * (m - 1));

        for (let i = 0; i < n - 1; i++)
            for (let j = 0; j < m - 1; j++) {
                this.indicesSplineSurface[k++] = i * m + j;
                this.indicesSplineSurface[k++] = (i + 1) * m + j;
                this.indicesSplineSurface[k++] = i * m + j + 1;
                this.indicesSplineSurface[k++] = i * m + j + 1;
                this.indicesSplineSurface[k++] = (i + 1) * m + j;
                this.indicesSplineSurface[k++] = (i + 1) * m + j + 1;
            }
    },
    setXRotation: function (angle) {
        const lAngle = Camera.normalizeAngle(angle);
        if (lAngle != this.xRot) {
            this.xRot = lAngle;
        }
    },
    setYRotation: function (angle) {
        const lAngle = Camera.normalizeAngle(angle);
        if (lAngle != this.yRot) {
            this.yRot = lAngle;
        }
    },
    mousemoveHandler: function (x, y) {
        if (this.leftButtonDown) {
            if (this.movePoint || this.moveVector10 || this.moveVector01 || this.moveVector11) {

                const offset = this.iMove * this.M_ctr.value + this.jMove;

                const winCoord = vec4.create();

                winCoord[0] = x;
                winCoord[1] = y;
                if (this.movePoint)
                    winCoord[2] = this.pointsCtr[this.iMove][this.jMove].winz;
                if (this.moveVector10)
                    winCoord[2] = this.m10PointsCtr[this.iMove][this.jMove].winz;
                if (this.moveVector01)
                    winCoord[2] = this.m01PointsCtr[this.iMove][this.jMove].winz;
                if (this.moveVector11)
                    winCoord[2] = this.m11PointsCtr[this.iMove][this.jMove].winz;
                winCoord[3] = 1.0;

                const mvMatr = mat4.mul(mat4.create(), this.cam, this.world);

                const worldCoord = unproject(winCoord, mvMatr, this.proj, this.viewport);

                if (this.movePoint) {
                    this.pointsCtr[this.iMove][this.jMove].x = worldCoord[0];
                    this.pointsCtr[this.iMove][this.jMove].y = worldCoord[1];
                    this.pointsCtr[this.iMove][this.jMove].z = worldCoord[2];

                    this.verticesCtr[offset * 4] = this.pointsCtr[this.iMove][this.jMove].x;
                    this.verticesCtr[offset * 4 + 1] = this.pointsCtr[this.iMove][this.jMove].y;
                    this.verticesCtr[offset * 4 + 2] = this.pointsCtr[this.iMove][this.jMove].z;

                    this.tPt.x = this.pointsCtr[this.iMove][this.jMove].x - this.OldPt.x;
                    this.tPt.y = this.pointsCtr[this.iMove][this.jMove].y - this.OldPt.y;
                    this.tPt.z = this.pointsCtr[this.iMove][this.jMove].z - this.OldPt.z;

                    this.m10PointsCtr[this.iMove][this.jMove].x = this.OldPtm10.x + this.tPt.x;
                    this.m10PointsCtr[this.iMove][this.jMove].y = this.OldPtm10.y + this.tPt.y;
                    this.m10PointsCtr[this.iMove][this.jMove].z = this.OldPtm10.z + this.tPt.z;

                    this.m01PointsCtr[this.iMove][this.jMove].x = this.OldPtm01.x + this.tPt.x;
                    this.m01PointsCtr[this.iMove][this.jMove].y = this.OldPtm01.y + this.tPt.y;
                    this.m01PointsCtr[this.iMove][this.jMove].z = this.OldPtm01.z + this.tPt.z;

                    this.m11PointsCtr[this.iMove][this.jMove].x = this.OldPtm11.x + this.tPt.x;
                    this.m11PointsCtr[this.iMove][this.jMove].y = this.OldPtm11.y + this.tPt.y;
                    this.m11PointsCtr[this.iMove][this.jMove].z = this.OldPtm11.z + this.tPt.z;

                    this.setVector(this.pointsCtr[this.iMove][this.jMove].x,
                        this.pointsCtr[this.iMove][this.jMove].y,
                        this.pointsCtr[this.iMove][this.jMove].z,
                        this.m10PointsCtr[this.iMove][this.jMove].x,
                        this.m10PointsCtr[this.iMove][this.jMove].y,
                        this.m10PointsCtr[this.iMove][this.jMove].z, "10", false,
                        this.iMove, this.jMove);

                    this.setVector(this.pointsCtr[this.iMove][this.jMove].x,
                        this.pointsCtr[this.iMove][this.jMove].y,
                        this.pointsCtr[this.iMove][this.jMove].z,
                        this.m01PointsCtr[this.iMove][this.jMove].x,
                        this.m01PointsCtr[this.iMove][this.jMove].y,
                        this.m01PointsCtr[this.iMove][this.jMove].z, "01", false,
                        this.iMove, this.jMove);

                    this.setVector(this.pointsCtr[this.iMove][this.jMove].x,
                        this.pointsCtr[this.iMove][this.jMove].y,
                        this.pointsCtr[this.iMove][this.jMove].z,
                        this.m11PointsCtr[this.iMove][this.jMove].x,
                        this.m11PointsCtr[this.iMove][this.jMove].y,
                        this.m11PointsCtr[this.iMove][this.jMove].z, "11", false,
                        this.iMove, this.jMove);
                }
                else if (this.moveVector10) {
                    this.m10PointsCtr[this.iMove][this.jMove].x = worldCoord[0];
                    this.m10PointsCtr[this.iMove][this.jMove].y = worldCoord[1];
                    this.m10PointsCtr[this.iMove][this.jMove].z = worldCoord[2];

                    this.setVector(this.pointsCtr[this.iMove][this.jMove].x,
                        this.pointsCtr[this.iMove][this.jMove].y,
                        this.pointsCtr[this.iMove][this.jMove].z,
                        this.m10PointsCtr[this.iMove][this.jMove].x,
                        this.m10PointsCtr[this.iMove][this.jMove].y,
                        this.m10PointsCtr[this.iMove][this.jMove].z, "10", false,
                        this.iMove, this.jMove);
                }
                else if (this.moveVector01) {
                    this.m01PointsCtr[this.iMove][this.jMove].x = worldCoord[0];
                    this.m01PointsCtr[this.iMove][this.jMove].y = worldCoord[1];
                    this.m01PointsCtr[this.iMove][this.jMove].z = worldCoord[2];

                    this.setVector(this.pointsCtr[this.iMove][this.jMove].x,
                        this.pointsCtr[this.iMove][this.jMove].y,
                        this.pointsCtr[this.iMove][this.jMove].z,
                        this.m01PointsCtr[this.iMove][this.jMove].x,
                        this.m01PointsCtr[this.iMove][this.jMove].y,
                        this.m01PointsCtr[this.iMove][this.jMove].z, "01", false,
                        this.iMove, this.jMove);
                }
                else if (this.moveVector11) {
                    this.m11PointsCtr[this.iMove][this.jMove].x = worldCoord[0];
                    this.m11PointsCtr[this.iMove][this.jMove].y = worldCoord[1];
                    this.m11PointsCtr[this.iMove][this.jMove].z = worldCoord[2];

                    this.setVector(this.pointsCtr[this.iMove][this.jMove].x,
                        this.pointsCtr[this.iMove][this.jMove].y,
                        this.pointsCtr[this.iMove][this.jMove].z,
                        this.m11PointsCtr[this.iMove][this.jMove].x,
                        this.m11PointsCtr[this.iMove][this.jMove].y,
                        this.m11PointsCtr[this.iMove][this.jMove].z, "11", false,
                        this.iMove, this.jMove);
                }

                if (this.drawNaturalCubeSurfaceSpline)
                    this.calculateNaturalCubeSurfaceSpline();
            }
            else {
                const dx = x - this.lastPosX;
                const dy = y - this.lastPosY;

                this.setXRotation(this.xRot - 8 * dy);
                this.setYRotation(this.yRot + 8 * dx);

                this.lastPosX = x;
                this.lastPosY = y;
            }
            this.setVertexBuffersAndDraw();
        }
        else
            for (let i = 0; i < this.N_ctr.value; i++)
                for (let j = 0; j < this.M_ctr.value; j++) {
                    this.pointsCtr[i][j].select = false;

                    if (this.pointsCtr[i][j].ptInRect(x, y))
                        this.pointsCtr[i][j].select = true;

                    this.verticesCtr[(i * this.M_ctr.value + j) * 4 + 3] = this.pointsCtr[i][j].select;

                    this.m10PointsCtr[i][j].select = false;
                    if (((i == 0) || (i == this.N_ctr.value - 1)) && (this.m10PointsCtr[i][j].ptInRect(x, y)))
                        this.m10PointsCtr[i][j].select = true;

                    this.m01PointsCtr[i][j].select = false;
                    if (((j == 0) || (j == this.M_ctr.value - 1)) && (this.m01PointsCtr[i][j].ptInRect(x, y)))
                        this.m01PointsCtr[i][j].select = true;

                    this.m11PointsCtr[i][j].select = false;
                    if ((((i == 0) || (i == this.N_ctr.value - 1)) && ((j == 0) || (j == this.M_ctr.value - 1))) &&
                        (this.m11PointsCtr[i][j].ptInRect(x, y)))
                        this.m11PointsCtr[i][j].select = true;

                    this.setSelectVector("10", this.m10PointsCtr[i][j].select, i, j)
                    this.setSelectVector("01", this.m01PointsCtr[i][j].select, i, j)
                    this.setSelectVector("11", this.m11PointsCtr[i][j].select, i, j)

                    this.setVertexBuffersAndDraw();
                }
    },
    mousedownHandler: function (button, x, y) {
        switch (button) {
            case 0: //left button
                this.movePoint = false;
                this.moveVector10 = false;
                this.moveVector01 = false;
                this.moveVector11 = false;

                for (let i = 0; i < this.N_ctr.value; i++)
                    for (let j = 0; j < this.M_ctr.value; j++) {
                        if (this.pointsCtr[i][j].select == true) {
                            this.movePoint = true;
                            this.iMove = i;
                            this.jMove = j;

                            this.OldPt.setPoint(this.pointsCtr[i][j].x, this.pointsCtr[i][j].y, this.pointsCtr[i][j].z);
                            this.OldPtm10.setPoint(this.m10PointsCtr[i][j].x, this.m10PointsCtr[i][j].y, this.m10PointsCtr[i][j].z);
                            this.OldPtm01.setPoint(this.m01PointsCtr[i][j].x, this.m01PointsCtr[i][j].y, this.m01PointsCtr[i][j].z);
                            this.OldPtm11.setPoint(this.m11PointsCtr[i][j].x, this.m11PointsCtr[i][j].y, this.m11PointsCtr[i][j].z);
                        }
                        if (this.m10PointsCtr[i][j].select == true) {
                            this.moveVector10 = true;
                            this.iMove = i;
                            this.jMove = j;
                        }
                        if (this.m01PointsCtr[i][j].select == true) {
                            this.moveVector01 = true;
                            this.iMove = i;
                            this.jMove = j;
                        }
                        if (this.m11PointsCtr[i][j].select == true) {
                            this.moveVector11 = true;
                            this.iMove = i;
                            this.jMove = j;
                        }
                    }

                if (!this.movePoint && !this.moveVector10 && !this.moveVector01 && !this.moveVector11) {
                    this.lastPosX = x;
                    this.lastPosY = y;
                }

                this.setLeftButtonDown(true);
                break;
            case 2: //right button
                this.resetCamera(true);
                this.setVertexBuffersAndDraw();
                break;
        }
    },
    mouseupHandler: function (button, x, y) {
        if (button == 0) //left button
            this.setLeftButtonDown(false);
    },
    mousewheel: function (delta) {
        const d = Camera.r_0 * (-1.) * delta / 1000.0;
        if ((this.wheelDelta + d >= -Camera.r_0) && (this.wheelDelta + d <= Camera.r_0 * 3.0))
            this.wheelDelta += d;

        this.setVertexBuffersAndDraw();
    },
    add_vertices: function (n, m) {

        const totalLength = n * m;

        this.verticesCtr = new Float32Array(totalLength * 4);
        this.verticesVector10Ctr = new Float32Array(2 * totalLength * this.countAttribData);
        this.verticesVector01Ctr = new Float32Array(2 * totalLength * this.countAttribData);
        this.verticesVector11Ctr = new Float32Array(2 * totalLength * this.countAttribData);
        for (let i = 0; i < n; i++)
            for (let j = 0; j < m; j++) {
                const offset = i * m + j;
                this.verticesCtr[offset * 4] = this.pointsCtr[i][j].x;
                this.verticesCtr[offset * 4 + 1] = this.pointsCtr[i][j].y;
                this.verticesCtr[offset * 4 + 2] = this.pointsCtr[i][j].z;
                this.verticesCtr[offset * 4 + 3] = this.pointsCtr[i][j].select;
                for (let k = 0; k < 16; k++) {
                    //    this.verticesCtr[(i * m + j) * this.countAttribData + 4 + k] = this.pointsCtr[i][j].transformMatrix[k];

                    //console.log("i = ", i, "  j = ", j);
                    this.verticesVector10Ctr[2 * offset * this.countAttribData + 4 + k] = this.pointsVector10Ctr[i][j][0].transformMatrix[k];
                    this.verticesVector10Ctr[(2 * offset + 1) * this.countAttribData + 4 + k] = this.pointsVector10Ctr[i][j][1].transformMatrix[k];

                    this.verticesVector01Ctr[2 * offset * this.countAttribData + 4 + k] = this.pointsVector01Ctr[i][j][0].transformMatrix[k];
                    this.verticesVector01Ctr[(2 * offset + 1) * this.countAttribData + 4 + k] = this.pointsVector01Ctr[i][j][1].transformMatrix[k];

                    this.verticesVector11Ctr[2 * offset * this.countAttribData + 4 + k] = this.pointsVector11Ctr[i][j][0].transformMatrix[k];
                    this.verticesVector11Ctr[(2 * offset + 1) * this.countAttribData + 4 + k] = this.pointsVector11Ctr[i][j][1].transformMatrix[k];
                }

                this.updateVerticesVectorCtr("10", i, j);
                this.updateVerticesVectorCtr("01", i, j);
                this.updateVerticesVectorCtr("11", i, j);
            }
    },
    setVertexBuffersAndDraw: function () {
        let i, j;
        let q, rotateMatrix, translateMatrix, transformMatrix, axesTransformMatrix;

        this.cam = Camera.getLookAt(this.wheelDelta, this.xRot, this.yRot);
        this.proj = Camera.getProjMatrix();
        
        this.gl.uniform4f(this.u_LightPosition, Camera.x0, Camera.y0, Camera.z0, 1.0);

        this.gl.uniform1f(this.u_useTransformMatrix, false);
        this.gl.uniform1f(this.u_drawPolygon, false);
        
        // Clear <canvas>
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        
        this.setAxes();
        this.create_coord_tip("axes", Camera.getAxesTipLength(), 1, 1);
        this.create_indexes_tip("axes", 1, 1);

        // Bind the buffer object to target
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBufferAxes);
        // Write date into the buffer object
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this.verticesAxes, this.gl.DYNAMIC_DRAW);
        // Assign the buffer object to a_Position variable
        this.gl.vertexAttribPointer(this.a_Position, 3, this.gl.FLOAT, false, 0, 0);
        // Enable the assignment to a_Position variable
        this.gl.enableVertexAttribArray(this.a_Position);
        // Disable the assignment to a_select variable
        this.gl.disableVertexAttribArray(this.a_select);
        // Disable the assignment to a_normal variable
        this.gl.disableVertexAttribArray(this.a_normal);
        this.gl.disableVertexAttribArray(this.a_transformMatrix);
        this.gl.disableVertexAttribArray(this.a_transformMatrix + 1);
        this.gl.disableVertexAttribArray(this.a_transformMatrix + 2);
        this.gl.disableVertexAttribArray(this.a_transformMatrix + 3);
        
        const axes_scale = 0.1;
        const half_axes_scale_length = 1.5 * (this.verticesAxes[17] - this.verticesAxes[14]) * axes_scale / 2;
        const scaleMatrix = mat4.fromScaling(mat4.create(), [axes_scale, axes_scale, axes_scale]);
        translateMatrix = mat4.fromTranslation(mat4.create(), vec3.fromValues(this.verticesAxes[3] - half_axes_scale_length, //x_max - half_axes_scale_length
        																																			-this.verticesAxes[10] + half_axes_scale_length, //-y_max + half_axes_scale_length
        																																			this.verticesAxes[17] - half_axes_scale_length)); //z_max - half_axes_scale_length
		    transformMatrix = mat4.mul(mat4.create(), scaleMatrix, this.world);
		    transformMatrix = mat4.mul(mat4.create(), this.cam, transformMatrix);
		    transformMatrix = mat4.mul(mat4.create(), translateMatrix, transformMatrix);
		    transformMatrix = mat4.mul(mat4.create(), this.proj, transformMatrix);
		    this.gl.uniformMatrix4fv(this.u_mvpMatrix, false, transformMatrix);

        // Draw
        this.gl.uniform4f(this.u_color, 1.0, 0.0, 0.0, 1.0);
        this.gl.drawArrays(this.gl.LINES, 0, 2);
        this.gl.uniform4f(this.u_color, 0.0, 1.0, 0.0, 1.0);
        this.gl.drawArrays(this.gl.LINES, 2, 2);
        this.gl.uniform4f(this.u_color, 0.0, 0.0, 1.0, 1.0);
        this.gl.drawArrays(this.gl.LINES, 4, 2);

        const countTipIndices = (this.nLatitudes - 1) * this.nLongitudes * 2 * 3;
        // Bind the buffer object to target
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBufferAxesTip);
        // Write date into the buffer object
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this.verticesAxesTip, this.gl.DYNAMIC_DRAW);
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBufferAxesTip);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, this.indicesAxesTip, this.gl.DYNAMIC_DRAW);
        // Assign the buffer object to a_Position variable
        this.gl.vertexAttribPointer(this.a_Position, 3, this.gl.FLOAT, false, this.FSIZE * this.countAttribData, 0);
        // Enable the assignment to a_Position variable
        this.gl.enableVertexAttribArray(this.a_Position);
        // Disable the assignment to a_select variable
        this.gl.disableVertexAttribArray(this.a_select);
        // Disable the assignment to a_normal variable
        this.gl.disableVertexAttribArray(this.a_normal);
        this.gl.disableVertexAttribArray(this.a_transformMatrix);
        this.gl.disableVertexAttribArray(this.a_transformMatrix + 1);
        this.gl.disableVertexAttribArray(this.a_transformMatrix + 2);
        this.gl.disableVertexAttribArray(this.a_transformMatrix + 3);
        this.gl.uniform4f(this.u_color, 0.0, 0.0, 0.0, 1.0);

				for (i=0; i<3; i++) {
						switch (i) {
						case 0:
        				q = quat.rotationTo(quat.create(), [0.0, 0.0, 1.0], [1.0, 0.0, 0.0]);
		        		translateMatrix = mat4.fromTranslation(mat4.create(), vec3.fromValues(this.verticesAxes[3], this.verticesAxes[4], this.verticesAxes[5])); //x_max
								break;
						case 1:
        				q = quat.rotationTo(quat.create(), [0.0, 0.0, 1.0], [0.0, 1.0, 0.0]);
		        		translateMatrix = mat4.fromTranslation(mat4.create(), vec3.fromValues(this.verticesAxes[9], this.verticesAxes[10], this.verticesAxes[11])); //y_max
								break;
						case 2:
        				q = quat.rotationTo(quat.create(), [0.0, 0.0, 1.0], [0.0, 0.0, 1.0]);
		        		translateMatrix = mat4.fromTranslation(mat4.create(), vec3.fromValues(this.verticesAxes[15], this.verticesAxes[16], this.verticesAxes[17])); //z_max
								break;
						}
		        rotateMatrix = mat4.fromQuat(mat4.create(), q);
		        axesTransformMatrix = mat4.mul(mat4.create(), translateMatrix, rotateMatrix);
		        axesTransformMatrix = mat4.mul(mat4.create(), transformMatrix, axesTransformMatrix);
		        this.gl.uniformMatrix4fv(this.u_mvpMatrix, false, axesTransformMatrix);
		        this.gl.drawElements(this.gl.TRIANGLES, countTipIndices, this.gl.UNSIGNED_SHORT, 0);

        }
        
        const mvMatr = mat4.mul(mat4.create(), this.cam, this.world);
        const mvpMatr = mat4.mul(mat4.create(), this.proj, mvMatr);
        this.gl.uniformMatrix4fv(this.u_mvpMatrix, false, mvpMatr);

        // Bind the buffer object to target
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBufferCtr);
        // Write date into the buffer object
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this.verticesCtr, this.gl.DYNAMIC_DRAW);
        // Assign the buffer object to a_Position variable
        this.gl.vertexAttribPointer(this.a_Position, 3, this.gl.FLOAT, false, this.FSIZE * 4, 0);
        // Enable the assignment to a_Position variable
        this.gl.enableVertexAttribArray(this.a_Position);
        // Assign the buffer object to a_select variable
        this.gl.vertexAttribPointer(this.a_select, 1, this.gl.FLOAT, false, this.FSIZE * 4, this.FSIZE * 3);
        // Enable the assignment to a_select variable
        this.gl.enableVertexAttribArray(this.a_select);
        // Disable the assignment to a_normal variable
        this.gl.disableVertexAttribArray(this.a_normal);
        //// Assign the buffer object to a_transformMatrix variable
        //this.gl.vertexAttribPointer(this.a_transformMatrix, 4, this.gl.FLOAT, false, this.FSIZE * this.countAttribData, this.FSIZE * 4);
        //this.gl.vertexAttribPointer(this.a_transformMatrix + 1, 4, this.gl.FLOAT, false, this.FSIZE * this.countAttribData, this.FSIZE * (4 + 4));
        //this.gl.vertexAttribPointer(this.a_transformMatrix + 2, 4, this.gl.FLOAT, false, this.FSIZE * this.countAttribData, this.FSIZE * (8 + 4));
        //this.gl.vertexAttribPointer(this.a_transformMatrix + 3, 4, this.gl.FLOAT, false, this.FSIZE * this.countAttribData, this.FSIZE * (12 + 4));
        // Disable the assignment to a_transformMatrix variable
        this.gl.disableVertexAttribArray(this.a_transformMatrix);
        this.gl.disableVertexAttribArray(this.a_transformMatrix + 1);
        this.gl.disableVertexAttribArray(this.a_transformMatrix + 2);
        this.gl.disableVertexAttribArray(this.a_transformMatrix + 3);
        
        this.gl.uniform4f(this.u_color, 0.0, 0.0, 0.0, 1.0);
        this.gl.uniform4f(this.u_colorSelect, 0.5, 0.5, 0.0, 1.0);
        this.gl.uniform1f(this.u_pointSize, 3.0);
        this.gl.uniform1f(this.u_pointSizeSelect, 7.0);

        for (i = 0; i < this.N_ctr.value; i++)
            for (j = 0; j < this.M_ctr.value; j++) {
                this.pointsCtr[i][j].calculateWindowCoordinates(mvpMatr, this.viewport);
                if ((i == 0) || (i == this.N_ctr.value - 1))
                    this.m10PointsCtr[i][j].calculateWindowCoordinates(mvpMatr, this.viewport);
                if ((j == 0) || (j == this.M_ctr.value - 1))
                    this.m01PointsCtr[i][j].calculateWindowCoordinates(mvpMatr, this.viewport);
                if (((i == 0) || (i == this.N_ctr.value - 1)) && ((j == 0) || (j == this.M_ctr.value - 1)))
                    this.m11PointsCtr[i][j].calculateWindowCoordinates(mvpMatr, this.viewport);
            }

        // Draw
        if (this.showControlPoints)
        		this.gl.drawArrays(this.gl.POINTS, 0, this.N_ctr.value * this.M_ctr.value);
        if (this.drawControlPolygon) {
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBufferCtr);
            this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, this.indicesCtr, this.gl.DYNAMIC_DRAW);

            this.gl.uniform4f(this.u_color, 0.0, 1.0, 0.0, 1.0);
            this.gl.uniform4f(this.u_colorSelect, 0.0, 1.0, 0.0, 1.0);

            for (i = 0; i < this.N_ctr.value; i++)
                this.gl.drawElements(this.gl.LINE_STRIP, this.M_ctr.value, this.gl.UNSIGNED_SHORT, ((i * this.M_ctr.value) * this.ISIZE));

            this.gl.uniform4f(this.u_color, 0.0, 0.0, 1.0, 1.0);
            this.gl.uniform4f(this.u_colorSelect, 0.0, 0.0, 1.0, 1.0);

            for (j = 0; j < this.M_ctr.value; j++) {
                this.gl.drawElements(this.gl.LINE_STRIP, this.N_ctr.value, this.gl.UNSIGNED_SHORT, ((this.N_ctr.value * this.M_ctr.value + j * this.N_ctr.value) * this.ISIZE));
            }
        }

        this.gl.uniform1f(this.u_useTransformMatrix, true);
        for (i = 0; i < 3; i++) {
            switch (i) {
                case 0:
                    // Bind the buffer object to target
                    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBufferVector10Ctr);
                    // Write date into the buffer object
                    this.gl.bufferData(this.gl.ARRAY_BUFFER, this.verticesVector10Ctr, this.gl.DYNAMIC_DRAW);
                    this.gl.uniform4f(this.u_color, 1.0, 0.0, 1.0, 1.0);
                    break;
                case 1:
                    // Bind the buffer object to target
                    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBufferVector01Ctr);
                    // Write date into the buffer object
                    this.gl.bufferData(this.gl.ARRAY_BUFFER, this.verticesVector01Ctr, this.gl.DYNAMIC_DRAW);
                    this.gl.uniform4f(this.u_color, 0.0, 1.0, 1.0, 1.0);
                    break;
                case 2:
                    // Bind the buffer object to target
                    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBufferVector11Ctr);
                    // Write date into the buffer object
                    this.gl.bufferData(this.gl.ARRAY_BUFFER, this.verticesVector11Ctr, this.gl.DYNAMIC_DRAW);
                    this.gl.uniform4f(this.u_color, 0.5, 0.5, 0.5, 1.0);
                    break;
            }
            // Assign the buffer object to a_Position variable
            this.gl.vertexAttribPointer(this.a_Position, 3, this.gl.FLOAT, false, this.FSIZE * this.countAttribData, 0);
            // Enable the assignment to a_Position variable
            this.gl.enableVertexAttribArray(this.a_Position);
            // Assign the buffer object to a_select variable
            this.gl.vertexAttribPointer(this.a_select, 1, this.gl.FLOAT, false, this.FSIZE * this.countAttribData, this.FSIZE * 3);
            // Enable the assignment to a_select variable
            this.gl.enableVertexAttribArray(this.a_select);
            // Disable the assignment to a_normal variable
            this.gl.disableVertexAttribArray(this.a_normal);
            // Assign the buffer object to a_transformMatrix variable
            this.gl.vertexAttribPointer(this.a_transformMatrix, 4, this.gl.FLOAT, false, this.FSIZE * this.countAttribData, this.FSIZE * 4);
            this.gl.vertexAttribPointer(this.a_transformMatrix + 1, 4, this.gl.FLOAT, false, this.FSIZE * this.countAttribData, this.FSIZE * (4 + 4));
            this.gl.vertexAttribPointer(this.a_transformMatrix + 2, 4, this.gl.FLOAT, false, this.FSIZE * this.countAttribData, this.FSIZE * (8 + 4));
            this.gl.vertexAttribPointer(this.a_transformMatrix + 3, 4, this.gl.FLOAT, false, this.FSIZE * this.countAttribData, this.FSIZE * (12 + 4));
            // Enable the assignment to a_transformMatrix variable
            this.gl.enableVertexAttribArray(this.a_transformMatrix);
            this.gl.enableVertexAttribArray(this.a_transformMatrix + 1);
            this.gl.enableVertexAttribArray(this.a_transformMatrix + 2);
            this.gl.enableVertexAttribArray(this.a_transformMatrix + 3);

            this.gl.uniform4f(this.u_colorSelect, 0.5, 0.5, 0.0, 1.0);

            this.gl.drawArrays(this.gl.LINES, 0, 2 * this.N_ctr.value * this.M_ctr.value);
        }

        const countIndicesOneTip = (this.nLatitudes - 1) * this.nLongitudes * 2 * 3;
        for (i = 0; i < 3; i++) {
            switch (i) {
                case 0:
                    // Bind the buffer object to target
                    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBufferVector10TipCtr);
                    // Write date into the buffer object
                    this.gl.bufferData(this.gl.ARRAY_BUFFER, this.verticesVector10TipCtr, this.gl.DYNAMIC_DRAW);
                    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBufferVector10TipCtr);
                    this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, this.indicesVector10TipCtr, this.gl.DYNAMIC_DRAW);
                    break;
                case 1:
                    // Bind the buffer object to target
                    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBufferVector01TipCtr);
                    // Write date into the buffer object
                    this.gl.bufferData(this.gl.ARRAY_BUFFER, this.verticesVector01TipCtr, this.gl.DYNAMIC_DRAW);
                    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBufferVector01TipCtr);
                    this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, this.indicesVector01TipCtr, this.gl.DYNAMIC_DRAW);
                    break;
                case 2:
                    // Bind the buffer object to target
                    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBufferVector11TipCtr);
                    // Write date into the buffer object
                    this.gl.bufferData(this.gl.ARRAY_BUFFER, this.verticesVector11TipCtr, this.gl.DYNAMIC_DRAW);
                    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBufferVector11TipCtr);
                    this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, this.indicesVector11TipCtr, this.gl.DYNAMIC_DRAW);
                    break;
            }
            // Assign the buffer object to a_Position variable
            this.gl.vertexAttribPointer(this.a_Position, 3, this.gl.FLOAT, false, this.FSIZE * this.countAttribData, 0);
            // Enable the assignment to a_Position variable
            this.gl.enableVertexAttribArray(this.a_Position);
            // Assign the buffer object to a_select variable
            this.gl.vertexAttribPointer(this.a_select, 1, this.gl.FLOAT, false, this.FSIZE * this.countAttribData, this.FSIZE * 3);
            // Enable the assignment to a_select variable
            this.gl.enableVertexAttribArray(this.a_select);
            // Disable the assignment to a_normal variable
            this.gl.disableVertexAttribArray(this.a_normal);
            // Assign the buffer object to a_transformMatrix variable
            this.gl.vertexAttribPointer(this.a_transformMatrix, 4, this.gl.FLOAT, false, this.FSIZE * this.countAttribData, this.FSIZE * 4);
            this.gl.vertexAttribPointer(this.a_transformMatrix + 1, 4, this.gl.FLOAT, false, this.FSIZE * this.countAttribData, this.FSIZE * (4 + 4));
            this.gl.vertexAttribPointer(this.a_transformMatrix + 2, 4, this.gl.FLOAT, false, this.FSIZE * this.countAttribData, this.FSIZE * (8 + 4));
            this.gl.vertexAttribPointer(this.a_transformMatrix + 3, 4, this.gl.FLOAT, false, this.FSIZE * this.countAttribData, this.FSIZE * (12 + 4));
            // Enable the assignment to a_transformMatrix variable
            this.gl.enableVertexAttribArray(this.a_transformMatrix);
            this.gl.enableVertexAttribArray(this.a_transformMatrix + 1);
            this.gl.enableVertexAttribArray(this.a_transformMatrix + 2);
            this.gl.enableVertexAttribArray(this.a_transformMatrix + 3);

            this.gl.uniform4f(this.u_color, 0.0, 0.0, 0.0, 1.0);
            this.gl.uniform4f(this.u_colorSelect, 0.5, 0.5, 0.0, 1.0);

            this.gl.drawElements(this.gl.TRIANGLES, this.N_ctr.value * this.M_ctr.value * countIndicesOneTip, this.gl.UNSIGNED_SHORT, 0);
        }

        if (this.drawNaturalCubeSurfaceSpline) {
            this.gl.uniform1f(this.u_useTransformMatrix, false);
            // Bind the buffer object to target
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBufferSpline);
            // Write date into the buffer object
            this.gl.bufferData(this.gl.ARRAY_BUFFER, this.verticesSpline, this.gl.DYNAMIC_DRAW);
            //var FSIZE = this.verticesSpline.BYTES_PER_ELEMENT;
            // Assign the buffer object to a_Position variable
            this.gl.vertexAttribPointer(this.a_Position, 3, this.gl.FLOAT, false, this.FSIZE * 6, 0);
            // Assign the buffer object to a_normal variable
            this.gl.vertexAttribPointer(this.a_normal, 3, this.gl.FLOAT, false, this.FSIZE * 6, this.FSIZE * 3);
            // Enable the assignment to a_Position variable
            this.gl.enableVertexAttribArray(this.a_Position);
            // Disable the assignment to a_select variable
            this.gl.disableVertexAttribArray(this.a_select);
            // Enable the assignment to a_normal variable
            this.gl.enableVertexAttribArray(this.a_normal);
            // Disable the assignment to a_transformMatrix variable
            this.gl.disableVertexAttribArray(this.a_transformMatrix);
            this.gl.disableVertexAttribArray(this.a_transformMatrix + 1);
            this.gl.disableVertexAttribArray(this.a_transformMatrix + 2);
            this.gl.disableVertexAttribArray(this.a_transformMatrix + 3);

            this.gl.uniform4f(this.u_color, 1.0, 0.0, 0.0, 1.0);
            this.gl.uniform1f(this.u_pointSize, 5.0);
            //points
            if (this.visualizeSplineWithPoints)
                this.gl.drawArrays(this.gl.POINTS, 0, this.N.value * this.M.value);
            //lines
            if (this.visualizeSplineWithLines) {
                this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBufferSplineLines);
                this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, this.indicesSplineLines, this.gl.DYNAMIC_DRAW);

                this.gl.uniform4f(this.u_color, 0.0, 1.0, 1.0, 1.0);

                for (i = 0; i < this.N.value; i++)
                    this.gl.drawElements(this.gl.LINE_STRIP, this.M.value, this.gl.UNSIGNED_SHORT, ((i * this.M.value) * this.ISIZE));

                this.gl.uniform4f(this.u_color, 1.0, 0.0, 1.0, 1.0);

                for (j = 0; j < this.M.value; j++)
                    this.gl.drawElements(this.gl.LINE_STRIP, this.N.value, this.gl.UNSIGNED_SHORT, ((this.N.value * this.M.value + j * this.N.value) * this.ISIZE));
            }
            //surface
            if (this.visualizeSplineWithSurface) {
                this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBufferSplineSurface);
                this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, this.indicesSplineSurface, this.gl.DYNAMIC_DRAW);

                this.gl.uniform1f(this.u_drawPolygon, true);
                this.gl.depthMask(false);
                this.gl.enable(this.gl.BLEND);
                this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
                this.gl.uniform4f(this.u_color, 0.2775, 0.2775, 0.2775, this.alpha.value);
                this.gl.drawElements(this.gl.TRIANGLES, 6 * (this.N.value - 1) * (this.M.value - 1), this.gl.UNSIGNED_SHORT, 0);
                this.gl.disable(this.gl.BLEND);
                this.gl.depthMask(true);
            }
        }
    },
    plotMode: function (selOption) {
        switch (selOption) {
            case 1:
                this.drawNaturalCubeSurfaceSpline = !this.drawNaturalCubeSurfaceSpline;
                if (this.drawNaturalCubeSurfaceSpline)
                    this.calculateNaturalCubeSurfaceSpline();
                break;
            case 2:
                if (this.drawNaturalCubeSurfaceSpline)
                    this.calculateNaturalCubeSurfaceSpline();
                break;
            case 3:
                this.drawControlPolygon = !this.drawControlPolygon;
                break;
            case 4:
                this.visualizeSplineWithPoints = !this.visualizeSplineWithPoints;
                break;
            case 5:
                this.visualizeSplineWithLines = !this.visualizeSplineWithLines;
                break;
            case 6:
                this.visualizeSplineWithSurface = !this.visualizeSplineWithSurface;
                break;
            case 7:
                this.showControlPoints = !this.showControlPoints;
                break;
        }
        this.setVertexBuffersAndDraw();
    },
    calculateNaturalCubeSurfaceSpline: function () {

        let i, j;

        const N_ctr = eval(this.N_ctr.value);
        const M_ctr = eval(this.M_ctr.value);
        const N = eval(this.N.value);
        const M = eval(this.M.value);
        let tab_u = new Array(N_ctr);
        let tab_v = new Array(N_ctr);
        let stab_u = new Array(N_ctr);
        let stab_v = new Array(N_ctr);
        for (i = 0; i < N_ctr; i++)
        {
            tab_u[i] = new Array(M_ctr);
            tab_v[i] = new Array(M_ctr);
            stab_u[i] = new Array(M_ctr);
            stab_v[i] = new Array(M_ctr);
        }
        let u_avr = new Array(N_ctr);
        let v_avr = new Array(M_ctr);
        let su = 0;
        let sv =0;
        let du = 0;
        let dv = 0;


        // ������ ��������� ��������-����������� m10, m01, m11 � ��������� ������
         for (i = 0; i < N_ctr; i++)
            for (j = 0; j < M_ctr; j++) {
                this.m10Ctr[i][j].x = this.m10PointsCtr[i][j].x - this.pointsCtr[i][j].x;
                this.m10Ctr[i][j].y = this.m10PointsCtr[i][j].y - this.pointsCtr[i][j].y;
                this.m10Ctr[i][j].z = this.m10PointsCtr[i][j].z - this.pointsCtr[i][j].z;

                this.m01Ctr[i][j].x = this.m01PointsCtr[i][j].x - this.pointsCtr[i][j].x;
                this.m01Ctr[i][j].y = this.m01PointsCtr[i][j].y - this.pointsCtr[i][j].y;
                this.m01Ctr[i][j].z = this.m01PointsCtr[i][j].z - this.pointsCtr[i][j].z;

                this.m11Ctr[i][j].x = this.m11PointsCtr[i][j].x - this.pointsCtr[i][j].x;
                this.m11Ctr[i][j].y = this.m11PointsCtr[i][j].y - this.pointsCtr[i][j].y;
                this.m11Ctr[i][j].z = this.m11PointsCtr[i][j].z - this.pointsCtr[i][j].z;
            }
        
            //console.log(this.pointsCtr[1][1].x);
        // ���������� ������ u � v
        if ((this.chordal.checked))
        {
            for (i = 0; i < N_ctr; i++)
            {
                for (j = 0; j< M_ctr; j++)
                {
                    if (i == 0)
                    {
                        tab_u[i][j] = 0;
                    }
                    else 
                    {
                        tab_u[i][j] = Math.hypot(this.pointsCtr[i][j].x - this.pointsCtr[i - 1][j].x, this.pointsCtr[i][j].y - this.pointsCtr[i - 1][j].y, this.pointsCtr[i][j].z - this.pointsCtr[i-1][j].z);
                    }
                    if (j == 0)
                    {
                        tab_v[i][j] = 0;
                    }
                    else 
                    {
                        tab_v[i][j] = Math.hypot(this.pointsCtr[i][j].x - this.pointsCtr[i][j - 1].x, this.pointsCtr[i][j].y - this.pointsCtr[i][j - 1].y, this.pointsCtr[i][j].z - this.pointsCtr[i][j-1].z);
                    }
                }
            }
        }
        else if (this.centripetal.checked)
        {
            for (i = 0; i < N_ctr; i++)
            {
                for (j = 0; j< M_ctr; j++)
                {
                    if (i == 0)
                    {
                        tab_u[i][j] = 0;
                    }
                    else 
                    {
                        tab_u[i][j] = Math.sqrt(Math.hypot(this.pointsCtr[i][j].x - this.pointsCtr[i - 1][j].x, this.pointsCtr[i][j].y - this.pointsCtr[i - 1][j].y, this.pointsCtr[i][j].z - this.pointsCtr[i-1][j].z));
                    }
                    if (j == 0)
                    {
                        tab_v[i][j] = 0;
                    }
                    else
                    {
                        tab_v[i][j] = Math.sqrt(Math.hypot(this.pointsCtr[i][j].x - this.pointsCtr[i][j - 1].x, this.pointsCtr[i][j].y - this.pointsCtr[i][j - 1].y, this.pointsCtr[i][j].z - this.pointsCtr[i][j-1].z));
                    }
                }
            }
        }

        for ( i= 0;i<N_ctr;i++)
        {
            u_avr[i] = 0;
            for (j = 0; j < M_ctr; j++)
            {
                u_avr[i] += tab_u[i][j];
            }
            u_avr[i] /= M_ctr;
            su += u_avr[i];
            //du 
        }

        for (j = 0; j < M_ctr; j++)
        {
            v_avr[j] = 0;
            for (i =0; i < N_ctr; i++)
            {
                v_avr[j] += tab_v[i][j];
            }
            v_avr[j] /= N_ctr;
            sv += v_avr[j];
        }


        // initsialization of parametric coordinates
        for (i = 0; i<N_ctr; i++)
        {
            for (j = 0; j< M_ctr; j++)
            {
                if (this.uniform.checked)
                {
                    this.pointsCtr[i][j].u = i/(N_ctr-1);
                    this.pointsCtr[i][j].v = j/(M_ctr-1);
                }
                else
                {
                    if(i == 0)
                    {
                        this.pointsCtr[i][j].u = 0;
                    }
                    else 
                    {
                        this.pointsCtr[i][j].u = this.pointsCtr[i - 1][j].u + u_avr[i] / su;
                    }
                    if (j == 0)
                    {
                        this.pointsCtr[i][j].v = 0;
                    }
                    else 
                    {
                        this.pointsCtr[i][j].v = this.pointsCtr[i][j-1].v + v_avr[j] / sv;
                    }
                }
            }
        }
        
        



        this.pointsSpline = new Array(N);
        this.normalsSpline = new Array(N);
        for (i = 0; i < N; i++) {
            this.pointsSpline[i] = new Array(M);
            this.normalsSpline[i] = new Array(M);
            for (j = 0; j < M; j++)
                this.normalsSpline[i][j] = new Array(3);
        }

        let Nt = N_ctr - 1;
        let Mt = M_ctr - 1;
        //console.log(this.pointsCtr[1][Nt].v);
        let h = new Array(Nt-1);
        let d = new Array(Mt - 1);
        for(i = 0; i < Nt -1; i++)
        {
            h[i] = this.pointsCtr[i+1][1].u - this.pointsCtr[i][1].u;
        }

        for (j = 0; j < Mt - 1; j++)
        {
            d[j] = this.pointsCtr[1][j+1] - this.pointsCtr[1][j];
        }

        // functions for omega and epsilon (maybe peredelat')
        function w(u,i)
        {
            return (u - this.pointsCtr[i][1].u)/h[i];
        }
        function e(v,j)
        {
            return (v - this.pointsCtr[1][j].v)/d[j];
        }




        let X1 = new Array(M_ctr+2);
        for (i = 0; i < M_ctr+2; i++)
        {
            X1[i] = new Array(N_ctr+2);
        }

        // ������ ������ ��� ������� 1-2 ���� ��� x
        X1[0][0] = this.m11Ctr[0][Mt].x;
        for (i = 0; i < M_ctr; i++)
        {
            X1[0][i+1] = this.m01Ctr[i][Mt].x;
        }
        X1[0][N_ctr + 1] = this.m11Ctr[Nt][Mt].x;

        console.log("this");
        console.log(this.m11Ctr[0][0].x);

        //������ �������
        for (j = 0; j < M_ctr; j++)
        {
            X1[1+j][0] = this.m10Ctr[0][Mt - j].x;
        }

        //�������� ��������� x ����������� �����
        for (i = 0; i < N_ctr; i++)
        {
            for (j = 0; j < M_ctr; j++)
            {
                X1[i + 1][j + 1] = this.pointsCtr[Mt - j][i].x;
            }
        }

        //��������� ������
        X1[M_ctr + 1][0]  = this.m11Ctr[0][0].x;
        for (i = 0; i < N_ctr; i++)
        {
            X1[M_ctr + 1][i+1] = this.m01Ctr[i][0].x;
        }
        X1[M_ctr+1][N_ctr+1] = this.m11Ctr[Nt][0].x;

        // ��������� �������
        for (j = 0; j < M_ctr; j++)
        {
            X1[Mt - j][N_ctr + 1] = this.m10Ctr[N_ctr][Mt - j];
        }


        // p[ti, ti+1]
        function xuiui_1(i, j)
        {
            return (this.pointsCtr[i+1][j].x - this.pointsCtr[i][j].x)/h[i];
        }

        // ������ xuiui_1(i, j) ��� ������ � ��������� ������, �������� ������ h, ����� ������� ��� ������� ������
        /* function x_u_sh(i, j)
        {
            return
        } */

        let fx1 = new Array(M_ctr + 2);
        for (i = 0; i < M_ctr + 2; i++)
        {
            fx1[i]=new Array(N_ctr);
        }

        


        
        //// �������� ��� ������� ����� ��������� �������������� ������� � �������� � ���
        //for (i = 0; i < N; i++)
        //{
        //	for (j = 0; j < M; j++)
        //	{
        //      x = ;
        //      y = ;
        //      z = ;
        //      
        //      pt = new Point(x, y, z);
        //      this.pointsSpline[i][j] = pt;

        //      //CALCULATE TANGENT VECTORS
        //      const x_u = ;
        //      const y_u = ;
        //      const z_u = ;

        //      const x_v = ;
        //      const y_v = ;
        //      const z_v = ;

        //      const pt_u = vec3.fromValues(x_u, y_u, z_u);
        //      const pt_v = vec3.fromValues(x_v, y_v, z_v);

        //      //CALCULATE NORMAL VECTOR
        //      const normal = vec3.create();

        //      this.normalsSpline[i][j][0] = normal[0];
        //      this.normalsSpline[i][j][1] = normal[1];
        //      this.normalsSpline[i][j][2] = normal[2];
        //	}
        //}

        this.verticesSpline = new Float32Array(N * M * 6);
        for (i = 0; i < N; i++)
            for (j = 0; j < M; j++) {
                const offset = i * M + j;
                this.verticesSpline[offset * 6] = this.pointsSpline[i][j].x;
                this.verticesSpline[offset * 6 + 1] = this.pointsSpline[i][j].y;
                this.verticesSpline[offset * 6 + 2] = this.pointsSpline[i][j].z;
                this.verticesSpline[offset * 6 + 3] = this.normalsSpline[i][j][0];
                this.verticesSpline[offset * 6 + 4] = this.normalsSpline[i][j][1];
                this.verticesSpline[offset * 6 + 5] = this.normalsSpline[i][j][2];
            }

        this.createIndicesSplineLines(N, M);
        this.createIndicesSplineSurface(N, M);
    }
}

function mousedown(ev, canvas) {
    const x = ev.clientX; // x coordinate of a mouse pointer
    const y = ev.clientY; // y coordinate of a mouse pointer
    const rect = ev.target.getBoundingClientRect();

    Data.mousedownHandler(EventUtil.getButton(ev), x - rect.left, canvas.height - (y - rect.top));
}

function mouseup(ev, canvas) {
    const x = ev.clientX; // x coordinate of a mouse pointer
    const y = ev.clientY; // y coordinate of a mouse pointer
    const rect = ev.target.getBoundingClientRect();

    Data.mouseupHandler(EventUtil.getButton(ev), x - rect.left, canvas.height - (y - rect.top));
}

function mousemove(ev, canvas) {
    const x = ev.clientX; // x coordinate of a mouse pointer
    const y = ev.clientY; // y coordinate of a mouse pointer
    const rect = ev.target.getBoundingClientRect();

    Data.mousemoveHandler(x - rect.left, canvas.height - (y - rect.top));
}