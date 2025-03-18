/**
 * Represents a 4x4 matrix.
 */
declare class Matrix4 {
    elements: Float32Array;

    constructor(opt_src?: Matrix4);

    setIdentity(): this;

    set(src: Matrix4): this;

    concat(other: Matrix4): this;
    multiply(other: Matrix4): this;

    multiplyVector3(pos: Vector3): Vector3;

    multiplyVector4(pos: Vector4): Vector4;

    transpose(): this;

    setInverseOf(other: Matrix4): this;
}

/**
 * Represents a 3x1 column vector.
 */
declare class Vector3 {
    elements: Float32Array;
    constructor();
}

/**
 * Represents a 4x1 column vector.
 */
declare class Vector4 {
    elements: Float32Array;
    constructor();
}
