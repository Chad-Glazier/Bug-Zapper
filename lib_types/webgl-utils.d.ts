declare namespace WebGLUtils {
	/**
	 * Creates the HTML for a failure message.
	 * @param msg The failure message to display.
	 * @returns The HTML string.
	 */
	function makeFailHTML(msg: string): string;

	/**
	 * Message for getting a WebGL browser.
	 */
	const GET_A_WEBGL_BROWSER: string;

	/**
	 * Message for needing better hardware.
	 */
	const OTHER_PROBLEM: string;

	/**
	 * Creates a WebGL context. If creation fails, it will change the contents of the container of the canvas tag to an error message.
	 * @param canvas The canvas element to create a context from.
	 * @param opt_attribs Optional WebGL context creation attributes.
	 * @param opt_onError Optional callback function to handle creation errors.
	 * @returns The WebGLRenderingContext.
	 */
	function setupWebGL(
		canvas: HTMLCanvasElement,
		opt_attribs?: WebGLContextAttributes,
		opt_onError?: (msg: string) => void,
	): WebGLRenderingContext | null;

	/**
	 * Creates a WebGL context.
	 * @param canvas The canvas tag to get context from. If one is not passed in, one will be created.
	 * @param opt_attribs Optional WebGL context attributes.
	 * @returns The WebGLRenderingContext.
	 */
	function create3DContext(
		canvas: HTMLCanvasElement,
		opt_attribs?: WebGLContextAttributes,
	): WebGLRenderingContext | null;
}

declare global {
	interface Window {
		requestAnimationFrame: (
			callback: FrameRequestCallback,
			element: Element,
		) => void;
		cancelAnimationFrame: (id: number) => void;
	}
}
