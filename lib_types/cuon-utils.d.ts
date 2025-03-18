declare function initShaders(
	gl: WebGLRenderingContext,
	vshader: string,
	fshader: string,
): boolean;

declare function createProgram(
	gl: WebGLRenderingContext,
	vshader: string,
	fshader: string,
): WebGLProgram | null;

declare function loadShader(
	gl: WebGLRenderingContext,
	type: number,
	source: string,
): WebGLShader | null;

declare function getWebGLContext(
	canvas: HTMLCanvasElement,
	opt_debug?: boolean,
): WebGLRenderingContext | null;
