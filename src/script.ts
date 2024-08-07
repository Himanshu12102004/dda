import ddaGenPoints from './algo/ddaGenPoints.js';
import { shaderCompiler } from './helpers/compileShaders.js';
import { createBuffer } from './helpers/createBuffer.js';
import { createProgram } from './helpers/createProgram.js';
import dat from 'https://cdn.skypack.dev/dat.gui';
let canvas, gl: WebGL2RenderingContext;
let graphScale = { scale: 150 };
let gridColor = { color: [86, 86, 86] };
let lineColor = { color: [173, 216, 230] };
let lineForm = { type: 'Two Points' };
let pointSize = { lineWidth: 1 };
let points: Array<number> = [];
let coord: HTMLSpanElement = document.querySelector('.coordinates')!;
let wantToSeeGridCoords = {
  gridCoordinates: true,
};
let inputs = {
  x1: 0.39,
  y1: 0.27,
  x2: 1.16,
  y2: 1.59,
  x: 0.39,
  y: 0.27,
  theta: 59.74,
  radius: 1.5281,
  slope: 0,
};
let shaders: Array<string>;
let gui = new dat.GUI();
let inputFolder: any;
let axes: Array<number> = [];
let height = innerHeight;
let width = innerWidth;
if (!(height > 500 && width > 500)) {
  (document.querySelector('.restricted') as HTMLDivElement).style.display =
    'flex';
}
class Points {
  x: number;
  y: number;
  positionX: number;
  positionY: number;
  constructor(x: number, y: number, positionX: number, positionY: number) {
    this.x = x;
    this.y = y;
    this.positionX = positionX;
    this.positionY = positionY;
  }
}
function loadShader(shaderUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    let req = new XMLHttpRequest();
    req.open('GET', shaderUrl, true);
    req.onreadystatechange = () => {
      if (req.readyState === 4) {
        if (req.status === 200) {
          resolve(req.responseText);
        } else {
          reject(new Error(`Failed to load shader: ${shaderUrl}`));
        }
      }
    };
    req.send();
  });
}
function handleMouseMove(e: MouseEvent) {
  let distance = graphScale.scale;
  let rightBound = width / (2 * distance);
  let topBound = height / (2 * distance);
  let leftBound = -rightBound;
  let bottomBound = -topBound;
  let x = (e.clientX * (rightBound - leftBound)) / width + leftBound;
  let y = -((e.clientY * (topBound - bottomBound)) / height + bottomBound);
  coord!.innerHTML = `${x.toFixed(3)} , ${y.toFixed(3)}`;
  coord!.style.top = `${e.clientY - 15}px`;
  coord!.style.left = `${e.clientX + 1}px`;
}
function generateGridVertices() {
  axes = [];
  let distance = graphScale.scale;
  let noOfHorizontalLines = height / (2 * distance);
  let dy = 1 / noOfHorizontalLines;
  let y = 0;
  for (let i = 0; i < noOfHorizontalLines; i++) {
    axes.push(-1, y, 1, y, -1, -y, 1, -y);
    y += dy;
  }
  let noOfVerticalLines = width / (2 * distance);
  let dx = 1 / noOfVerticalLines;
  let x = 0;
  for (let i = 0; i < noOfVerticalLines; i++) {
    axes.push(x, -1, x, 1, -x, 1, -x, -1);
    x += dx;
  }
  draw();
  updateGUI();
  displayCoordinates();
}
function displayCoordinates() {
  let myCoords = document.querySelector('.myCoords')!;
  myCoords.innerHTML = '';
  if (wantToSeeGridCoords.gridCoordinates) {
    let points = makeTheCoordinates();
    points.forEach((elem: Points) => {
      let html = genCoordinateHtml(elem, true);
      myCoords.insertAdjacentHTML('beforeend', html);
    });
  }
}
async function init() {
  try {
    const vertexShaderSource = await loadShader('./shaders/dda.vs.glsl');
    const fragmentShaderSource = await loadShader('./shaders/dda.fs.glsl');
    shaders = [vertexShaderSource, fragmentShaderSource];
    main();
    generateGridVertices();
    gui
      .add(lineForm, 'type', ['Two Points', 'Point and Theta'])
      .onChange(updateGUI);

    gui.addColor(gridColor, 'color').name('Grid Color').onChange(drawLine);
    gui.addColor(lineColor, 'color').name('Line Color').onChange(drawLine);
    gui
      .add(wantToSeeGridCoords, 'gridCoordinates')
      .onChange(displayCoordinates);
    gui.add(pointSize, 'lineWidth', 1, 50).onChange(drawLine);
    updateGUI();
    window.addEventListener('mousemove', (e) => {
      handleMouseMove(e);
    });
  } catch (err: any) {
    console.error(err);
  }
}
function genCoordinateHtml(elem: Points, gridCoords: boolean) {
  return `<div style="position:absolute;top:${elem.positionY}px;left:${
    elem.positionX
  }px;color:white;
  color:${
    gridCoords ? (elem.x == 0 || elem.y == 0 ? 'white' : 'orange') : 'red'
  };
  user-select:none;

  font-family:monospace">(${
    gridCoords || elem.x == 0 ? elem.x : elem.x.toFixed(2)
  },${gridCoords || elem.y == 0 ? elem.y : elem.y.toFixed(2)})
 </div>`;
}
function renderTheLineEnds(x1: number, y1: number, x2: number, y2: number) {
  let lineCoords = document.querySelector('.lineCoords')!;
  lineCoords.innerHTML = '';
  let distance = graphScale.scale;
  let noOfVerticalLines = width / (2 * distance);
  let noOfHorizontalLines = height / (2 * distance);
  let [x, y] = getCoord(x1, y1, noOfVerticalLines, noOfHorizontalLines);
  let firstPoint = new Points(x1, y1, x, y);
  let point1Html = genCoordinateHtml(firstPoint, false);
  [x, y] = getCoord(x2, y2, noOfVerticalLines, noOfHorizontalLines);
  let secondPoint = new Points(x2, y2, x, y);
  let point2Html = genCoordinateHtml(secondPoint, false);
  lineCoords.insertAdjacentHTML('beforeend', point1Html);
  lineCoords.insertAdjacentHTML('beforeend', point2Html);
}
function draw() {
  points = [];
  if (lineForm.type == 'Two Points') {
    points = ddaGenPoints(
      inputs.x1 * graphScale.scale,
      inputs.y1 * graphScale.scale,
      inputs.x2 * graphScale.scale,
      inputs.y2 * graphScale.scale,
      width / 2,
      height / 2
    );
    renderTheLineEnds(inputs.x1, inputs.y1, inputs.x2, inputs.y2);
  } else if (lineForm.type == 'Point and Theta') {
    let theta = (inputs.theta * Math.PI) / 180;
    let x2 = inputs.radius * Math.cos(theta) + inputs.x;
    let y2 = inputs.radius * Math.sin(theta) + inputs.y;
    points = ddaGenPoints(
      inputs.x * graphScale.scale,
      inputs.y * graphScale.scale,
      x2 * graphScale.scale,
      y2 * graphScale.scale,
      width / 2,
      height / 2
    );
    renderTheLineEnds(inputs.x, inputs.y, x2, y2);
  }
  drawLine();
}
function getCoord(
  i: number,
  j: number,
  noOfVerticalLines: number,
  noOfHorizontalLines: number
) {
  let x = (i + noOfVerticalLines) * graphScale.scale;
  let y = (noOfHorizontalLines - j) * graphScale.scale;
  return [x, y];
}
function makeTheCoordinates() {
  let distance = graphScale.scale;
  let noOfVerticalLines = width / (2 * distance);
  let noOfHorizontalLines = height / (2 * distance);
  let points = [];
  for (let i = 0; i <= noOfVerticalLines; i++) {
    for (let j = 0; j <= noOfHorizontalLines; j++) {
      let [x, y] = getCoord(i, j, noOfVerticalLines, noOfHorizontalLines);
      let point = new Points(i, j, x, y);
      points.push(point);
      if (i == 0 && j == 0) continue;
      [x, y] = getCoord(-i, j, noOfVerticalLines, noOfHorizontalLines);
      point = new Points(-i, j, x, y);
      points.push(point);
      [x, y] = getCoord(-i, -j, noOfVerticalLines, noOfHorizontalLines);
      point = new Points(-i, -j, x, y);
      points.push(point);
      [x, y] = getCoord(i, -j, noOfVerticalLines, noOfHorizontalLines);
      point = new Points(i, -j, x, y);
      points.push(point);
    }
  }
  return points;
}
function drawLine() {
  let vShader = shaderCompiler(shaders[0], gl.VERTEX_SHADER, gl);
  let fShader = shaderCompiler(shaders[1], gl.FRAGMENT_SHADER, gl);
  let program = createProgram(vShader, fShader, gl);
  let buffer = createBuffer(new Float32Array(points), gl);
  const vertexLocation = gl.getAttribLocation(program, 'vertex');
  let uniformLocation = gl.getUniformLocation(program, 'userColors');
  let pointSizeUniformLocation = gl.getUniformLocation(program, 'pointSize');
  gl.enableVertexAttribArray(vertexLocation);
  gl.clearColor(1.0, 1.0, 1.0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  let axesBuffer = createBuffer(new Float32Array(axes), gl);
  gl.bindBuffer(gl.ARRAY_BUFFER, axesBuffer);
  gl.uniform3f(
    uniformLocation,
    gridColor.color[0] / 255,
    gridColor.color[1] / 255,
    gridColor.color[2] / 255
  );
  gl.vertexAttribPointer(vertexLocation, 2, gl.FLOAT, false, 0, 0);
  gl.drawArrays(gl.LINES, 0, axes.length / 2);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

  gl.uniform3f(
    uniformLocation,
    lineColor.color[0] / 255,
    lineColor.color[1] / 255,
    lineColor.color[2] / 255
  );
  gl.uniform1f(pointSizeUniformLocation, pointSize.lineWidth);
  gl.vertexAttribPointer(vertexLocation, 2, gl.FLOAT, false, 0, 0);
  gl.drawArrays(gl.POINTS, 0, points.length / 2);
}
function updateGUI() {
  if (inputFolder) {
    gui.removeFolder(inputFolder);
  }
  let distance = graphScale.scale;
  let noOfVerticalLines = width / (2 * distance) + 1;
  let noOfHorizontalLines = height / (2 * distance) + 1;
  inputFolder = gui.addFolder('Inputs');

  if (lineForm.type === 'Two Points') {
    inputFolder
      .add(inputs, 'x1', -noOfVerticalLines, noOfVerticalLines, 0.01)
      .onChange(draw);
    inputFolder
      .add(inputs, 'y1', -noOfHorizontalLines, noOfHorizontalLines, 0.01)
      .onChange(draw);
    inputFolder
      .add(inputs, 'x2', -noOfVerticalLines, noOfVerticalLines, 0.01)
      .onChange(draw);
    inputFolder
      .add(inputs, 'y2', -noOfHorizontalLines, noOfHorizontalLines, 0.01)
      .onChange(draw);
  } else if (lineForm.type === 'Point and Theta') {
    inputFolder
      .add(inputs, 'x', -noOfVerticalLines, noOfVerticalLines, 0.01)
      .onChange(draw);
    inputFolder
      .add(inputs, 'y', -noOfHorizontalLines, noOfHorizontalLines, 0.01)
      .onChange(draw);
    inputFolder.add(inputs, 'theta', 0, 360).onChange(draw);
    inputFolder
      .add(
        inputs,
        'radius',
        0,
        Math.sqrt(
          Math.pow(noOfHorizontalLines, 2) + Math.pow(noOfVerticalLines, 2)
        ),
        0.01
      )
      .onChange(draw);
  }

  inputFolder.open();
  draw();
}

function main() {
  try {
    canvas = document.querySelector('canvas');
    gl = canvas!.getContext('webgl2')!;
    canvas!.height = height;
    canvas!.width = width;
    if (!gl) {
      alert('This browser does not support webgl');
      return;
    }
    gl.viewport(0, 0, width, height);
    draw();
  } catch (err: any) {
    console.log(err.message);
  }
}
window.addEventListener('wheel', (e) => {
  if (e.deltaY > 0) graphScale.scale = graphScale.scale * 0.95;
  else graphScale.scale = graphScale.scale * 1.05;
  generateGridVertices();
});
window.addEventListener('resize', () => {
  height = innerHeight;
  width = innerWidth;
  generateGridVertices();

  if (height > 500 && width > 500)
    (document.querySelector('.restricted') as HTMLDivElement).style.display =
      'none';
  else
    (document.querySelector('.restricted') as HTMLDivElement).style.display =
      'flex';
  main();
});
document.querySelector('.help')!.addEventListener('click', () => {
  (document.querySelector('.myHelp') as HTMLDivElement).style.display = 'flex';
});
document.querySelector('.closeHelp')!.addEventListener('click', () => {
  (document.querySelector('.myHelp') as HTMLDivElement).style.display = 'none';
});

init();
