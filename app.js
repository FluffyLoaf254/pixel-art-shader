glMatrix = require('gl-matrix');
objLoader = require('webgl-obj-loader');

Promise.all([
    fetch('vertex.glsl').then(function (response) {
        return response.text();
    }),
    fetch('fragment.glsl').then(function (response) {
        return response.text();
    }),
    fetch('post_vertex.glsl').then(function (response) {
        return response.text();
    }),
    fetch('post_fragment.glsl').then(function (response) {
        return response.text();
    }),
    fetch('dragon.obj').then(function (response) {
        return response.text();
    }),
    new Promise(function (resolve) {
        var image = new Image();
        image.onload = () => {
            resolve(image);
        };
        image.src = 'dragon_texture.png';
    })
]).then(main);

function main(files) {
    const canvas = document.getElementById('webgl-canvas');
    const gl = canvas.getContext('webgl2');

    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.depthFunc(gl.LEQUAL);

    const shaderProgram = initShaderProgram(gl, files[0], files[1]);

    const programInfo = {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: 0,
            texCoord: 1,
            normal: 2,
        },
        uniformLocations: {
            modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
            projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
            lightDirection: gl.getUniformLocation(shaderProgram, 'uLightDirection'),
            smoothFactor: gl.getUniformLocation(shaderProgram, 'uSmoothFactor'),
            fixedLighting: gl.getUniformLocation(shaderProgram, 'uFixedLighting'),
        },
        mesh: new objLoader.Mesh(files[4]),
        texture: files[5],
    }

    const buffers = initBuffers(gl, programInfo);

    const postShaderProgram = initShaderProgram(gl, files[2], files[3]);

    const postProgramInfo = {
        program: postShaderProgram,
        attribLocations: {
            vertexPosition: 0,
            texCoord: 1,
        },
        uniformLocations: {
            canvasWidth: gl.getUniformLocation(postShaderProgram, 'uCanvasWidth'),
            canvasHeight: gl.getUniformLocation(postShaderProgram, 'uCanvasHeight'),
            colorTexture: gl.getUniformLocation(postShaderProgram, 'sColorTexture'),
            depthTexture: gl.getUniformLocation(postShaderProgram, 'sDepthTexture'),
        },
    }

    const postBuffers = initPostBuffers(gl);

    const textures = loadTextures(gl, programInfo);

    drawScene(gl, programInfo, buffers, postProgramInfo, postBuffers, textures);
}

function initShaderProgram(gl, vertexSource, fragmentSource) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fragmentSource);

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        console.log('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));

        return null;
    }

    return shaderProgram;
}

function loadShader(gl, type, source) {
    const shader = gl.createShader(type);

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.log('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);

        return null;
    }

    return shader;
}

function initBuffers(gl, programInfo) {
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(programInfo.mesh.vertices), gl.STATIC_DRAW);

    const texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(programInfo.mesh.textures), gl.STATIC_DRAW);

    const normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(programInfo.mesh.vertexNormals), gl.STATIC_DRAW);

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(programInfo.mesh.indices), gl.STATIC_DRAW);

    return {
        vertexBuffer: vertexBuffer,
        texCoordBuffer: texCoordBuffer,
        normalBuffer: normalBuffer,
        indexBuffer: indexBuffer,
    };
}

function initPostBuffers(gl) {
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

    const vertices = [
        -1.0, 1.0, 0.0,
        -1.0, -1.0, 0.0,
        1.0, 1.0, 0.0,
        1.0, -1.0, 0.0,
    ];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    const texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);

    const texCoords = [
        0, 1,
        0, 0,
        1, 1,
        1, 0,
    ];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 3]), gl.STATIC_DRAW);

    return {
        vertexBuffer: vertexBuffer,
        texCoordBuffer: texCoordBuffer,
        indexBuffer: indexBuffer,
    };
}

function loadTextures(gl, programInfo) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, 512, 512);

    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 512, 512, gl.RGBA, gl.UNSIGNED_BYTE, programInfo.texture);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    const framebufferTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, framebufferTexture);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 128, 128, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    const depthTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, depthTexture);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT16, 128, 128, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_SHORT, null);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    const framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, framebufferTexture, 0);

    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthTexture, 0);

    return {
        texture: texture,
        framebuffer: framebuffer,
        framebufferTexture: framebufferTexture,
        depthTexture: depthTexture,
    };
}

