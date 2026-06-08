let mouse_x = 0.0;
let mouse_y = 0.0;

const run = (assets) => {

	// Get the HTML5 canvas.
	const canvas = document.getElementById("main-canvas");

	// Init WebGL
	const gl = canvas.getContext("webgl2");
	gl.getExtension("OES_texture_float"); // Who are you OES???
	gl.getExtension("OES_texture_float_linear");


	// Create vertex data buffer.
	const vertex_buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);

	gl.bufferData(gl.ARRAY_BUFFER,
		4 * 4 * Float32Array.BYTES_PER_ELEMENT, // 4 Vertices of 5 32-bit floats each (x, y, r, g, b)
		gl.STATIC_DRAW);

	gl.bufferSubData(gl.ARRAY_BUFFER,
		0,
		new Float32Array([
			 1.0,  1.0, 1.0, 0.0,
			-1.0,  1.0, 0.0, 0.0,
			-1.0, -1.0, 0.0, 1.0,
			 1.0, -1.0, 1.0, 1.0,
		]));

	// Create indices buffer.
	const index_buffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);

	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
		6 * Uint16Array.BYTES_PER_ELEMENT, // 6 Indices of 16-bit uint each
		gl.STATIC_DRAW);
	gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER,
		0,
		new Uint16Array([
			0, 1, 2, 2, 3, 0
		]));




	// Create a texture.
	const texture = gl.createTexture();
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, texture);

	/*
	gl.texStorage2D(
		gl.TEXTURE_2D,
		1,
		gl.RGBA32F,
		2,
		2);
	gl.texSubImage2D(
		gl.TEXTURE_2D,
		0,
		0, 0,
		2, 2,
		gl.RGBA,
		gl.FLOAT,
		new Float32Array([
			1.0, 0.0, 0.0, 1.0,
			0.0, 0.0, 0.0, 1.0,
			0.0, 0.0, 0.0, 1.0,
			1.0, 0.0, 0.0, 1.0,
		]));
	*/
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB8, gl.RGB, gl.UNSIGNED_BYTE, 
		asset_lookup(assets, "image.jpeg"));


	const image = asset_lookup(assets, "image.jpeg");
	console.log(image);



	// Build the shader program.
	const shader_program = gl.createProgram();
	{
		const vertex_shader = gl.createShader(gl.VERTEX_SHADER);
		gl.shaderSource(vertex_shader, asset_lookup(assets, "shader.vert"));
		gl.compileShader(vertex_shader);
		gl.attachShader(shader_program, vertex_shader);

		const fragment_shader = gl.createShader(gl.FRAGMENT_SHADER);
		gl.shaderSource(fragment_shader, asset_lookup(assets, "shader.frag"));
		gl.compileShader(fragment_shader);
		gl.attachShader(shader_program, fragment_shader);

		gl.linkProgram(shader_program);

		if (!gl.getProgramParameter(shader_program, gl.LINK_STATUS)) {
			const vertErr = gl.getShaderInfoLog(vertex_shader);
			const fragErr = gl.getShaderInfoLog(fragment_shader);
			if (vertErr)
				console.error("Vertex shader error:\n\t" + vertErr);
			if (fragErr)
				console.error("Fragment shader error:\n\t" + fragErr);
			console.error("Shader linking error:\n\t" + gl.getProgramInfoLog(shader_program));
			return null;
		};
	}

	// Hook up shader attributes to views of the vertex data.

	const vertex_stride = 4 * Float32Array.BYTES_PER_ELEMENT;

	let offset = 0;

	const shader_attribute_location_a_pos = gl.getAttribLocation(shader_program, "a_pos");
	console.assert(shader_attribute_location_a_pos != -1);
	gl.enableVertexAttribArray(shader_attribute_location_a_pos);
	gl.vertexAttribPointer(shader_attribute_location_a_pos, 2, gl.FLOAT, false,
		vertex_stride,
		offset);

	offset += 2 * Float32Array.BYTES_PER_ELEMENT;

	const shader_attribute_location_a_texcoord = gl.getAttribLocation(shader_program, "a_texcoord");
	gl.enableVertexAttribArray(shader_attribute_location_a_texcoord);
	console.assert(shader_attribute_location_a_texcoord != -1);
	gl.vertexAttribPointer(shader_attribute_location_a_texcoord, 2, gl.FLOAT, false,
		vertex_stride,
		offset);

	// Use shader program and draw!
	gl.useProgram(shader_program);

	// Get the location of the uniforms in the shader...
	// ...we need this to tell the uniform data where to go.
	const uniform_location_block = gl.getUniformLocation(shader_program, "u_block");
	console.assert(uniform_location_block != null);

	const uniform_location_texture = gl.getUniformLocation(shader_program, "u_texture");

	// Cull faces that point away from us
	gl.frontFace(gl.CCW);
	gl.enable(gl.CULL_FACE);

	let mouse_x = 0;
	let mouse_y = 0;

	window.onmousemove = (e) => {
		const canvas_rect = canvas.getBoundingClientRect();
		mouse_x = e.clientX / canvas_rect.width;
		mouse_y = e.clientY / canvas_rect.height;
	};

	const draw = (currentTime) => {
		const canvas_rect = canvas.getBoundingClientRect();

		canvas.style.width = "100vw";
		canvas.style.height = "100vh";
		const pixel_ratio = window.devicePixelRatio || 1;
		canvas.width = Math.round(canvas_rect.width * pixel_ratio);
		canvas.height = Math.round(canvas_rect.height * pixel_ratio);

		// Send arrays of vec4s to the GPU.
		gl.uniform4fv(uniform_location_block, [
			mouse_x,
			mouse_y,
			currentTime / 1000,
			0.0,

			canvas.width,
			canvas.height,
			0.0,
			0.0,
		]);

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.uniform1i(uniform_location_texture, 0);

		gl.viewport(0, 0, canvas.width, canvas.height);
		gl.clearColor(0.0, 0.0, 0.0, 1.0);
		gl.clear(gl.COLOR_BUFFER_BIT);
		gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

		requestAnimationFrame(draw);
	}

	draw();

	requestAnimationFrame(draw);
};

const asset_lookup = (assets, path) => {
	for (let i = 0; i < assets.length; i++) {
		if (assets[i].path == path) {
			return assets[i].loaded_data;
		}
	}
	return null;
};

window.onload = () => {

	let assets = [
		{
			path: "shader.vert",
			loaded_data: null,
			type: "plaintext",
		},
		{
			path: "shader.frag",
			loaded_data: null,
			type: "plaintext",
		},
		{
			path: "image.jpeg",
			loaded_data: null,
			type: "image",
		}
	];

	const check_if_everything_is_loaded = () => {
		let yes = true;
		for (let j = 0; j < assets.length; j++) {
			if (assets[j].loaded_data == null) {
				yes = false;
				break;
			}
		}
		if (yes) {
			run(assets);
		}
	};

	for (let i = 0; i < assets.length; i++) {
		if (assets[i].type == "plaintext") {
			const request = new XMLHttpRequest();
			request.addEventListener("load", (e) => {
				assets[i].loaded_data = e.srcElement.responseText;
				check_if_everything_is_loaded();
			});
			request.open("GET", assets[i].path);
			request.send();
		} else if (assets[i].type == "image") {
			const image = new Image();
			image.src = assets[i].path;
			image.onerror = () => {
				console.error(assets[i].path);
			};
			image.onload = () => {
				assets[i].loaded_data = image;
				check_if_everything_is_loaded();
			};
		}
	}
}
