// @ts-check
/// <reference path="./types.d.ts" />
/// <reference path="./renderScene.js" />
/// <reference path="../lib_types/MV.d.ts" />

/**
 * Instances of this class store the state of a game. Methods are included to
 * advance the state of the game and render it in the grapics context.
 */
class GameState {
	/**
	 * Constructs a new game state.
	 * 
	 * @param {WebGLRenderingContext} renderingContext the WebGL rendering
	 * context on which the game will be rendered.
	 * @param {ShaderPrograms} shaders the shader programs necessary to render
	 * the game.
	 * @param {GameOptions} options an object containing a long list of optional 
	 * game settings.
	 */
	constructor(renderingContext, shaders, options) {
		/** 
		 * The (living) bugs in the game.
		 * 
		 * @private
		 * @type {Bug[]}
		 */
		this.bugs = []

		/**
		 * The (dying) bugs in the game.
		 * 
		 * @private
  		 * @type {DyingBug[]}
		 */
		this.dyingBugs = []

		/**
		 * The projectiles in the game.
		 * 
		 * @private
		 * @type {Projectile[]}
		 */
		this.projectiles = []

		/**
		 * The WebGL rendering context the game should be rendered on.
		 * 
		 * @public
		 * @readonly
		 * @type {WebGLRenderingContext}
		 */
		this.renderingContext = renderingContext

		/**
		 * A collection of shader programs used in rendering the game.
		 * 
		 * @private
		 * @type {ShaderPrograms}
		 */
		this.shader = shaders

		/**
		 * The radius of the base sphere.
		 * 
		 * @private
		 * @type {number}
		 */
		this.baseSphereRadius = options.baseSphereRadius

		/**
		 * The base sphere for the game. This is the sphere at the "center"
		 * where the bugs spawn.
		 * 
		 * @private
		 * @type {Sphere}
		 */
		this.baseSphere = sphere(
			SPHERE_DIVISIONS, { radialDistance: this.baseSphereRadius }
		)

		/**
		 * The rotation matrix that defines the orientation of the game
		 * objects when being rendered.
		 * 
		 * @private
		 * @type {number[][]}
		 */
		this.rotation = mat4()
		this.rotation = mult(rotate(90, [1, 0, 0]), this.rotation)
		this.rotation = mult(rotate(23.45, [0, 0, 1]), this.rotation)

		/**
		 * The distance between the camera and the center of the base sphere.
		 * 
		 * @private
		 * @type {number}
		 */
		this.distance = options.startingDistance

		/**
		 * The minimum allowed distance between the camera and the center of
		 * the base sphere.
		 * 
		 * @private
		 * @type {number}
		 */
		this.minDistance = options.minDistance

		/**
		 * The maximum allowed distance between the camera and the center of
		 * the base sphere.
		 * 
		 * @private
		 * @type {number}
		 */
		this.maxDistance = options.maxDistance

		/**
		 * The number of times that the game is re-rendered per second. You
		 * could also call this the frames per second.
		 * 
		 * @private
		 * @type {number}
		 */
		this.refreshRate = options.refreshRate

		/**
		 * Stores the game time in milliseconds.
		 * 
		 * @private
		 * @type {number}
		 */
		this.time = 0

		/**
		 * Stores the rotational momentum of the sphere. Note that momentum
		 * is fixed until it is otherwise changed, as opposed to the sphere's
		 * `inertia` which decreases over time as a function of friction.)
		 * 
		 * @private
		 * @type {{ axis: number[], rpm: number }}
		 */
		this.momentum = { axis: [0, 0, 1], rpm: 0 }

		/**
		 * Stores the rotational inertia of the sphere. Note that the inertia
		 * of the sphere decreases over time as a function of friction.
		 * 
		 * The inertia of the sphere is not meant to add to or replace the 
		 * momentum. It's function is to store the inertia of the sphere when 
		 * user input is no longer fixing the momentum. For example, if you 
		 * bind a certain key to set the momentum of the sphere, when the user 
		 * presses the key you would set the momentum to the appropriate value.
		 * When the user later releases that key, you will set the inertia to 
		 * match the momentum, then set the momentum to zero. This will let the 
		 * sphere continue to spin after it was "released," with the friction 
		 * gradually slowing it to a halt.
		 * 
		 * @private
		 * @type {{ axis: number[], rpm: number }}
		 */
		this.inertia = { axis: [0, 0, 1], rpm: 0}

		/**
		 * Defines the coefficient of friction used to decrease the sphere's
		 * rotational inertia over time. This does not affect the `momentum`.
		 * 
		 * @private
		 * @type {number}
		 */
		this.frictionCoefficient = options.frictionCoefficient

		/**
		 * Defines the speed of the projectiles in terms of units per second.
		 * 
		 * @private
		 * @type {number}
		 */
		this.projectileSpeed = options.projectileSpeed

		/**
		 * Defines the growth rate of the bugs in terms of arc length (radians)
		 * per second.
		 * 
		 * @private
		 * @type {number}
		 */
		this.bugGrowthRate = options.bugGrowthRate

		/**
		 * Defines the growth rate of the dying bugs' inner radius, in terms of 
		 * arc length (radians) per second.
		 * 
		 * @private
		 * @type {number}
		 */
		this.bugDeathRate = options.bugDeathRate

		/**
		 * Stores the current game score.
		 * 
		 * @private
		 * @type {number}
		 */
		this.score = 0

		/**
		 * Defines the settings for how score is changed by certain events.
		 * 
		 * @private
		 * @type {ScoreSettings}
		 */
		this.scoreSettings = options.scoreSettings

		/**
		 * Defines the elevation gap between each bug. This should be a
		 * positive value to avoid overlapping polygons.
		 * 
		 * @private
		 * @type {number}
		 */
		this.bugElevationGap = options.bugElevationGap

		/**
		 * Stores the (game) time when the last bug was spawned.
		 * 
		 * @private
		 * @type {number}
		 */
		this.timeOfLastBug = 0

		/**
		 * How many bugs should spawn per second.
		 * 
		 * @private
		 * @type {number}
		 */
		this.bugSpawnFrequency = options.bugSpawnFrequency

		/**
		 * Determines the minimum number of seconds allowed between cannon 
		 * shots.
		 * 
		 * @private
		 * @type {number}
		 */
		this.cannonCooldown = options.cannonCooldown

		/**
		 * Stores the `time` at which the most recent cannon shot was fired.
		 * 
		 * @private
		 * @type {number}
		 */
		this.timeOfLastProjectile = 0

		/**
		 * Marks whether or not time should pass in the game.
		 * 
		 * @private
		 * @type {boolean}
		 */
		this.paused = false

		/**
		 * Maps game events like `"pause"`, `"unpause"`, and `"score"` to their
		 * registered event listener(s).
		 * 
		 * @private
		 * @type {Map<string, Array<(event: GameEvent) => void>>}
		 */
		this.listeners = new Map()

		/**
		 * Stores the ID of the main game loop, which is a `setInterval`
		 * function. This can be used to terminate the main game loop with
		 * `clearInterval(this.gameLoop)`.
		 * 
		 * @private
		 * @type {number}
		 */
		this.gameLoop = NaN

		/**
		 * How sensitive the sphere should be to rotations induced by dragging
		 * it.
		 * 
		 * @private
		 */
		this.dragRotationSensitivity = options.dragRotationSensitivity

		/**
		 * Defines an upper limit on the number of bugs allowed at any one 
		 * time.
		 */
		this.bugCapacity = options.bugCapacity

		/**
		 * Determines the color of dying bugs.
		 */
		this.dyingBugColor = options.dyingBugColor

		/**
		 * Determines the RPM used for rotations by holding down keys.
		 */
		this.keyRotationRPM = options.keyRotationRPM
	}

