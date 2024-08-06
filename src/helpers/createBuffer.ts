export function createBuffer(
  cpuArray: Float32Array,
  gl: WebGL2RenderingContext
) {
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, cpuArray, gl.STATIC_DRAW);
  return buffer;
}
