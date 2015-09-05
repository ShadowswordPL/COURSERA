"use strict";

var canvas;
var gl;

var points = [];
var colors = [];
var program;

var numTimesToSubdivide = 1;
var degree = 0;

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );

    gl.enable(gl.DEPTH_TEST);

    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    document.getElementById("slider").onchange = function(event) {
        var elem = crossBrowserEvent(event);
        numTimesToSubdivide = elem.value;
        render();
    };

    document.getElementById("slider2").onchange = function(event) {
        var elem = crossBrowserEvent(event);
        degree = elem.value;
        render();
    };

    render();
};

function triangle(a, b, c)
{
    var red = Math.random();
    var green = Math.random();
    var blue = Math.random();

    colors.push(
      vec3(red, green, blue),
      vec3(red, green, blue),
      vec3(red, green, blue)
    );

    points.push(a, b, c);
}

function teselate(a, b, c, count)
{
    if ( count === 0 ) {
        triangle(rotate(a), rotate(b), rotate(c));
    }

    else {
        var ab = mix(a, b, 0.5);
        var ac = mix(a, c, 0.5);
        var bc = mix(b, c, 0.5);
       
        --count;

        teselate(a, ab, ac, count);
        teselate(ac, bc, c, count);
        teselate(ab, bc, ac, count);
        teselate(ab, bc, b, count); 
    }
}

function rotate(vertex)
{
    var radian = Math.PI * degree / 180;
    var twistRadian = radian * Math.sqrt(vertex[0] * vertex[0] + vertex[1] * vertex[1]);
    return vec3(
      vertex[0] * Math.cos(twistRadian) - vertex[1] * Math.sin(twistRadian),
      vertex[0] * Math.sin(twistRadian) + vertex[1] * Math.cos(twistRadian),
      vertex[2]
    );
}

function render()
{
    gl.clearColor( 0, 0, 0, 1.0 );
    points = [];
    colors = [];
    var vertices = [
        vec3(-0.86, -0.5,  0),
        vec3( 0.86, -0.5,  0),
        vec3( 0   ,  1  ,  0)
    ];
    teselate(
       vertices[0],
       vertices[1], 
       vertices[2],
       numTimesToSubdivide
    );

    var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );

    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawArrays( gl.TRIANGLES, 0, points.length );
}