	/**
	 * Draws the scene.
	 * 
	 * @private
	 */
	render() {
		renderScene(
			this.renderingContext,
			this.baseSphere,
			this.shader.point,
			this.shader.sphere,
			this.shader.rectangle,
			this.bugs,
			this.dyingBugs,
			this.projectiles, 
			{
				rotate: this.rotation,
				distance: this.distance
			}
		)
	}

	/**
	 * Advances the internal clock by the specified number of milliseconds,
	 * updating the game state as necessary. I.e.,this advances the 
	 * projectiles, grows the bugs, rotates the sphere if it has momentum or
	 * inertia, etc.
	 * 
	 * This function does *not* re-render the game.
	 * 
	 * @private
	 * @param {number} milliseconds the number of milliseconds to advance the 
	 * game clock by.
	 */
	advanceTime(milliseconds) {
		this.time += milliseconds
		const seconds = milliseconds / 1000
		const minutes = seconds / 60
		const originalScore = this.score

		// Increment score (if set)
		this.score += this.scoreSettings.perSecond * seconds

		// Apply rotation based on the current rotational momentum.
		this.rotation = mult(
			rotate(360 * this.momentum.rpm * minutes, this.momentum.axis),
			this.rotation
		)

		// Apply rotation based on the current rotational inertia.
		if (this.momentum.rpm == 0 && this.inertia.rpm > 0) {
			this.rotation = mult(
				rotate(360 * this.inertia.rpm * minutes, this.inertia.axis),
				this.rotation
			)
			this.inertia.rpm *= (1 - this.frictionCoefficient)
		}

		// Advance the projectiles.
		this.projectiles = this.projectiles.map(projectile => {
			projectile.radialDistance -= this.projectileSpeed * seconds
			return projectile
		})

		// Spawn a new bug if necessary.
		const secondsSinceLastBug = (this.time - this.timeOfLastBug) / 1000
		const bugSpawnCooldown = 1 / this.bugSpawnFrequency
		if (secondsSinceLastBug >= bugSpawnCooldown && this.bugs.length < this.bugCapacity) {
			this.timeOfLastBug = this.time
			let bugRotation = mat4()
			bugRotation = mult(rotate(Math.random() * 360, [1, 0, 0]), bugRotation)
			bugRotation = mult(rotate(Math.random() * 360, [0, 1, 0]), bugRotation)
			bugRotation = mult(rotate(Math.random() * 360, [0, 0, 1]), bugRotation)
			this.bugs.push({
				rotationMatrix: bugRotation,
				arcLength: 0,
				color: [Math.random(), Math.random(), Math.random(), 1],
				elevation: this.bugs.length,
				spawnTime: this.time
			})
		}

		// Grow the bugs and set their elevation to avoid overlap.
		this.bugs = this.bugs.map((bug, i) => {
			const increment = this.bugGrowthRate * seconds
			if (bug.arcLength + increment <= Math.PI) {
				bug.arcLength += increment
			} else {
				bug.arcLength = Math.PI
			}
			bug.elevation = (i + 1) * this.bugElevationGap
			return bug
		})

		// Grow the inner arc length of the dying bugs. If any of them are
		// fully dead, delete them from the game.
		this.dyingBugs.map(bug => {
			bug.innerArcLength += this.bugDeathRate * seconds
		})
		this.dyingBugs = this.dyingBugs.filter(({ innerArcLength, arcLength}) => {
			return innerArcLength < arcLength
		})

		// Check for collisions.
		const collidingProjectiles = this.projectiles.filter(({ radialDistance }) => {
			return radialDistance <= this.baseSphereRadius
		})
		for (let projectile of collidingProjectiles) {
			this.projectiles = this.projectiles.filter(el => el != projectile)
			const bugsHit = this.bugs.filter(bug => willCollide(projectile, bug))
			if (bugsHit.length == 0) {
				this.score += this.scoreSettings.missedShot
				continue
			}
			this.score += this.scoreSettings.landedShot
			const targetBug = bugsHit.reduce((bug1, bug2) => {
				if (bug1.elevation > bug2.elevation) {
					return bug1
				}
				return bug2
			})
			this.bugs = this.bugs.filter(el => el != targetBug)
			this.dyingBugs.push({
				...targetBug,
				deathTime: this.time,
				innerArcLength: 0,
				color: this.dyingBugColor
			})
		}

		if (this.score != originalScore) {
			this.handleEvent("score")
		}
	}

