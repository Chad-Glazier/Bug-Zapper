// @ts-check
/// <reference path="./lib_types/MV.d.ts" />
/// <reference path="./util/types.d.ts" />
/// <reference path="./shaders.js" />
/// <reference path="./util/sphere.js" />
/// <reference path="./util/initShaderProgram.js" />
/// <reference path="./util/renderScene.js" />
/// <reference path="./constants.js" />
/// <reference path="./util/GameState.js" />
/// <reference path="./util/ui.js" />

function main() {
	
	//
	// Set up the rendering context.
	//

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

	//
	// Set up the HTML user interface (i.e., the start menu, instructions,
	// the score display, etc.)
	//

	// menus
	const pauseMenu = document.getElementById("menu")
	// information cards
	const instructions = document.getElementById("instructions")
	// buttons
	const playButton = document.getElementById("play-button")
	const restartButton = document.getElementById("restart-button")
	const instructionsButton = document.getElementById("instructions-button")
	const returnButton = document.getElementById("return-button")
	const increaseDifficultyButton = document.getElementById("increase-difficulty-button")
	const decreaseDifficultyButton = document.getElementById("decrease-difficulty-button")
	// text displays
	const scoreDisplay = document.getElementById("score-display")
	const survivorDisplay = document.getElementById("survivor-display")
	const coverageDisplay = document.getElementById("coverage-display")
	const timeRemaining = document.getElementById("time-remaining-display")

	if (pauseMenu == null || instructions == null || playButton == null ||
		restartButton == null || increaseDifficultyButton == null ||
		decreaseDifficultyButton == null || scoreDisplay == null ||
		instructionsButton == null || returnButton == null || 
		survivorDisplay == null || coverageDisplay == null ||
		timeRemaining == null
	) {
		console.error(`One or more necessary elements were not found when setting up the UI.`)
		return
	}

	// create the UI object.
	const ui = new UI(
		{
			menu: {
				pause: pauseMenu
			},
			informationCard: {
				instructions: instructions
			},
			button: {
				play: playButton,
				restart: restartButton,
				increaseDifficulty: increaseDifficultyButton,
				decreaseDifficulty: decreaseDifficultyButton,
				instructions: instructionsButton,
				return: returnButton
			},
			textDisplay: {
				score: scoreDisplay,
				survivor: survivorDisplay,
				coverage: coverageDisplay,
				timeRemaining: timeRemaining
			}
		},
		{
			pauseMenu: {
				hidden: [
					["top", "calc(100vh + 50px)"]
				],
				shown: [
					["top", "calc(50vh - var(--menu-height) / 2)"]
				]			
			},
			infoPanel: {
				hidden: [
					["top", "calc(100vh + 50px)"]
				],
				shown: [
					["top", "calc(50vh - var(--info-panel-height) / 2)"]
				]
			}
		}
	)

	//
	// Set up the game.
	//

	const defaultOptions = {
		baseSphereRadius: 1,
		startingDistance: 5,
		maxDistance: 20,
		minDistance: 3,
		refreshRate: 60,
		frictionCoefficient: 0.15,
		projectileSpeed: 10,
		bugGrowthRate: Math.PI / 72,
		bugDeathRate: Math.PI / 2,
		scoreSettings: {
			missedShot: -50,
			landedShot: 100,
			perSecond: 1
		},
		bugElevationGap: 0.0032,
		enableInertia: true,
		bugSpawnFrequency: 0.65,
		cannonCooldown: 0.2,
		dragRotationSensitivity: 1.0,
		keyRotationRPM: 12,
		bugCapacity: 8,
		difficultyModifiers: {
			easy: 0.75,
			normal: 1.0,
			hard: 1.5,
			apocalypse: 2.0
		},
		dyingBugColor: [0.78, 0.24, 0.24, 1.0]
	}

	const shaders = {
		point: pointShaderProgram,
		sphere: sphereShaderProgram,
		rectangle: rectangleShaderProgram
	}

	let game = new GameState(gl, shaders, defaultOptions)

	//
	// Sync the UI's display with the game state.
	//

	game.on("score", ({ score }) => ui.score = score)
	// need to manage the game scores (survivors, coverage, etc.) and then
	// sync it to the displays.

	//
	// Set up some controls.
	//

	window.addEventListener("keydown", (ev) => {
		if (ev.key != "Escape") return

		if (game.isPaused && ui.instructionsVisible) {
			ui.hideInstructions(() => game.unpause())
		} else if (game.isPaused) {
			ui.hidePauseMenu(() => game.unpause())
		} else {
			game.pause()
			ui.showPauseMenu()
		}
	})

	ui.element.button.play.addEventListener("click", () => {
		if (!game.isPaused) {
			return
		}

		ui.hidePauseMenu(() => game.unpause())
	})

	ui.element.button.return.addEventListener("click", () => {
		ui.hideInstructions(() => ui.showPauseMenu())
	})

	ui.element.button.restart.addEventListener("click", () => {
		game.restart()
		game.pause()
		ui.hidePauseMenu(() => game.unpause())
	})

	ui.element.button.instructions.addEventListener("click", () => {
		ui.hidePauseMenu(() => ui.showInstructions())
	})

	canvas.addEventListener("wheel", (ev) => {
		if (game.isPaused) return

		game.zoom += ev.deltaY / 300 / 25
	})

	enableMouseDrag(game)

	enableKeyRotationControls(game)

	window.addEventListener("keydown", (ev) => {
		if (ev.key !== " ") return
		if (game.isPaused) return

		game.launchProjectile()

		ev.preventDefault()
	})

	//
	// Start the game
	//
	game.start()
	game.pause()
	ui.showPauseMenu()
}

