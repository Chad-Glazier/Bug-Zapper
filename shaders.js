// @ts-check

const POINTS_VSHADER_SOURCE = `

attribute vec3 aVertexPosition;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

void main() {
	gl_PointSize = 1.5;
	gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aVertexPosition, 1.0);
}

`

const POINTS_FSHADER_SOURCE = `

void main() {
	gl_FragColor = vec4(1, 1, 1, 1.0);
}

`

const SPHERE_VSHADER_SOURCE = `

attribute vec4 aVertexPosition;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

void main() {
	gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
}

`

const SPHERE_FSHADER_SOURCE = `

void main() {
	gl_FragColor = vec4(0.12, 0.12, 0.12, 1.0);
}

`
