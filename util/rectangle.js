// @ts-check
/// <reference path="./types.d.ts" />
/// <reference path="../lib_types/MV.d.ts" />

/**
 * Defines the vertices of a rectangle in 3D space. This function does not
 * offer full control. Instead, the following conditions are presumed:
 * - The rectangle is set along, and parallel to, a line defined by `axis` and
 *  the origin.
 * - The front and back faces are squares.
 * 
 * @param {number[]} axis A coordinate that defines the
 * axis along which the rectangle travels. An imaginary line is drawn from the
 * `axis` to the origin, and the rectangle is presumed to travel that line.
 * @param {number} distance The distance between the rectangle's center and 
 * the origin.
 * @param {number} length The length of the rectangle. The sides (i.e., not the
 * front and back) are `length * height` rectangles. The lengthwise side of the
 * rectangle is parallel to the `axis`.
 * @param {number} height the height of the rectangle. The height defines the
 * squares for the front and back faces. I.e., the faces that are normal to the
 * `axis`.
 * 
 * @returns {Rectangle} An array containing the vertices of the rectangle
 * such that the first three elements represent the x, y, and z coordinates 
 * of the first vertex, the next three represent the second vertex, and so on.
 */
function rectangle(axis, distance, length, height) {
	const centerPoint = normalize(axis).map(x => x * distance)

	// Below, we define some "forwards," "upwards," "leftwards," etc. Note that
	// The distinction between the anti-parallel directions (e.g., left- and
	// right-wards) is arbitrary. Calling them one or the other just helps
	// to think about the rectangle we're making.
	const backwards = normalize(axis).map(x => x * length / 2)
	const forwards = backwards.map(x => -x)
	// The following is a formula to guarantee that `upwards` is orthogonal to
	// `forwards`.
	let upwards
	if (axis[0] == 0 && axis[1] == 0) {
		upwards = [height / 2, 0, 0]
	} else {
		upwards = normalize(cross(forwards, [0, 0, 1])).map(x => x * height / 2)
	}
	const downwards = upwards.map(x => -x)
	// Now the cross product of `upwards` and `forwards` is orthogonal to both 
	// of them. We'll call this `leftwards`.
	const leftwards = normalize(cross(upwards, forwards)).map(x => x * height / 2)
	const rightwards = leftwards.map(x => -x)

	const vertices = [
		[centerPoint, forwards, leftwards, upwards].reduce(add),
		[centerPoint, forwards, leftwards, downwards].reduce(add),		
		[centerPoint, forwards, rightwards, upwards].reduce(add),
		[centerPoint, forwards, rightwards, downwards].reduce(add),
		[centerPoint, backwards, leftwards, upwards].reduce(add),
		[centerPoint, backwards, leftwards, downwards].reduce(add),		
		[centerPoint, backwards, rightwards, upwards].reduce(add),
		[centerPoint, backwards, rightwards, downwards].reduce(add)
	]

	// let outputStr = ""
	// vertices.forEach(([x, y, z]) => {
	// 	outputStr += `(${x}, ${y}, ${z})\n`
	// })
	// console.log(outputStr)

	const indices = [
		// front face
		0, 1, 2,  2, 1, 3,
		
		// back face
		4, 6, 5,  6, 7, 5,
	
		// left face
		0, 4, 1,  1, 4, 5,
	
		// right face
		2, 3, 6,  3, 7, 6,
	
		// top face
		0, 2, 4,  2, 6, 4,
	
		// bottom face
		1, 5, 3,  3, 5, 7
	]

	return {
		vertices: new Float32Array(vertices.flat()),
		indices: new Uint16Array(indices.flat())
	}
}