	/**
	 * Launches a projectile if allowed by the cooldown.
	 * 
	 * @public
	 */
	launchProjectile() {
		if (this.paused) return

		const secondsSinceLastShot = (this.time - this.timeOfLastProjectile) / 1000
		if (secondsSinceLastShot < this.cannonCooldown) {
			return
		}

		this.timeOfLastProjectile = this.time

		this.projectiles.push({
			relativeAxis: transform([transpose(this.rotation)], [0, 0, 1]),
			radialDistance: this.distance
		})
	}

	/**
	 * Sets the sphere's rotational momentum.
	 * 
	 * @public
	 * @param {number[]} axis Defines the axis of rotation for the new 
	 * rotational momentum.
	 * @param {number} rpm Defines the rotations per minute for the new
	 * rotational momentum.
	 */
	setMomentum(axis, rpm) {
		if (this.paused) return

		this.momentum = { axis, rpm }
	}

	/**
	 * Retrieve's the current rotational momentum.
	 * 
	 * @returns {{ axis: number[], rpm: number }}
	 */
	getMomentum() {
		return this.momentum
	}

	/**
	 * Applies a rotation directly to the game's current rotation matrix,
	 * ignoring time.
	 * 
	 * @public
	 * @param {number[]} axis Defines the axis of rotation.
	 * @param {number} angle Defines the number of degrees to rotate about
	 * the axis.
	 */
	applyRotation(axis, angle) {
		this.momentum.rpm = 0
		this.inertia.rpm = 0

		this.rotation = mult(
			rotate(angle, axis),
			this.rotation
		)
	}