function drawScene(gl, programInfo, buffers, postProgramInfo, postBuffers, textures) {
    const projectionMatrix = glMatrix.mat4.create();

    const fieldOfView = 45 * Math.PI / 180;
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;

    glMatrix.mat4.perspective(projectionMatrix, fieldOfView, aspect, 0.1, 10.0);

    window.modelViewMatrix = glMatrix.mat4.create();

    glMatrix.mat4.translate(window.modelViewMatrix, window.modelViewMatrix, [0.0, -1.0, -3.5]);

    window.then = 0;

    drawFrame = (time) => {
        // convert time to seconds
        time *= 0.001;
        const deltaTime = time - window.then;

        if (deltaTime < 1.0 / 10.0) {
            requestAnimationFrame(drawFrame);
            return;
        }
        window.then = time;

        gl.useProgram(programInfo.program);

        gl.bindFramebuffer(gl.FRAMEBUFFER, textures.framebuffer);
        gl.viewport(0, 0, 128, 128);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const rotateSpeed = document.getElementById('rotate-speed').value;
        glMatrix.mat4.rotate(window.modelViewMatrix, window.modelViewMatrix, rotateSpeed * deltaTime, [0.0, 1.0, 0.0]);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, textures.texture);

        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.vertexBuffer);
        gl.vertexAttribPointer(
            programInfo.attribLocations.vertexPosition,
            3,
            gl.FLOAT,
            false,
            0,
            0
        );
        gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);

        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.texCoordBuffer);
        gl.vertexAttribPointer(
            programInfo.attribLocations.texCoord,
            2,
            gl.FLOAT,
            false,
            0,
            0
        );
        gl.enableVertexAttribArray(programInfo.attribLocations.texCoord);

        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normalBuffer);
        gl.vertexAttribPointer(
            programInfo.attribLocations.normal,
            3,
            gl.FLOAT,
            false,
            0,
            0
        )
        gl.enableVertexAttribArray(programInfo.attribLocations.normal);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indexBuffer);

        gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, window.modelViewMatrix);
        gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
        const xAmount = -document.getElementById('light-direction-x').value;
        const yAmount = -document.getElementById('light-direction-y').value;
        gl.uniform3fv(programInfo.uniformLocations.lightDirection, new Float32Array([xAmount, yAmount, 2]));
        const smoothFactor = document.getElementById('smooth-factor').value;
        gl.uniform1f(programInfo.uniformLocations.smoothFactor, smoothFactor);
        const fixedLight = document.getElementById('fixed-light').checked;
        gl.uniform1i(programInfo.uniformLocations.fixedLighting, fixedLight);

        gl.drawElements(gl.TRIANGLES, programInfo.mesh.indices.length, gl.UNSIGNED_SHORT, 0);

        gl.disableVertexAttribArray(programInfo.attribLocations.vertexPosition);
        gl.disableVertexAttribArray(programInfo.attribLocations.texCoord);
        gl.disableVertexAttribArray(programInfo.attribLocations.normal);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        gl.useProgram(postProgramInfo.program);

        gl.viewport(0, 0, gl.canvas.clientWidth, gl.canvas.clientHeight);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.uniform1i(postProgramInfo.uniformLocations.colorTexture, 0);
        gl.uniform1i(postProgramInfo.uniformLocations.depthTexture, 1);
        gl.uniform1f(postProgramInfo.uniformLocations.canvasWidth, 128.0);
        gl.uniform1f(postProgramInfo.uniformLocations.canvasHeight, 128.0);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, textures.framebufferTexture);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, textures.depthTexture);

        gl.bindBuffer(gl.ARRAY_BUFFER, postBuffers.vertexBuffer);
        gl.vertexAttribPointer(
            postProgramInfo.attribLocations.vertexPosition,
            3,
            gl.FLOAT,
            false,
            0,
            0
        );
        gl.enableVertexAttribArray(postProgramInfo.attribLocations.vertexPosition);

        gl.bindBuffer(gl.ARRAY_BUFFER, postBuffers.texCoordBuffer);
        gl.vertexAttribPointer(
            postProgramInfo.attribLocations.texCoord,
            2,
            gl.FLOAT,
            false,
            0,
            0
        );
        gl.enableVertexAttribArray(postProgramInfo.attribLocations.texCoord);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, postBuffers.indexBuffer);

        gl.drawElements(gl.TRIANGLE_STRIP, 4, gl.UNSIGNED_SHORT, 0);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.disableVertexAttribArray(postProgramInfo.attribLocations.vertexPosition);
        gl.disableVertexAttribArray(postProgramInfo.attribLocations.texCoord);

        requestAnimationFrame(drawFrame);
    };
    requestAnimationFrame(drawFrame);
}