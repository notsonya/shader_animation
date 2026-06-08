#ifdef GL_FRAGMENT_PRECISION_HIGH
	precision highp float;
#else
	precision mediump float;
#endif

varying vec2 v_texcoord;
uniform vec4 u_block[4];

uniform sampler2D u_texture;

//
// GLSL textureless classic 3D noise "cnoise",
// with an RSL-style periodic variant "pnoise".
// Author:  Stefan Gustavson (stefan.gustavson@gmail.com)
// Version: 2024-11-07
//
// Many thanks to Ian McEwan of Ashima Arts for the
// ideas for permutation and gradient selection.
//
// Copyright (c) 2011 Stefan Gustavson. All rights reserved.
// Distributed under the MIT license. See LICENSE file.
// https://github.com/stegu/webgl-noise
//

vec3 mod289(vec3 x)
{
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 mod289(vec4 x)
{
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x)
{
  return mod289(((x*34.0)+10.0)*x);
}

vec4 taylorInvSqrt(vec4 r)
{
  return 1.79284291400159 - 0.85373472095314 * r;
}

vec3 fade(vec3 t) {
  return t*t*t*(t*(t*6.0-15.0)+10.0);
}

// Classic Perlin noise
float noise(vec3 P)
{
  vec3 Pi0 = floor(P); // Integer part for indexing
  vec3 Pi1 = Pi0 + vec3(1.0); // Integer part + 1
  Pi0 = mod289(Pi0);
  Pi1 = mod289(Pi1);
  vec3 Pf0 = fract(P); // Fractional part for interpolation
  vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.yy, Pi1.yy);
  vec4 iz0 = Pi0.zzzz;
  vec4 iz1 = Pi1.zzzz;

  vec4 ixy = permute(permute(ix) + iy);
  vec4 ixy0 = permute(ixy + iz0);
  vec4 ixy1 = permute(ixy + iz1);

  vec4 gx0 = ixy0 * (1.0 / 7.0);
  vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
  gx0 = fract(gx0);
  vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
  vec4 sz0 = step(gz0, vec4(0.0));
  gx0 -= sz0 * (step(0.0, gx0) - 0.5);
  gy0 -= sz0 * (step(0.0, gy0) - 0.5);

  vec4 gx1 = ixy1 * (1.0 / 7.0);
  vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
  gx1 = fract(gx1);
  vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
  vec4 sz1 = step(gz1, vec4(0.0));
  gx1 -= sz1 * (step(0.0, gx1) - 0.5);
  gy1 -= sz1 * (step(0.0, gy1) - 0.5);

  vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
  vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
  vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
  vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
  vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
  vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
  vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
  vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

  vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
  vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));

  float n000 = norm0.x * dot(g000, Pf0);
  float n010 = norm0.y * dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
  float n100 = norm0.z * dot(g100, vec3(Pf1.x, Pf0.yz));
  float n110 = norm0.w * dot(g110, vec3(Pf1.xy, Pf0.z));
  float n001 = norm1.x * dot(g001, vec3(Pf0.xy, Pf1.z));
  float n011 = norm1.y * dot(g011, vec3(Pf0.x, Pf1.yz));
  float n101 = norm1.z * dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
  float n111 = norm1.w * dot(g111, Pf1);

  vec3 fade_xyz = fade(Pf0);
  vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
  vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
  float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x); 
  return 2.2 * n_xyz;
}

mat4 rotation3d(vec3 axis, float angle) {
  axis = normalize(axis);
  float s = sin(angle);
  float c = cos(angle);
  float oc = 1.0 - c;

  return mat4(
    oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
    oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
    oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
    0.0,                                0.0,                                0.0,                                1.0
  );
}

float star(vec3 pos, float size, int points, float roundness, float time)
{
	pos = (rotation3d(normalize(vec3(0.3, 0.8, 0.1)), time) * vec4(pos, 1.0)).xyz;
	
	// star shape
	vec2 p = pos.xy;
	float angle = atan(p.y, p.x);
	float radius = length(p);
	
	//star pattern
	float numPoints = float(points);
	float a = mod(angle, 2.0 * 3.14159 / numPoints) - 3.14159 / numPoints;
	float innerRadius = size * 0.4;
	float outerRadius = size;
	
	// Distance from center to star edge at this angle
	float starRadius = mix(outerRadius, innerRadius, (cos(a * numPoints) + 1.0) * 0.5);
	
	// 3D extrusion
	float dist2D = radius - starRadius;
	vec3 q = vec3(dist2D, pos.z, 0.0);
	
	return length(q) - roundness;
}


float scene_sdf(vec3 pos, float time)
{
	float noise = noise(pos * 2.0) * 0.2;
	float shape = star(pos + vec3(noise), 0.4, 5, 0.08, time);
	
	return shape;
}



vec3 calc_normal(vec3 pos, float time)
{
	vec2 e = vec2(0.0001, 0.0);
	return normalize(vec3(
		scene_sdf(pos + e.xyy, time) - scene_sdf(pos - e.xyy, time),
		scene_sdf(pos + e.yxy, time) - scene_sdf(pos - e.yxy, time),
		scene_sdf(pos + e.yyx, time) - scene_sdf(pos - e.yyx, time)));
}

float cast_ray(vec3 ray_origin, vec3 ray_dir, float time)
{
	float t = 0.0;
	for (int i = 0; i < 100; i++) {
		vec3 pos = ray_origin + t * ray_dir;
		float dist = scene_sdf(pos, time);
		t += dist;
		if (t > 20.0 || dist < 0.001)
			break;
	}
	if (t > 20.0) t = -1.0;
	return t;
}

void main()
{
	vec2 mouse_position = u_block[0].xy;
	float time = u_block[0].z;
	vec2 screen_dimensions = u_block[1].xy;

	float screen_aspect_ratio = screen_dimensions.x / screen_dimensions.y;

	vec2 texcoords = v_texcoord;

	vec2 ndc_coords = (texcoords * 2.0 - 1.0) * vec2(screen_aspect_ratio, 1.0);
	float focal_length = 1.0 + 2.0 * (sin(time * 1.0) * 0.5 + 0.5);

	vec3 colour = vec3(1.0);

	vec3 ray_origin = vec3(0.0, 0.0, -1.0);
	vec3 ww = normalize(-ray_origin);
	vec3 uu = normalize(cross(ww, vec3(0.0, 1.0, 0.0)));
	vec3 vv = normalize(cross(uu, ww));
	vec3 ray_dir = normalize(ndc_coords.x * uu + ndc_coords.y * vv + focal_length * ww);

	float t = cast_ray(ray_origin, ray_dir, time);

	if (t > 0.0) {
		vec3 pos = ray_origin + t * ray_dir;
		vec3 norm = calc_normal(pos, time) * 0.5 + vec3(0.5);
		colour.rgb = texture2D(u_texture, norm.xy).rgb;
	}


	gl_FragColor = vec4(colour, 1.0);
}