	/**
	 * Sets the rotational inertia of the sphere.
	 * 
	 * @param {number[]} axis The axis about which the sphere should rotate. 
	 * @param {number} rpm The number of rotations per minute.
	 */
	setInertia(axis, rpm) {
		this.inertia = { axis, rpm }
	}

	/**
	 * Registers a listener for certain game events.
	 * 
	 * @public
	 * @param {GameEventType} event The type of game event to listen for.
	 * @param {(event: GameEvent) => void} handler the callback function to 
	 * emit on occurrences of the specified event.
	 * @returns {(event: GameEvent) => void} a reference to the event handler.
	 */
	on(event, handler) {
		let handlers = this.listeners.get(event)
		if (handlers === undefined) {
			handlers = []
		}
		handlers.push(handler)
		this.listeners.set(event, handlers)
		return handler
	}

	/**
	 * Disables an event listener.
	 * 
	 * @public
	 * @param {GameEventType} event The type of game event to disable an event
	 * listener for.
	 * @param {(event: GameEvent) => void} handler A reference to the event
	 * handler to disable.
	 * @returns {void}
	 */
	disableListener(event, handler) {
		let handlers = this.listeners.get(event)
		if (handlers === undefined) {
			return
		}
		if (handlers.length == 0) {
			return
		}
		this.listeners.set(event, handlers.filter(el => el != handler))
	}

	/**
	 * Executes the associated game event handlers.
	 * 
	 * @private
	 * @param {GameEventType} eventType The type of game event to handle. E.g.,
	 * `"pause"`, `"unpause"`, etc.
	 */
	handleEvent(eventType) {
		const callbacks = this.listeners.get(eventType)
		if (callbacks === undefined) {
			return
		}

		const totalBugArea = this.bugs
			.map(({ arcLength }) => 
				sphereSurfaceArea(arcLength, this.baseSphereRadius)
			)
			.reduce((a, b) => a + b, 0)
		const baseSphereArea = 4 * Math.PI * Math.pow(this.baseSphereRadius, 2)
		const coverage = Math.min(totalBugArea / baseSphereArea, 1)

		let continuePropagation = true
		const eventObject = {
			score: this.score,
			coverage,
			stopPropagation: () => {
				continuePropagation = false
			}
		}

		for (const callback of callbacks) {
			callback(eventObject)
			if (!continuePropagation) {
				break
			}
		}
	}

	/**
	 * Pauses the game and executes any callback functions registered via the
	 * `on("pause", ...)` method.
	 * 
	 * @public
	 */
	pause() {
		this.paused = true
		this.handleEvent("pause")
	}

