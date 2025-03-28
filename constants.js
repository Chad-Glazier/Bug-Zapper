// @ts-check

/** The `id` of the `<canvas>` element in the HTML document. */
const CANVAS_ID = "gl-canvas"

/** The maximum distance between the camera and the base sphere. */
const MAX_DISTANCE = 20

/** The minimum distance between the camera and the base sphere. */
const MIN_DISTANCE = 3

/** The initial distance between the camera and the base sphere. */
const INITIAL_DISTANCE = 5

/** 
 * The perceived friction the sphere experiences when you "let go" of it.
 * Setting this to `1` will effectively remove all inertia, while `0` will
 * remove friction entirely.
 */
const FRICTION = 0.025

/** The number of divisions for each sphere. */
const SPHERE_DIVISIONS = 72

/** The color (RGBA) for the base sphere. */
const BASE_SPHERE_COLOR = [0.0, 0.0, 0.0, 1.0]

/** How many bugs spawn per second. */ 
const BUG_SPAWN_FREQUENCY = 0.65

/** How much the arc length for each bug increases per second. */
const BUG_GROWTH_RATE = Math.PI / 72

/** The maximum number of allowed bugs at one time. */
const BUG_CAPACITY = 8

/** 
 * The radial distance between each bug. The gaps must exist to prevent the
 * triangles from overlapping (which makes things look weird). By experimenting
 * a little, I landed on this number (with `SPHERE_DIVISIONS = 64`)
 */
const BUG_ELEVATION_GAP = 0.0032 // set this to 0.0018 if using 100 divisions

/**
 * The speed of the projectiles, in terms of units per second. Note that the
 * default size of the base sphere is `1.0`.
 */
const PROJECTILE_SPEED = 15

/**
 * Determines the cooldown for the projectile cannon in seconds.
 */
const CANNON_COOLDOWN = 0.2

/**
 * Defines the RPM of the sphere when holding down a key to rotate it.
 */
const KEY_ROTATION_SENSITIVITY = 12

/**
 * Defines the color of dying bugs.
 * 
 * @type {[number, number, number, number]}
 */
const DYING_BUG_COLOR = [0.78, 0.24, 0.24, 1.0]

/**
 * How quickly a bug dies (once hit). This number will be the amount that the
 * inner arc length increases per second.
 */
const BUG_DEATH_SPEED = Math.PI

const SCORE_SETTINGS = {
	missedShot: -50,
	landedShot: 100,
	perSecond: 1
}