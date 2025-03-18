/**
 * Initializes shaders by compiling and linking the given vertex and fragment shaders.
 * @param gl The WebGL rendering context.
 * @param vertexShaderId The ID of the HTML element containing the vertex shader source code.
 * @param fragmentShaderId The ID of the HTML element containing the fragment shader source code.
 * @returns A WebGLProgram if successful, otherwise -1 on failure.
 */
declare function initShaders(
	gl: WebGLRenderingContext,
	vertexShaderId: string,
	fragmentShaderId: string,
): WebGLProgram | -1;