	/**
	 * Unpauses the game and executes any callback functions registered via the
	 * `on("unpause", ...)` method.
	 * 
	 * @public
	 */
	unpause() {
		this.paused = false
		this.handleEvent("unpause")
	}

	/**
	 * 
	 * @returns {boolean} `true` if the game is paused, `false` otherwise.
	 */
	get isPaused() {
		return this.paused
	}

	/**
	 * Starts the game. 
	 * 
	 * @public
	 */
	start() {
		const millisecondInterval = 1 / this.refreshRate * 1000

		this.render()

		let lastTime = Date.now()
		this.gameLoop = setInterval(() => {
			if (this.paused) {
				lastTime = Date.now()
				return
			}
			this.advanceTime(Date.now() - lastTime)
			lastTime = Date.now()
			this.render()
		}, millisecondInterval)
	}

	/**
	 * Restarts the game.
	 * 
	 * @public
	 */
	restart() {
		this.end()

		this.bugs = []
		this.dyingBugs = []
		this.projectiles = []
		this.rotation = mat4()
		this.rotation = mult(rotate(90, [1, 0, 0]), this.rotation)
		this.rotation = mult(rotate(23.45, [0, 0, 1]), this.rotation)
		this.time = 0
		this.momentum = { axis: [0, 0, 1], rpm: 0 }
		this.inertia = { axis: [0, 0, 1], rpm: 0}
		this.score = 0
		this.timeOfLastBug = 0
		this.timeOfLastProjectile = 0
		this.paused = false
		this.gameLoop = NaN

		this.handleEvent("score")
		this.handleEvent("health")

		this.start()
	}

	/**
	 * Ends the game.
	 * 
	 * @public
	 */
	end() {
		clearInterval(this.gameLoop)
	}

	/**
	 * Describes the current distance between the camera and the center of the
	 * base sphere with a number from `0` to `1`, where `0` is maximally zoomed
	 * out, and `1` is maximally zoomed in.
	 * 
	 * @public
	 */
	get zoom() {
		return (this.distance - this.minDistance) / (this.maxDistance - this.minDistance)
	}
	/**
	 * @public
	 * @param newZoom
	 */
	set zoom(newZoom) {
		if (newZoom > 1) newZoom = 1
		if (newZoom < 0) newZoom = 0
		this.distance = this.minDistance + newZoom * (this.maxDistance - this.minDistance)
	}

	/**
	 * How responsive the sphere is to rotations induced by dragging it with
	 * the mouse.
	 * 
	 * @public
	 */
	get dragSensitivity() {
		return this.dragRotationSensitivity
	}

	get keySensitivity() {
		return this.keyRotationRPM
	}
}

/**
 * Determines whether or not a given bug is included in the projectile's
 * trajectory.
 *  
 * @param {Projectile} projectile
 * @param {Bug} bug
 * @returns {boolean} `true` if the bug is in the projectile's path, and
 * `false` otherwise.
 */
function willCollide(projectile, bug) {
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

/**
 * Given a partial sphere (such as one of the bugs) that is defined by a
 * radial distance and a polar angle interval, this function calculates its
 * surface area (not volume).
 * 
 * @param {number} polarMax The interval of the polar angle is [0, `polarMax`].
 * angle.
 * @param {number} radialDistance The radial distance of the sphere.
 * @returns {number} The surface area of the partial sphere.
 */
function sphereSurfaceArea(polarMax, radialDistance) {
	/*
	(I explain the formula below. The math terms are in LaTeX.)

	Recall that the differential surface area of a sphere is:
	$dS = \rho^2 \sin\phi d\phi d\theta$, where $\rho$ is the radial distance,
	$\phi$ is the polar angle, and $\theta$ is the azimuthal angle. We assume
	that the azimuthal interval is $[0, 2 \pi]$ (the full interval), and so
	we can integrate 
	$\int_{0}^{2\pi}\int_{0}^{\phi_\text{max}}\rho^2\sin\phi d\phi d\theta$
	which simplifies to
	$2\pi\rho^2 (1 - \cos \phi_\text{max}).$

	*/ 
	return 2 * Math.PI * Math.pow(radialDistance, 2) * (1 - Math.cos(polarMax))
}
