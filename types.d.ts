declare type Sphere = {
	vertices: Float32Array
	indices: Uint16Array
}

declare type Options = {
	/**
	 * The rotation matrix for the sphere.
	 */
	rotate?: number[][]
	distance?: number
}
