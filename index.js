// @ts-check
/// <reference path="./lib_types/MV.d.ts" />
/// <reference path="./shaders.js" />
/// <reference path="./types.d.ts" />

const CANVAS_ID = "gl-canvas"
const MAX_DISTANCE = 20
const MIN_DISTANCE = 3
const INITIAL_DISTANCE = 5
const FRICTION = 0.025
const SPHERE_DIVISIONS = 26

function main() {
	const canvas = document.getElementById(CANVAS_ID)
	if (canvas == null) {
		console.error(`\`<canvas id="${CANVAS_ID}">\` element missing.`)
		return
	}
	if (!(canvas instanceof HTMLCanvasElement)) {
		console.error(
			`\`<tag id="${CANVAS_ID}">\` element must be a \`<canvas>\` element.`,
		)
		return
	}

	const gl = canvas.getContext("webgl")
	if (gl == null) {
		console.error(
			`WebGL rendering context could not be created. Make sure that WebGL is supported by your browser.`,
		)
		return
	}

	gl.enable(gl.DEPTH_TEST)

	const sphereShaderProgram = initShaderProgram(gl, SPHERE_VSHADER_SOURCE, SPHERE_FSHADER_SOURCE)
	const pointShaderProgram = initShaderProgram(gl, POINTS_VSHADER_SOURCE, POINTS_FSHADER_SOURCE)

	if (sphereShaderProgram == null || pointShaderProgram == null) return
	
	// The `distance` is passed through the `options` object when drawing the
	// scene, so that it can be used to set the distance between the camera and
	// the sphere. This handler allows you to scroll up/down to zoom out/in.
	let distance = INITIAL_DISTANCE
	canvas.addEventListener("wheel", (ev) => {
		distance += ev.deltaY / 300
		if (distance > MAX_DISTANCE) distance = MAX_DISTANCE
		if (distance < MIN_DISTANCE) distance = MIN_DISTANCE		
	})

	// Like `distance`, the degrees to which we want to rotate the sphere about
	// the axes is also passed via the `options` object. The following variables
	// and event listeners track "dragging" events and update the rotations 
	// accordingly.
	let rotationMatrix = mat4()
	let dragging = false
	let lastPosition = { x: 0, y: 0, z: 0 }
	let momentum = 0
	let axisOfRotation = [ 0, 0, 0 ]
	canvas.addEventListener("mousedown", (ev) => {
		dragging = true
		lastPosition.x = ev.clientX
		lastPosition.y = ev.clientY
		momentum = 0
	})
	canvas.addEventListener("mousemove", (ev) => {
		if (!dragging) return

		let displacement = [
			ev.clientX - lastPosition.x, 
			-1 * (ev.clientY - lastPosition.y)
		]
		
		lastPosition.x = ev.clientX
		lastPosition.y = ev.clientY

		// The axis of rotation must be orthogonal to the displacement vector.
		// The magnitude is irrelevant.
		let axis = [
			-1 * displacement[1],
			displacement[0],
			0
		]

		// The angle of rotation (i.e., how much we rotate, in degrees) is just
		// arbitrarily proportional to the distance dragged.
		let angle = 
			Math.sqrt(displacement[0] * displacement[0] + displacement[1] * displacement[1])
			/ distance

		// With these factors, we can construct a new transformation matrix and
		// add it onto the existing one.
		rotationMatrix = mult(rotate(angle, axis), rotationMatrix)

		// these outer variables are set so that we can track the momentum,
		// which we use in for `mouseup` or `mouseleave` events.
		axisOfRotation = axis
		momentum = angle 	
	})
	/** 
	 * This function conserves a decreasing momentum so that when the user stops
	 * dragging, the sphere continues spinning before slowing to a halt. Any time
	 * they click down again (to start dragging) the momentum is reset to zero.
	 * 
	 * You can disable this behavior by just setting the `FRICTION` to `1`.
	 * 
	 * @type {EventListener} */
	const preserveMomentum = ev => {
		if (!dragging) return

		dragging = false
				
		let interval = setInterval(() => {
			momentum *= 1 - FRICTION
			rotationMatrix = mult(rotate(momentum, axisOfRotation), rotationMatrix)

			if (momentum <= 0.001) {
				momentum = 0
				clearInterval(interval)
			}
		}, 1000 / 60)
	}
	canvas.addEventListener("mouseup", preserveMomentum)
	canvas.addEventListener("mouseleave", preserveMomentum)

	/**
	 * The main rendering loop. If we were very concerned with performance, we
	 * could get rid of this and then just re-render whenever something actually
	 * happens (i.e., in the event listeners). But this is easier!
	 * 
	 *  @type {FrameRequestCallback} */
	const render = () => {
		renderScene(
			gl, makeSphere(SPHERE_DIVISIONS), pointShaderProgram, sphereShaderProgram,
			{
				rotate: rotationMatrix,
				distance
			}
		)
		requestAnimationFrame(render)
	}
	requestAnimationFrame(render)
}

