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

/**
 * Defines some options to customize how a sphere will look. The terminology is
 * basedon the spherical coordinate system:
 * https://en.wikipedia.org/wiki/Spherical_coordinate_system 
 */
declare type SphereOptions = {
	/**
	 * Defines the distance between the center of the sphere and any point on 
	 * its surface.
	 */
	radialDistance?: number

	/**
	 * Defines the interval of the polar angle.
	 * - If the interval would be broader than `Math.PI`, then it is set to
	 * 	`[0, Math.PI]`.
	 * - You can technically have the first value be the upper bound and vice
	 * 	versa. It doesn't make a difference.
	 * 
	 * The polar angle coordinate defines the angle that each circle
	 * perpendicular to the xy-plane will make relative to the positive z-axis.
	 * In practice, this angle can define a cone.
	 * 
	 * To make a cone with the top quarter of the sphere, you could specify 
	 * that
	 * ```
	 * 	polarInterval: [0, Math.PI / 4]
	 * ```  
	 * 
	 * To make a hemisphere with the top half, you could specify
	 * ```
	 * 	polarInterval: [0, Math.PI / 2]
	 * ```
	 * 
	 * To make a full sphere, you would would just set
	 * ```
	 * 	polarInterval: [0, Math.PI]
	 * ```
	 */
	polarInterval?: [number, number]

	/**
	 * Defines the interval of the azimuthal angle.
	 * - If the interval would be broader than `2 * Math.PI`, then it is set to
	 * 	`[0, 2 * Math.PI]`.
	 * - You can technically have the first value be the upper bound and vice
	 * 	versa. It doesn't make a difference.
	 * 
	 * The azimuthal angle coordinate defines the angle that each circle
	 * perpendicular to the z-axis will make relative to the positive x-axis.
	 * In practice, this angle can define a wedge. 
	 * 
	 * To make a wedge with a quarter of the sphere, you could specify that
	 * ```
	 * 	azimuthalInterval: [0, Math.PI / 2]
	 * ```  
	 * In terms of the xy-plane, this wedge would be the portion of the sphere
	 * that fits in the first quadrant.
	 * 
	 * To make a hemisphere, you could instead say
	 * ```
	 * 	azimuthalInterval: [0, Math.PI]
	 * ```
	 * In terms of the xy-plane, this hemisphere would cover the first and
	 * second quadrants; i.e., all points on the sphere where the y-values are
	 * positive.
	 * 
	 * To make a full sphere, you would would just set
	 * ```
	 * 	azimuthalInterval: [0, 2 * Math.PI]
	 * ```
	 */
	azimuthalInterval?: [number, number]

	/**
	 * When making spheres, the number of divisions typically defines how many
	 * vertices each circle will have. However, by restricting the azimuth 
	 * and/or polar intervals, you can create wedges and cones. Such shapes may
	 * not need the same number of longitudal divisions as latitudal, and vice
	 * versa. When this value is `true`, these divisions are scaled to fit such
	 * shapes proportionally.
	 */
	scaleDivisions?: boolean
}

declare type Bug = {
	/**
	 * A (fixed) rotation matrix used to determine where the bug should be
	 * centered on the surface of the base sphere.
	 */
	rotationMatrix: number[][]
	arcLength: number
	color: [number, number, number, number]

	/**
	 * The elevation of the bug above the base sphere.
	 */
	elevation: number

	/**
	 * The `Date.now()` timestamp when the bug was spawned.
	 */
	spawnTime: number
}

declare type Projectile = {
	/**
	 * A (fixed) axis, calculated by the rotation at the time of firing, that
	 * determines the line along which the projectile will travel.
	 * 
	 * The line between this axis and the origin defines the trajectory of the
	 * projectile.
	 */
	relativeAxis: number[]

	/**
	 * The distance between the projectile and the origin
	 */
	radialDistance: number
}

declare type Rectangle = {
	vertices: Float32Array
	indices: Uint16Array
}

declare type DyingBug = Bug & {
	deathTime: number
	innerArcLength: number
}
