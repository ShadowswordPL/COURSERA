"use strict";

var canvas;
var gl;
var program;

var pointsArray = [];
var normalsArray = [];

var posx1 = 100;
var posy1 = 100;
var posz1 = 100;

var posx2 = 100;
var posy2 = 100;
var posz2 = 100;

function getPos(num)
{ 
  console.log(num / 100 - 1);
  return num / 100 - 1;
}

var lightPosition1 = vec4(getPos(posx1), getPos(posy1), getPos(posz1), 0.0);
var lightPosition2 = vec4(getPos(posx2), getPos(posy2), getPos(posz2), 0.0);
var lightAmbient = vec4(0.1, 0, 0.1, 1.0);
var lightDiffuse = vec4(0.5, 0.5, 0.5, 1.0);
var lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);

var materialAmbient = vec4(1.0, 0.8, 1.0, 1.0);
var materialDiffuse = vec4(1.0, 0.8, 1.0, 1.0);
var materialSpecular = vec4(1.0, 0.8, 1, 1.0);
var materialShininess = 200.0;

var firstSourceOn = 1;
var secondSourceOn = 1;

var ctm;
var ambientColor, diffuseColor, specularColor;
var viewerPos;
var program;


var flag = true;

function getColor()
{
  return [0,1,0,1]; 
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
      var point = move(rotateX(rotateY(rotateZ(triangle[j], angle), angle), angle), center);
      normalsArray.push(subtract(center, point));
      pointsArray.push(point);
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
  
  var top = move(rotateX(rotateY(rotateZ(top, angle), angle), angle), center);
  var bot = move(rotateX(rotateY(rotateZ(bot, angle), angle), angle), center);

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

      var first = [-size/2, prev * sgny, Math.sqrt(Math.abs(size*size - prev*prev)) * sgnz];
      var second = [-size/2, y * sgny, Math.sqrt(Math.abs(size*size - y*y)) * sgnz];
      prev = y;
      
      var first = move(rotateX(rotateY(rotateZ(first, angle), angle), angle), center);
      var second = move(rotateX(rotateY(rotateZ(second, angle), angle), angle), center);

      var triangles = [
        first, second, top,
        first, second, bot
      ];
      
        
      var j;
      for(j = 0; j < 6; j++)
      {
        var t1, t2, norm;
        if(j < 3)
        {
          norm = subtract(top, second);
        }
        else
        {
          norm = subtract(top, bot);
        }
        
        normalsArray.push(norm);
        pointsArray.push(triangles[ j]);
      } 
    }
  }
}

function draw()
{
    sphere(vec3(0.3, -0.4, 0), 2/5, vec3(30, 40, 50), 30);
    cone(vec3(-0.4, 0.2, 0), 1/2, vec3(30, 220, 200), 30);
}

window.onload = function init(){
  canvas = document.getElementById("gl-canvas");
  gl = WebGLUtils.setupWebGL(canvas);
  
  gl.viewport(0,0, canvas.width, canvas.height);
  gl.enable(gl.DEPTH_TEST);

  program = initShaders( gl, "vertex-shader", "fragment-shader" );
  gl.useProgram( program );

  document.getElementById("firstSourceOn").oninput = function(event) {
    var elem = crossBrowserEvent(event);    
    firstSourceOn = elem.value;
    render();
  };

  document.getElementById("secondSourceOn").oninput = function(event) {
    var elem = crossBrowserEvent(event);  
    secondSourceOn = elem.value;
    render();
  };


  document.getElementById("posx1").oninput = function(event) {
    var elem = crossBrowserEvent(event);
    posx1 = elem.value;
    render();
  };

  document.getElementById("posy1").oninput = function(event) {
    var elem = crossBrowserEvent(event);
    posy1 = elem.value;
    render();
  };

  document.getElementById("posz1").oninput = function(event) {
    var elem = crossBrowserEvent(event);
    posz1 = elem.value;
    render();
  };

  document.getElementById("posx2").oninput = function(event) {
    var elem = crossBrowserEvent(event);
    posx2 = elem.value;
    render();
  };

  document.getElementById("posy2").oninput = function(event) {
    var elem = crossBrowserEvent(event);
    posy2 = elem.value;
    render();
  };

  document.getElementById("posz2").oninput = function(event) {
    var elem = crossBrowserEvent(event);
    posz2 = elem.value;
    render();
  };

  render();
}

function render(){
  gl.clearColor(0,0,0,1);  
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
  pointsArray = [];
  normalsArray = [];  

  lightPosition1 = vec4(getPos(posx1), getPos(posy1), getPos(posz1), 0.0 )
  lightPosition2 = vec4(getPos(posx2), getPos(posy2), getPos(posz2), 0.0 )
  draw();

  var nBuffer = gl.createBuffer();
  gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer );
  gl.bufferData( gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW );

  var vNormal = gl.getAttribLocation( program, "vNormal" );
  gl.vertexAttribPointer( vNormal, 3, gl.FLOAT, false, 0, 0 );
  gl.enableVertexAttribArray( vNormal );

  var vBuffer = gl.createBuffer();
  gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
  gl.bufferData( gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW );

  var vPosition = gl.getAttribLocation(program, "vPosition");
  gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);  

 
  viewerPos = vec3(0.0, 0.0, -20.0 );


  var ambientProduct = mult(lightAmbient, materialAmbient);
  var diffuseProduct = mult(lightDiffuse, materialDiffuse);
  var specularProduct = mult(lightSpecular, materialSpecular);

  gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"),
     flatten(ambientProduct));
  gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"),
     flatten(diffuseProduct) );
  gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"),
     flatten(specularProduct) );
  gl.uniform4fv(gl.getUniformLocation(program, "lightPosition1"),
     flatten(lightPosition1) );
  gl.uniform4fv(gl.getUniformLocation(program, "lightPosition2"),
     flatten(lightPosition2) );

  gl.uniform1f(gl.getUniformLocation(program,
     "shininess"),materialShininess);
  gl.uniform1f(gl.getUniformLocation(program,
     "firstSourceOn"),firstSourceOn);
  gl.uniform1f(gl.getUniformLocation(program,
     "secondSourceOn"),secondSourceOn);

  gl.drawArrays(gl.TRIANGLES, 0, pointsArray.length);
}