/**
 * Set up the dragging functionality for sphere.
 * 
 * @param {GameState} game
 */
function enableMouseDrag(game) {
	const canvas = game.renderingContext.canvas

	if (canvas instanceof OffscreenCanvas) {
		return
	}

	let dragging = false
	let initialPosition = [0, 0]
	let initialTime = 0
	let lastRPM = 0
	let lastAxis = [0, 0, 0]

	canvas.addEventListener("mousedown", ({ clientX, clientY }) => {
		if (game.isPaused) return

		dragging = true
		initialPosition = [clientX, clientY]
		initialTime = Date.now()

		game.setMomentum([0, 0, 1], 0)
	})
	
	canvas.addEventListener("mousemove", ({ clientX, clientY}) => {
		if (game.isPaused) return
		if (!dragging) return

		const canvasLength = Math.max(canvas.clientWidth, canvas.clientHeight)

		// We calculate the displacement of the mouse.
		const [initialX, initialY] = initialPosition
		const [deltaX, deltaY] = [
			clientX - initialX,
			-1 * (clientY - initialY)
		]
		const magnitude = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
		if (magnitude === 0) return

		// By default, there is one half of a rotation per length of the canvas
		// dragged. The sensitivity setting is also factored in.
		const rotations = game.dragSensitivity * magnitude / (2 * canvasLength)

		// The axis of rotation ought to be orthogonal to the displacement
		// of the mouse in order to feel natural. It's magnitude is irrelevant.
		// Since we know that `deltaY` and `deltaX` are never both zero,
		// otherwise the "mousemove" event wouldn't be emitted in the first
		// place, this should work.
		const axisOfRotation = [-1 * deltaY, deltaX, 0]

		// Finally, we apply the rotation.
		game.applyRotation(axisOfRotation, rotations * 360)

		// Adjust the outer variables.
		const minutes = (Date.now() - initialTime) / 1000 / 60
		lastAxis = axisOfRotation
		lastRPM = rotations / minutes
		if (lastRPM == Infinity) lastRPM = 0
		initialPosition = [clientX, clientY]
		initialTime = Date.now()
	})

	canvas.addEventListener("mouseup", () => {
		if (!dragging) return

		dragging = false
		game.setInertia(lastAxis, lastRPM)
	})

	canvas.addEventListener("mouseleave", () => {
		if (!dragging) return

		dragging = false
		game.setInertia(lastAxis, lastRPM)
	})
}

/**
 * Sets the event listeners necessary to allow the user to rotate the sphere
 * with arrow keys / WASD.
 * 
 * @param {GameState} game 
 */
function enableKeyRotationControls(game) {
	const keyControls = [
		{
			keys: ["ArrowRight", "d"],
			dir: "right"
		},
		{
			keys: ["ArrowLeft", "a"],
			dir: "left"
		},
		{
			keys: ["ArrowDown", "s"],
			dir: "down"
		},
		{
			keys: ["ArrowUp", "w"],
			dir: "up"
		}
	]

	const activeKeyRotationEvents = new Set()
	const direction = {
		up: false,
		down: false,
		right: false,
		left: false,
	}

	const updateMomentum = () => {
		const originalMomentum = game.getMomentum()

		const { up, down, left, right } = direction
		let x = 0, y = 0
		if (up && !down) {
			x = 1
		}
		if (down && !up) {
			x = -1
		}
		if (left && !right) {
			y = 1
		}
		if (right && !left) {
			y = -1
		}
		if (x == 0 && y == 0) {
			game.setMomentum([0, 0, 1], 0)
			game.setInertia(originalMomentum.axis, originalMomentum.rpm)
		} else {
			game.setMomentum([x, y, 0], game.keyRotationRPM)
		}
	}

	window.addEventListener("keydown", ({ key }) => {
		if (game.isPaused) return
		if (activeKeyRotationEvents.has(key)) return

		game.setInertia([0, 0, 1], 0)

		for (const { keys, dir } of keyControls) {
			if (!keys.includes(key)) {
				continue
			}

			keys.forEach(k => activeKeyRotationEvents.add(k))
			direction[dir] = true
			updateMomentum()
		}
	})

	window.addEventListener("keyup",  ({ key }) => {
		if (!activeKeyRotationEvents.has(key)) return

		for (const { keys, dir } of keyControls) {
			if (!keys.includes(key)) {
				continue
			}

			keys.forEach(k => activeKeyRotationEvents.delete(k))
			direction[dir] = false
			updateMomentum()
		}
	})
}

main()
