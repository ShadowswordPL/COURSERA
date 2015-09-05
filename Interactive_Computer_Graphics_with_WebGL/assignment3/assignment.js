"use strict";

var canvas;
var gl;
var program;

var colors = [];
var points = [];

var oldColors = [];
var oldPoints = [];

var size = 5 / 12;
var posx = 0;
var posy = 0;

var anglex = 180;
var angley = 180;
var anglez = 180;

var colorIndex = -1;

var colorArray = [
  [1,0,0,1],
  [0,0,1,1],
  [0,1,0,1],
  [1,1,0,1],
]

var type = "sphere";

function resetColorIndex()
{
  colorIndex = -1;
}

function getColor()
{
  colorIndex++;
  return colorArray[Math.floor(colorIndex / 3) % colorArray.length]; 
}

function sphereSlice(radius, ysgn, index, maxIndex)
{
  var result = [];
  var innerRadius = Math.pow(index/maxIndex, 2/5) * radius;
  var y = Math.sqrt(Math.pow(radius, 2) - Math.pow(innerRadius, 2)) * ysgn;
  
  var i, x, z;

  for (i = 0; i <= maxIndex; i++)
  {
    x = -innerRadius + (i/maxIndex) * innerRadius * 2;
    z = Math.sqrt(Math.abs(radius*radius - x*x - y*y));
    result.push(vec3(x, y, z));
  }

  for (i = maxIndex; i >= 0; i--)
  {
    x = -innerRadius + (i/maxIndex) * innerRadius * 2;
    z = Math.sqrt(Math.abs(radius*radius - x*x - y*y)) * -1;
    result.push(vec3(x, y, z));
  }

  return result;
}

function rotateX(point, angle)
{  
  var s = Math.sin(angle[0]*Math.PI/180);
  var c = Math.cos(angle[0]*Math.PI/180);

  return [point[0], point[1]*c-point[2]*s, point[1]*s+point[2]*c];
}

function rotateY(point, angle)
{  
  var s = Math.sin(angle[1]*Math.PI/180);
  var c = Math.cos(angle[1]*Math.PI/180);

  return [point[0]*c-point[2]*s, point[1], point[0]*s+point[2]*c];
}

function rotateZ(point, angle)
{  
  var s = Math.sin(angle[2]*Math.PI/180);
  var c = Math.cos(angle[2]*Math.PI/180);

  return [point[0]*c-point[1]*s, point[0]*s+point[1]*c, point[2]];
}

function move(point, center)
{
  return [point[0] + center[0], point[1] + center[1], point[2] + center[2]]
}

function joinSliceSingleSide(slice1, slice2, offset, center, angle)
{
  var index, j, triangle;
  var result = [];
  for (index = 0; index <= slice1.length; index++)
  {
    triangle = [
      slice1[(0 + index) % slice1.length],
      slice1[(1 + index) % slice1.length],
      slice2[(0 + offset + index) % slice1.length]
    ];
    
    for(j = 0; j < 3; j++)
    {
      points.push(move(rotateX(rotateY(rotateZ(triangle[j], angle), angle), angle), center));
      colors.push(getColor());
    } 
  }
}

function joinSlice(slice1, slice2, center, angle)
{
  
  joinSliceSingleSide(slice1, slice2, 0, center, angle);
  joinSliceSingleSide(slice2, slice1, 1, center, angle);
}

function sphere(center, radius, angle, teselation)
{
  resetColorIndex();
  var i;
  for(i = 0; i < teselation; i++)
  {
    joinSlice(sphereSlice(radius,  1, i, teselation), sphereSlice(radius, 1, i+1, teselation), center, angle);
    joinSlice(sphereSlice(radius, -1, i, teselation), sphereSlice(radius, -1, i+1, teselation), center, angle);  
  }
}

function cone(center, size, angle, teselation)
{
  var top = [size/2, 0, 0];
  var bot = [-size/2, 0, 0];
  
  
  var index;

  var k;
  for (k = 0; k < 4; k++)
  {
    var prev = 0;
    for (index = 1; index <= teselation; index++)
    {
      var sgny = 1;
      var sgnz = 1;
      if(k > 1)
      {
        sgny = -1;
      }

      if(k % 2)
      {
        sgnz = -1;
      }

      var y = (index / teselation) * size;
      console.log(prev, y);

      var first = [-size/2, prev * sgny, Math.sqrt(Math.abs(size*size - prev*prev)) * sgnz];
      var second = [-size/2, y * sgny, Math.sqrt(Math.abs(size*size - y*y)) * sgnz];
      prev = y;
      
      var triangles = [
        first, second, top,
        first, second, bot
      ];
      
      var j;
      for(j = 0; j < 6; j++)
      {
        points.push(move(rotateX(rotateY(rotateZ(triangles[j], angle), angle), angle), center));
        colors.push(getColor());
      } 
    }
  }
}

function draw()
{
  if (type == "sphere")
  {
    sphere(vec3(posx, posy, 0), size, vec3(anglex, angley, anglez), 20);
  }
  else if (type == "cone")
  {
    cone(vec3(posx, posy, 0), size, vec3(anglex, angley, anglez), 20);
  }
}

window.onload = function init(){
  canvas = document.getElementById("gl-canvas");
  gl = WebGLUtils.setupWebGL(canvas);
  
  gl.viewport(0,0, canvas.width, canvas.height);
  gl.enable(gl.DEPTH_TEST);

  program = initShaders( gl, "vertex-shader", "fragment-shader" );
  gl.useProgram(program);

  document.getElementById("size").oninput = function(event) {
    var elem = crossBrowserEvent(event);
    size = elem.value / 12;
    render();
  };

  document.getElementById("anglex").oninput = function(event) {
    var elem = crossBrowserEvent(event);
    anglex = elem.value;
    render();
  };

  document.getElementById("angley").oninput = function(event) {
    var elem = crossBrowserEvent(event);
    angley = elem.value;
    render();
  };

  document.getElementById("anglez").oninput = function(event) {
    var elem = crossBrowserEvent(event);
    anglez = elem.value;
    render();
  };

  document.getElementById("posx").oninput = function(event) {
    var elem = crossBrowserEvent(event);
    posx = elem.value / 100 - 1;
    render();
  };

  document.getElementById("posy").oninput = function(event) {
    var elem = crossBrowserEvent(event);
    posy = elem.value / 100 - 1;
    render();
  };

  var m = document.getElementById("mymenu");
  m.addEventListener("click", function() {
      type = m.value || m.options[m.selectedIndex].value;
      render();
  });

  document.getElementById("next").onclick = function() {
    draw();
    oldColors = oldColors.concat(colors);
    oldPoints = oldPoints.concat(points);
    render();
  };

  render();
}

function render(){
  gl.clearColor(1,1,1,1);  
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
  colors = [];
  points = [];

  draw();

  var cBuffer = gl.createBuffer();
  gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
  gl.bufferData( gl.ARRAY_BUFFER, flatten(oldColors.concat(colors)), gl.STATIC_DRAW );

  var vColor = gl.getAttribLocation( program, "vColor" );
  gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
  gl.enableVertexAttribArray( vColor );

  var vBuffer = gl.createBuffer();
  gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
  gl.bufferData( gl.ARRAY_BUFFER, flatten(oldPoints.concat(points)), gl.STATIC_DRAW );

  var vPosition = gl.getAttribLocation( program, "vPosition" );
  gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
  gl.enableVertexAttribArray( vPosition );

  gl.drawArrays(gl.TRIANGLES, 0, oldPoints.concat(points).length);
}

