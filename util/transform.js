// @ts-check

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
	const dotProduct = (u, v) => u
		.map((_, i) => u[i] * v[i])
		.reduce((a, b) => a + b) 

	let v = vec.map(x => x)
	transformations.reverse()
	if (v.length == 3) v.push(0)
	for (const transformation of transformations) {
		if (transformation.length != v.length) {
			console.log(`Matrix-vector multiplication not allowed, wrong sizes:\nMatrix:\n${transformation}\nVector:\n${v}`)
			return v.map(() => NaN)
		}
		v = transformation.map(row => dotProduct(row, v))
	}
	if (vec.length == 3) v.pop()

	return v
}
