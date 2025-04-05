// @ts-check
/// <reference path="../lib_types/MV.d.ts" />
/// <reference path="./types.d.ts" />
/// <reference path="./Projectile.js" />

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
		normalize(projectile.position).map((x) => x * (1 + bug.elevation)),
	)
	projectileLocalCoordinates[2] = Math.max(
		-1,
		Math.min(1, projectileLocalCoordinates[2]),
	)
	let projectileLocalPolarAngle = Math.acos(projectileLocalCoordinates[2])
	if (projectileLocalPolarAngle >= bug.arcLength) {
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

/**
 * Apply matrix transformation(s) to a vector.
 *
 * @param {number[][][]} transformations The transformations to apply to the
 * vector. The transformations will be applied in the order of right-to-left,
 * so the last element will by applied first. This matrix will be mutated
 * (reversed).
 * @param {number[]} vec The vector to which the transformations are applied.
 * The vector will not be mutated by this function.
 */
function transform(transformations, vec) {
	/** @type {(u: number[], v: number[]) => number} */
	const dotProduct = (u, v) =>
		u
			.map((_, i) => u[i] * v[i])
			.reduce((a, b) => a + b)

	let v = vec.map((x) => x)
	transformations.reverse()
	if (v.length == 3) v.push(0)
	for (const transformation of transformations) {
		if (transformation.length != v.length) {
			console.log(
				`Matrix-vector multiplication not allowed, wrong sizes:\nMatrix:\n${transformation}\nVector:\n${v}`,
			)
			return v.map(() => NaN)
		}
		v = transformation.map((row) => dotProduct(row, v))
	}
	if (vec.length == 3) v.pop()

	return v
}

/**
 * Transitions the text in an HTML element from one string to another over
 * time.
 *
 * @param {HTMLElement} element The element containing the text to change.
 * @param {string} target The text that will be left in the element after the
 * transition.
 * @param {number} duration The duration of the transition in milliseconds.
 * @returns {number} The interval ID so that the animation can be cancelled
 * early with `clearInterval()` if necessary.
 */
function transitionText(element, target, duration = 400) {
	let initial = element.innerText

	let currentArr = initial.split("")
	const targetArr = target.split("")
	const steps = Math.max(target.length, initial.length)

	let i = 0

	const interval = setInterval(() => {
		if (i > targetArr.length) {
			currentArr[i] = ""
		} else if (i > currentArr.length) {
			currentArr.push(targetArr[i])
		} else {
			currentArr[i] = targetArr[i]
		}

		element.innerText = currentArr.join("")
		i++
		if (i > steps) {
			clearInterval(interval)
		}
	}, duration / steps)

	return interval
}

/**
 * Creates the inverse of a perspective projection matrix.
 *
 * @param {number} fovy - The field of view in the y direction, in degrees.
 * @param {number} aspect - The aspect ratio (width/height) of the viewport.
 * @param {number} near - The distance to the near clipping plane.
 * @param {number} far - The distance to the far clipping plane.
 * @returns {number[][]} The inverse of a 4x4 perspective projection matrix.
 */
function inversePerspective(fovy, aspect, near, far) {
	fovy *= 2 * Math.PI / 360
	const f = 1 / Math.tan(fovy / 2)

	const invertedPerspective = mat4()
	invertedPerspective[0][0] = aspect / f
	invertedPerspective[1][1] = 1 / f
	invertedPerspective[2][3] = -1
	invertedPerspective[3][2] = (near - far) / (2 * far * near)
	invertedPerspective[3][3] = (near + far) / (2 * far * near)

	return invertedPerspective
}
