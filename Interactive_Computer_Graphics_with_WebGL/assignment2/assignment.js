"use strict";

var canvas;
var gl;

var cindex = 0;
var colorsType = [
    vec4(0.0, 0.0, 0.0, 1.0),  // black
    vec4(1.0, 0.0, 0.0, 1.0),  // red
    vec4(1.0, 1.0, 0.0, 1.0),  // yellow
    vec4(0.0, 1.0, 0.0, 1.0),  // green
    vec4(0.0, 0.0, 1.0, 1.0),  // blue
    vec4(1.0, 0.0, 1.0, 1.0),  // magenta
    vec4(0.0, 1.0, 1.0, 1.0)   // cyan
];
var brush = 3;
var cindex = 2;
var program;
var colors = [];
var vertices = [];
var widths = [];
var mouseOn = false;
var lastVertex;
var zindex = 0.1;

function getVertexFromEvent(event)
{
  return vec3(
    2 * event.clientX / canvas.width-1,
    2 * (canvas.height - event.clientY) / canvas.height-1,
    zindex
  );
}

function addVertex(vertex, color)
{
  vertices.push(vertex);
  colors.push(color);
}

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    canvas.addEventListener("mousedown", function(event){
        zindex = zindex * 0.9;
        mouseOn = true;
        lastVertex = getVertexFromEvent(event);
    });

    document.addEventListener("mouseup", function(){
        mouseOn = false;
    });

    canvas.addEventListener("mousemove", function(event){
        if(mouseOn){
            addVertex(lastVertex, colorsType[cindex]);
            lastVertex = getVertexFromEvent(event);
            addVertex(lastVertex, colorsType[cindex]);
            widths.push(brush);
            render();
        }
    });

    document.getElementById("brush").onchange = function(event) {
        var elem = crossBrowserEvent(event);
        brush = elem.value;
    };

    document.getElementById("clear").onclick = function() {
        clear();
    };

    var m = document.getElementById("mymenu");
    m.addEventListener("click", function() {
     cindex = m.selectedIndex;
    });

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.enable(gl.DEPTH_TEST);

    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
};


function render()
{
    var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );

    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );
  
    for(var i = 0; i < vertices.length / 2; i++)
    {      
      gl.lineWidth(widths[i]);
      gl.drawArrays(gl.LINES, i * 2, 2);
    }
}

function clear()
{
    colors = [];
    vertices = [];
    widths = [];
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

}
