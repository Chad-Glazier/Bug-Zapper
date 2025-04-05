// @ts-check
/// <reference path="../constants.js" />

/**
 * Initialize a shader program from the shader source code (as strings).
 *
 * @param {WebGLRenderingContext} gl the WebGL rendering context to create the
 * program for.
 * @param {string} vShaderSource the source code for a vertex shader.
 * @param {string} fShaderSource the source code for a fragment shader.
 *
 * @returns {WebGLProgram | null} returns the shader program if it was
 * successfully created. If an error occurred, returns `null` and logs the
 * error to the console.
 */
function initShaderProgram(gl, vShaderSource, fShaderSource) {
	/**
	 * @param {GLenum} type
	 * @param {string} source
	 * @returns {WebGLShader | null} returns the new shader or `null` if
	 * there was an error. If there is an error, it will also be logged to
	 * the console.
	 */
	const loadShader = (type, source) => {
		const shader = gl.createShader(type)
		if (shader == null) {
			console.error(`Failed to create shader:\n${source}`)
			return null
		}

		gl.shaderSource(shader, source)
		gl.compileShader(shader)

		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			console.error(
				`An error occurred compiling the shaders:\n${
					gl.getShaderInfoLog(shader)
				}`,
			)
			gl.deleteShader(shader)
			return null
		}

		return shader
	}

	const vShader = loadShader(gl.VERTEX_SHADER, vShaderSource)
	const fShader = loadShader(gl.FRAGMENT_SHADER, fShaderSource)
	if (vShader == null || fShader == null) {
		return null
	}

	const shaderProgram = gl.createProgram()
	gl.attachShader(shaderProgram, vShader)
	gl.attachShader(shaderProgram, fShader)
	gl.linkProgram(shaderProgram)

	// if creating the shader program failed, log an error.
	if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
		console.error(
			`Unable to initialize the shader program:\n${
				gl.getProgramInfoLog(shaderProgram)
			}`,
		)
		return null
	}

	return shaderProgram
}
