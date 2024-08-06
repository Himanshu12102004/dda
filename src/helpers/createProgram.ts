export function createProgram(
  vertexShader: WebGLShader,
  fragShader: WebGLShader,
  gl: WebGL2RenderingContext
): WebGLProgram {
  let shaderArray = [vertexShader, fragShader];
  const program = gl.createProgram();
  if (!program) throw new Error('The Program could not be created');
  shaderArray.forEach((shader) => {
    gl.attachShader(program, shader);
  });
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS))
    throw new Error(gl.getProgramInfoLog(program)!);
  gl.useProgram(program);
  return program;
}
