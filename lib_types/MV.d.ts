// Function to convert degrees to radians
declare function radians(degrees: number): number;

// Vector constructors
declare function vec2(...args: number[]): number[];
declare function vec3(...args: number[]): number[];
declare function vec4(...args: number[]): number[];

/**
 * Creates a 2x2 matrix.
 * 
 * @param args The elements to add to the matrix:
 * - if there is no argument, then am identity matrix is returned.
 * - if there is one argument `x`, then an identity matrix scaled by `x`
 * is returned.
 * - if there is more than one argument, then they are taken to be the elements
 * of the matrix enumerated left-to-right, top-to-bottom.
 */
declare function mat2(...args: number[]): number[][];

/**
 * Creates a 3x3 matrix.
 * 
 * @param args The elements to add to the matrix:
 * - if there is no argument, then am identity matrix is returned.
 * - if there is one argument `x`, then an identity matrix scaled by `x`
 * is returned.
 * - if there is more than one argument, then they are taken to be the elements
 * of the matrix enumerated left-to-right, top-to-bottom.
 */
declare function mat3(...args: number[]): number[][];

/**
 * Creates a 4x4 matrix.
 * 
 * @param args The elements to add to the matrix:
 * - if there is no argument, then an identity matrix is returned.
 * - if there is one argument `x`, then an identity matrix scaled by `x`
 * is returned.
 * - if there is more than one argument, then they are taken to be the elements
 * of the matrix enumerated left-to-right, top-to-bottom.
 */
declare function mat4(...args: number[]): number[][];

// Generic mathematical operations
declare function equal(u: any, v: any): boolean;
declare function add(u: any, v: any): any;
declare function subtract(u: any, v: any): any;
declare function mult(u: any, v: any): any;

/**
 * Generates a 4x4 translation matrix. That is, to translate a matrix `M` by
 * `[x, y, z]`, you could run:
 * 
 * ```
 * M = mult(translate(x, y, z), M)
 * ```
 * 
 * @param x the desired translation along the x axis. 
 * @param y the desired translation along the y axis.
 * @param z the desired translation along the z axis.
 * @returns the translation matrix.
 */
declare function translate(
	x: number | number[],
	y?: number,
	z?: number,
): number[][];

/**
 * Creates a 4x4 rotation matrix. I.e., to rotate a matrix `M` by `theta`
 * degrees about the axis represented by the vector `[x, y, z]`, you could 
 * run:
 * 
 * ```
 * M = mult(rotate(theta, [x, y, z]), M)
 * ```
 * 
 * @param angle the angle of the rotation, in degrees. Positive rotations 
 * are counterclockwise, negative are clockwise.
 * @param axis the axis about which the rotation will be performed. 
 * The magnitude of the axis is irrelevant.
 * @returns the rotation matrix.
 */
declare function rotate(angle: number, axis: number[]): number[][];
declare function scale(
	x: number | number[],
	y?: number,
	z?: number,
): number[][];

// ModelView matrix generators
declare function lookAt(eye: number[], at: number[], up: number[]): number[][];

// Projection matrix generator
declare function ortho(
	left: number,
	right: number,
	bottom: number,
	top: number,
	near: number,
	far: number,
): number[][];

/**
 * Creates a perspective projection matrix.
 *
 * @param {number} fovy - The field of view in the y direction, in degrees.
 * @param {number} aspect - The aspect ratio (width/height) of the viewport.
 * @param {number} near - The distance to the near clipping plane.
 * @param {number} far - The distance to the far clipping plane.
 * @returns {number[][]} A 4x4 perspective projection matrix.
 */
declare function perspective(
	fovy: number,
	aspect: number,
	near: number,
	far: number,
): [
	[number, number, number, number],
	[number, number, number, number],
	[number, number, number, number],
	[number, number, number, number]
];

// Matrix functions
declare function transpose(m: number[][]): number[][];

// Vector functions
declare function dot(u: number[], v: number[]): number;
declare function negate(u: number[]): number[];
declare function cross(u: number[], v: number[]): number[];

/**
 * Flattens the matrix into a `Float32Array`.
 * 
 * @param {number[][]} u the matrix to flatten.
 */
declare function flatten(u: number[][]): Float32Array

/**
 * Normalizes a vector.
 * 
 * @param u the vector to normalize.
 * @param excludeLastComponent set this to `true` to ignore the last
 * component. This can be useful when working with homogenous coordinates.
 * Defaults to `false`.
 * 
 * @returns A vector parallel to `u` with a magnitude of `1`.
 */
declare function normalize(u: number[], excludeLastComponent?: boolean): number[]

