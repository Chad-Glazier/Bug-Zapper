// @ts-check
/// <reference path="./lib_types/MV.d.ts" />
/// <reference path="./util/types.d.ts" />
/// <reference path="./shaders.js" />
/// <reference path="./util/sphere.js" />
/// <reference path="./util/initShaderProgram.js" />
/// <reference path="./util/renderScene.js" />
/// <reference path="./constants.js" />

let paused = true
/** @type {Array<Bug>} */
let bugs = []
/** @type {Array<DyingBug>} */
let dyingBugs = []
let score = 0
let health = 100
/** @type {Array<Projectile>} */
let projectiles = []

/**
 * 
 * @param {number} newScore 
 */
function setScore(newScore) {
	score = newScore
	const scoreElement = document.getElementById("score")
	if (scoreElement == null) return
	scoreElement.innerHTML = Math.round(score).toString()
}

function main() {
	const canvas = document.getElementById(CANVAS_ID);
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

	const pointShaderProgram = initShaderProgram(
		gl,
		POINTS_VSHADER_SOURCE,
		POINTS_FSHADER_SOURCE,
	)
	const sphereShaderProgram = initShaderProgram(
		gl, 
		SPHERE_VSHADER_SOURCE, 
		SPHERE_FSHADER_SOURCE
	)
	const rectangleShaderProgram = initShaderProgram(
		gl,
		RECTANGLE_VSHADER_SOURCE,
		RECTANGLE_FSHADER_SOURCE
	)

	if (pointShaderProgram == null) return
	if (sphereShaderProgram == null) return
	if (rectangleShaderProgram == null) return

	// The `distance` is passed through the `options` object when drawing the
	// scene, so that it can be used to set the distance between the camera and
	// the sphere. This handler allows you to scroll up/down to zoom out/in.
	let distance = INITIAL_DISTANCE;
	canvas.addEventListener("wheel", (ev) => {
		if (paused) return

		distance += ev.deltaY / 300;
		if (distance > MAX_DISTANCE) distance = MAX_DISTANCE
		if (distance < MIN_DISTANCE) distance = MIN_DISTANCE
	})

	// Like `distance`, the degrees to which we want to rotate the sphere about
	// the axes is also passed via the `options` object. The following variables
	// and event listeners track "dragging" events and update the rotations
	// accordingly.
	let rotationMatrix = mat4()
	rotationMatrix = mult(rotate(90, [1, 0, 0]), rotationMatrix)
	rotationMatrix = mult(rotate(23.45, [0, 0, 1]), rotationMatrix)
	let dragging = false
	let lastPosition = { x: 0, y: 0, z: 0 }
	let momentum = 0
	let axisOfRotation = [0, 0, 0]
	canvas.addEventListener("mousedown", (ev) => {
		if (paused) return

		dragging = true
		lastPosition.x = ev.clientX
		lastPosition.y = ev.clientY
		momentum = 0
	})
	canvas.addEventListener("mousemove", (ev) => {
		if (paused) return

		if (!dragging) return


		const canvasLength = Math.max(canvas.clientWidth, canvas.clientHeight)

		let displacement = [
			(ev.clientX - lastPosition.x) / canvasLength,
			-1 * (ev.clientY - lastPosition.y) / canvasLength,
		]
		

		lastPosition.x = ev.clientX
		lastPosition.y = ev.clientY

		// The axis of rotation must be orthogonal to the displacement vector.
		// The magnitude is irrelevant.
		let axis = [
			-1 * displacement[1],
			displacement[0],
			0,
		]

		// The angle of rotation (i.e., how much we rotate, in degrees) is just
		// arbitrarily proportional to the distance dragged and inversely
		// proportional to the distance between the camera and the sphere.
		let angle = Math.sqrt(
			displacement[0] * displacement[0] +
			displacement[1] * displacement[1],
		) * 360 * DRAG_ROTATION_SENSITIVITY

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
	const preserveInertia = (ev) => {
		if (paused) return

		if (!dragging) return

		dragging = false

		let interval = setInterval(() => {
			momentum *= 1 - FRICTION;
			rotationMatrix = mult(
				rotate(momentum, axisOfRotation),
				rotationMatrix,
			)

			if (momentum <= 0.001) {
				momentum = 0;
				clearInterval(interval)
			}
		}, 1000 / 60)
	}
	canvas.addEventListener("mouseup", preserveInertia)
	canvas.addEventListener("mouseleave", preserveInertia)

	// I noticed that, for whatever reason, right-clicking the canvas (bringing
	// up the context menu) always blew up the WebGL stuff. So I just disabled
	// it here.
	canvas.addEventListener("contextmenu", (ev) => {
		if (ev.button == 2) { // "if right mouse button"
			ev.preventDefault()
			return false
		}
	}, false)

	window.addEventListener("keydown", (ev) => {
		if (ev.key == "Escape" || ev.key == "p") {
			togglePauseMenu()
		}
	})

	let latestProjectileTimestamp = 0
	window.addEventListener("keydown", (ev) => {
		if (paused) return

		if (ev.key === " ") {
			if ((Date.now() - latestProjectileTimestamp) / 1000 >= CANNON_COOLDOWN) {
				const relativeAxis = transform([transpose(rotationMatrix)], [0, 0, 1])
				const radialDistance = distance
				const newProjectile = {relativeAxis, radialDistance}

				projectiles.push(newProjectile)
				latestProjectileTimestamp = Date.now()

				setTimeout(() => {
					const bugsHit = bugs.filter(bug => hitBug(newProjectile, bug))
	
					if (bugsHit.length == 0) {
						setScore(score + SCORE_SETTINGS.missedShot)
						return
					}

					setScore(score + SCORE_SETTINGS.landedShot)
					const highestBugHit = bugsHit.reduce((bug1, bug2) => {
						if (bug1.elevation > bug2.elevation) {
							return bug1
						} else {
							return bug2
						}
					})
					bugs = bugs.filter(bug => bug != highestBugHit)
					dyingBugs.push({
						...highestBugHit,
						deathTime: Date.now(),
						innerArcLength: 0,
						color: DYING_BUG_COLOR
					})
				}, (newProjectile.radialDistance - 0.9) / PROJECTILE_SPEED * 1000)
			}
			ev.preventDefault()
			ev.stopPropagation()
		}
	})

	const activeKeyRotationEvents = new Set()
	window.addEventListener("keydown", (ev) => {
		if (paused) return
		// Most clients seem to repeatedly send the "keydown" event when the
		// key is held, but we don't want that behavior. This prevents those
		// redundant events from stacking up.
		if (activeKeyRotationEvents.has(ev.key)) return

		const rpm = KEY_ROTATION_SENSITIVITY

		const rotationControls = [
			{
				keys: ["ArrowRight", "d"],
				rotationAxis: [0, 1, 0],
				rotationDirection: -1
			},
			{
				keys: ["ArrowLeft", "a"],
				rotationAxis: [0, 1, 0],
				rotationDirection: +1
			},
			{
				keys: ["ArrowDown", "s"],
				rotationAxis: [1, 0, 0],
				rotationDirection: -1
			},
			{
				keys: ["ArrowUp", "w"],
				rotationAxis: [1, 0, 0],
				rotationDirection: +1
			}
		]

		for (const {keys, rotationAxis, rotationDirection} of rotationControls) {
			if (!keys.includes(ev.key)) {
				continue
			}

			keys.forEach(key => activeKeyRotationEvents.add(key))

			momentum = 0

			const secondsPerInterval = 1 / 60 	// 60 Hz
			const spinning = setInterval(() => {
				if (paused) {
					clearInterval(spinning)
					window.removeEventListener("keyup", stopHandler)
					keys.forEach(key => activeKeyRotationEvents.delete(key))
					return
				}

				rotationMatrix = mult(
					rotate(
						rpm * (secondsPerInterval / 60) * 360 * rotationDirection, 
						rotationAxis
					), 
					rotationMatrix
				)
			}, 1000 * secondsPerInterval) 

			/** @type {(ev: KeyboardEvent) => void} */
			const stopHandler = (ev) => {
				if (!keys.includes(ev.key)) {
					return
				}
				clearInterval(spinning)
				window.removeEventListener("keyup", stopHandler)
				keys.forEach(key => activeKeyRotationEvents.delete(key))
			}
			window.addEventListener("keyup", stopHandler)
		}
	})

	//
	// Below, we deal with pause menu stuff
	//

	let inAnimation = false

	function togglePauseMenu() {
		if (inAnimation) return
		inAnimation = true
		const menu = document.getElementById("menu")
		if (menu == null) {
			return
		}
		if (paused) {
			setTimeout(() => {
				paused = false
				inAnimation = false
			}, 400)
			menu.style.setProperty("top", "calc(100vh + 50px)")	
		} else {
			paused = true
			menu.style.setProperty("top", "calc(50vh - 0.5 * clamp(400px, 60%, 600px)")
			setTimeout(() => {
				inAnimation = false
			})
		}
	}
	
	const playButton = document.getElementById("play")
	
	playButton?.addEventListener("click", togglePauseMenu)
	
	const restartButton = document.getElementById("restart")
	
	restartButton?.addEventListener("click", () => {
		togglePauseMenu()
		setScore(0)
		health = 100
		bugs = []
		projectiles = []
		rotationMatrix = mat4()
		rotationMatrix = mult(rotate(90, [1, 0, 0]), rotationMatrix)
		rotationMatrix = mult(rotate(23.45, [0, 0, 1]), rotationMatrix)	})

	/**
	 * Determines whether or not a given bug is included in the projectile's
	 * trajectory.
	 *  
	 * @param {Projectile} projectile
	 * @param {Bug} bug
	 * @returns {boolean} `true` if the bug is in the projectile's path, and
	 * `false` otherwise.
	 */
	function hitBug(projectile, bug) {
		let projectileLocalCoordinates = transform(
			[transpose(bug.rotationMatrix)], 
			normalize(projectile.relativeAxis)
		)
		let projectileLocalPolarAngle = Math.acos(projectileLocalCoordinates[2])
		if (projectileLocalPolarAngle > bug.arcLength) {
			return false
		}
		return true
	}
	

	//
	// Below, we do the main rendering stuff.
	//
	let prevTime = Date.now()
	let secondsSinceLastBug = 0
	/**
	 * The main rendering loop. If we were very concerned with performance, we
	 * could get rid of this and then just re-render whenever something actually
	 * happens (i.e., in the event listeners). But this is easier!
	 *
	 *  @type {FrameRequestCallback} */
	const render = () => {
		let currentTime = Date.now()
		let secondsElapsed = (currentTime - prevTime) / 1000
		if (paused) {
			prevTime += secondsElapsed * 1000
			secondsElapsed = 0
		} else {
			prevTime = currentTime
		}

		setScore(score + secondsElapsed * SCORE_SETTINGS.perSecond)

		// grow all bugs (up to `Math.PI`, which would envelope the entire sphere)
		bugs = bugs.map((bug, idx) => {
			if (bug.arcLength < Math.PI) {
				bug.arcLength += BUG_GROWTH_RATE * secondsElapsed
			}
			bug.elevation = (1 + idx) * BUG_ELEVATION_GAP
			return bug
		})

		// check if it's time to make a new bug.
		if (secondsSinceLastBug >= 1 / BUG_SPAWN_FREQUENCY && bugs.length < BUG_CAPACITY) {
			secondsSinceLastBug = 0
			let bugRotation = mat4()
			bugRotation = mult(rotate(Math.random() * 360, [1, 0, 0]), bugRotation)
			bugRotation = mult(rotate(Math.random() * 360, [0, 1, 0]), bugRotation)
			bugRotation = mult(rotate(Math.random() * 360, [0, 0, 1]), bugRotation)
			bugs.push({
				rotationMatrix: bugRotation,
				arcLength: 0,
				color: [Math.random(), Math.random(), Math.random(), 1],
				elevation: bugs.length,
				spawnTime: Date.now() 
			})
		} else {
			secondsSinceLastBug += secondsElapsed
		}

		// progress the projectiles.
		projectiles = projectiles.map(projectile => {
			projectile.radialDistance -= PROJECTILE_SPEED * secondsElapsed
			return projectile
		})

		// delete any projectiles that've hit the sphere.
		projectiles = projectiles.filter(projectile => projectile.radialDistance >= 0.9)

		// grow the inner arc of any dying bugs.
		dyingBugs = dyingBugs.map(bug => {
			if (bug.innerArcLength < bug.arcLength) {
				bug.innerArcLength += BUG_DEATH_SPEED * secondsElapsed
			}
			return bug
		})

		// remove any fully-dead bugs.
		dyingBugs = dyingBugs.filter(bug => bug.innerArcLength < bug.arcLength)

		renderScene(
			gl,
			sphere(SPHERE_DIVISIONS),
			pointShaderProgram,
			sphereShaderProgram,
			rectangleShaderProgram,
			bugs,
			dyingBugs,
			projectiles,
			{
				rotate: rotationMatrix,
				distance,
			},
		);
		requestAnimationFrame(render)
	};
	requestAnimationFrame(render)
}

main()