/**
 * 
 * @param {WebGLRenderingContext} gl 
 * @param {Sphere} sphere
 * @param {WebGLProgram} pointShaderProgram
 * @param {WebGLProgram} sphereShaderProgram
 * @param {Options | null} options
*/
function renderScene(gl, sphere, pointShaderProgram, sphereShaderProgram, options = null) {
	// If the canvas is offscreen, don't bother.
	if (gl.canvas instanceof OffscreenCanvas) {
		return
	}

	// Set/validate the default options.
	if (options == null) {
		options = {
			rotate: mat4(),
			distance: 6
		}
	}
	if (options.rotate == undefined) options.rotate = mat4()
	if (options.distance == undefined) options.distance = 6
	if (options.distance > MAX_DISTANCE) options.distance = MAX_DISTANCE
	if (options.distance < MIN_DISTANCE) options.distance = MIN_DISTANCE

	// Clear the canvas.
	gl.clearColor(0, 0, 0, 1)
	gl.clearDepth(1.0)
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

	// Locations of attributes and uniforms in the shaders.
	const loc = {
		points: {
			aVertexPosition: gl.getAttribLocation(pointShaderProgram, "aVertexPosition"),
			uModelViewMatrix: gl.getUniformLocation(pointShaderProgram, "uModelViewMatrix"),
			uProjectionMatrix: gl.getUniformLocation(pointShaderProgram, "uProjectionMatrix")
		},
		sphere: {
			aVertexPosition: gl.getAttribLocation(sphereShaderProgram, "aVertexPosition"),
			uModelViewMatrix: gl.getUniformLocation(sphereShaderProgram, "uModelViewMatrix"),
			uProjectionMatrix: gl.getUniformLocation(sphereShaderProgram, "uProjectionMatrix")
		},
	}

	// Create the perspective projection matrix. 
	// `perspective` is from `lib/MV.js`
	const projectionMatrix = perspective(
		45, 											// 45 degree field of view 
		gl.canvas.clientWidth / gl.canvas.clientHeight, // aspect ratio
		0.1, 											// the distance to the near clipping plane
		100 											// the distance to the far clipping plane
	)

	// Create the model view matrix, which factors in rotations and distance 
	// (along the z-axis), based on the `options` argument.
	// The functions used here are from `lib/MV.js`
	let modelViewMatrix = mat4()
	modelViewMatrix = mult(options.rotate, modelViewMatrix)
	modelViewMatrix = mult(translate(0, 0, -1 * options.distance), modelViewMatrix)

	// Draw the sphere.
	gl.useProgram(sphereShaderProgram)

	gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()) // buffer for distinct vertices
	gl.bufferData(gl.ARRAY_BUFFER, sphere.vertices, gl.STATIC_DRAW)
	gl.vertexAttribPointer(loc.points.aVertexPosition, 3, gl.FLOAT, false, 0, 0)
	gl.enableVertexAttribArray(loc.points.aVertexPosition)

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer()) // buffer for indices
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, sphere.indices, gl.STATIC_DRAW)

	gl.uniformMatrix4fv(
		loc.sphere.uProjectionMatrix,
		false,
		flatten(projectionMatrix),
	)
	gl.uniformMatrix4fv(
		loc.sphere.uModelViewMatrix,
		false,
		flatten(modelViewMatrix),
	)

	gl.drawElements(gl.TRIANGLES, sphere.indices.length, gl.UNSIGNED_SHORT, 0)

	// Draw the points.
	gl.useProgram(pointShaderProgram)

	gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
	gl.bufferData(gl.ARRAY_BUFFER, sphere.vertices, gl.STATIC_DRAW)
	gl.vertexAttribPointer(loc.points.aVertexPosition, 3, gl.FLOAT, false, 0, 0)
	gl.enableVertexAttribArray(loc.points.aVertexPosition)

	gl.uniformMatrix4fv(
		loc.points.uProjectionMatrix,
		false,
		flatten(projectionMatrix),
	)
	gl.uniformMatrix4fv(
		loc.points.uModelViewMatrix,
		false,
		flatten(modelViewMatrix),
	)

	gl.drawArrays(gl.POINTS, 0, sphere.vertices.length)
}

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
		   console.error(`An error occurred compiling the shaders:\n${gl.getShaderInfoLog(shader)}`)
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
		   `Unable to initialize the shader program:\n${gl.getProgramInfoLog(shaderProgram)}`)
	   return null
   }

   return shaderProgram
}

/**
 * Generates the vertices for a sphere, as well as the indices of its triangles.
 * 
 * @param {number} sphereDivisions The number of subdivisions along the latitude
 * and longitude.
 * @returns {Sphere}
 */
function makeSphere(sphereDivisions) {
	
	const positions = []
	for (let j = 0; j <= sphereDivisions; j++) {
		let circleRadius = Math.sin(j * Math.PI / sphereDivisions)
		let yComponent = Math.cos(j * Math.PI / sphereDivisions)
		for (let i = 0; i <= sphereDivisions; i++) {
			let xComponent = Math.sin(i * 2 * Math.PI / sphereDivisions)
			let zComponent = Math.cos(i * 2 * Math.PI / sphereDivisions)
			positions.push(xComponent * circleRadius)
			positions.push(yComponent) 					
			positions.push(zComponent * circleRadius) 
		}
	}

	const indices = []
	for (let j = 0; j < sphereDivisions; j++) {
		for (let i = 0; i < sphereDivisions; i++) {
			let corner1 = j * (sphereDivisions + 1) + i
			let corner2 = corner1 + (sphereDivisions + 1)

			indices.push(corner1)
			indices.push(corner2)
			indices.push(corner1 + 1)

			indices.push(corner1 + 1)
			indices.push(corner2)
			indices.push(corner2 + 1)
		}
	}

	return {
		vertices: new Float32Array(positions),
		indices: new Uint16Array(indices)
	}
}

main()


