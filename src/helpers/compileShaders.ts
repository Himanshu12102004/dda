export function shaderCompiler(
  shaderText: string,
  type: number,
  gl: WebGL2RenderingContext
): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('No such Shader');
  gl.shaderSource(shader, shaderText);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    if (type == gl.FRAGMENT_SHADER)
      throw new Error('frag ' + gl.getShaderInfoLog(shader));
    else throw new Error('vertex ' + gl.getShaderInfoLog(shader));
  }
  return shader;
}
