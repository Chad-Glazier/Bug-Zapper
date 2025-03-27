/**
 * This script, written for the Deno runtime, takes the `shaders/*.glsl` files
 * and bundles them into a single file, `shaders.js`, which declares a
 * constant for each of the files named based on the filename.
 * 
 * File names are converted to JavaScript constant identifies by converting all
 * characters to upper case, then adding the suffix `_SOURCE` in place of the
 * file extension.
 * 
 * E.g., if you make a file named `cube_fshader.glsl`, then this build script
 * will declare a constant named `CUBE_FSHADER_SOURCE` in the `shaders.js`
 * file.
 * 
 * Since this function requires read/write access it must be run with those
 * permissions flags as shown below.
 * 
 * ```
 * deno run --allow-read --allow-write ./scripts/build.ts
 * ```
 */
async function build(directoryName: string, outputFile: string) {
	const sourceFiles: string[] = []
	
	for await (const file of Deno.readDir(directoryName)) {
		if (file.isFile && file.name.endsWith(".glsl")) {
			sourceFiles.push(`${directoryName}/${file.name}`)
		}
	}

	let outputString = `// @ts-check
/// <reference path="./lib_types/MV.d.ts" />

/**
 * This file was created by running 
 * 
 * \`\`\`
 * deno --allow-read --allow-write ./scripts/build.ts
 * \`\`\`
 * 
 * All of the source code here corresponds to the files ending in \`.glsl\` that
 * were found in the \`./shaders\` directory.
 */

`

	// this will be used later
	const shaders: Map<string, string> = new Map()

	for (const filePath of sourceFiles) {
		const shaderSourceCode = await Deno.readTextFile(filePath)
		const pathParts = filePath.split("/")
		const fileName = pathParts[pathParts.length - 1]
		// the `.glsl` extension is five characters long
		const baseName = fileName.substring(0, fileName.length - 5)
		const newName = baseName.toUpperCase() + "_SOURCE"

		shaders.set(newName, shaderSourceCode)

		outputString += `const ${newName} = \`${shaderSourceCode}\`\n`
	}

	const encoder = new TextEncoder()
	Deno.writeFile(outputFile, encoder.encode(outputString))

	// // parse the types.
	// shaders.forEach((constantName, sourceCode) => {
	// 	const lines = sourceCode.split("\n")
		
		
	// 	for (const line of lines) {
	// 		if (!line.startsWith("attribute") && !line.startsWith("uniform")) {
	// 			continue
	// 		}

	// 		if (line.startsWith("attribute")) {

	// 		}

	// 	}
	// })
}

// function attribute

// function uniformMat4Template(name: string): string {
// 	return `
// 	/** 
// 	 * @param {[
// 	 * 	[number, number, number, number],
// 	 * 	[number, number, number, number],
// 	 * 	[number, number, number, number],
// 	 * 	[number, number, number, number],
// 	 * ]} matrix the new matrix to assign to the uniform value.
// 	set ${name}(matrix) {
// 		if (this.program == null) {
// 			${uncompiledProgramError("Could not assign uniform mat4 value")}
// 			return
// 		}
// 		this.context.uniformMatrix4fv(
// 			this.context.getUniformLocation(this.program, ${name}),
// 			false,
// 			flatten(matrix)
// 		)
// 	}
// 	`
// }

// function uncompiledProgramError(message: string): string {
// 	return `console.error(\`${message}: Program never compiled.\`)`
// }

build("shaders", "shaders.js")

