export default class BloomShader {
    private sourceCanvas: HTMLCanvasElement;
    private displayCanvas: HTMLCanvasElement;
    private gl: WebGL2RenderingContext;
    private on:boolean = false
    
    // Shader programs
    private brightPassProgram!: WebGLProgram;
    private blurProgram!: WebGLProgram;
    private combineProgram!: WebGLProgram;
    
    // Buffers and textures
    private quadBuffer!: WebGLBuffer;
    private sourceTexture!: WebGLTexture;
    private brightFBO!: WebGLFramebuffer;
    private brightTexture!: WebGLTexture;
    private blurFBO1!: WebGLFramebuffer;
    private blurTexture1!: WebGLTexture;
    private blurFBO2!: WebGLFramebuffer;
    private blurTexture2!: WebGLTexture;
    
    public params = {
        intensity: 1.2,
        radius: 1.5,
        threshold: 0.2,
        spread: 2.8
    };

    constructor(sourceCanvas: HTMLCanvasElement, displayCanvas: HTMLCanvasElement) {
        this.sourceCanvas = sourceCanvas;
        this.displayCanvas = displayCanvas;
        
        const gl = displayCanvas.getContext('webgl2', { 
            premultipliedAlpha: false,
            alpha: false 
        });
        
        if (!gl) {
            throw new Error('WebGL2 not supported!');
        }
        
        this.gl = gl;
        this.init();
        this.resize();

        if (!this.on) {
            this.hide()
        }
    }

    private init() {
        const gl = this.gl;

        // Vertex shader (используется для всех проходов)
        const vertexShaderSource = `#version 300 es
            in vec2 a_position;
            in vec2 a_texCoord;
            out vec2 v_texCoord;
            
            void main() {
                gl_Position = vec4(a_position, 0.0, 1.0);
                v_texCoord = a_texCoord;
            }
        `;

        // Fragment shader для bright pass
        const brightPassShaderSource = `#version 300 es
            precision mediump float;
            uniform sampler2D u_texture;
            uniform float u_threshold;
            in vec2 v_texCoord;
            out vec4 fragColor;
            
            void main() {
                vec4 color = texture(u_texture, v_texCoord);
                float brightness = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));
                
                if (brightness > u_threshold) {
                    fragColor = color;
                } else {
                    fragColor = vec4(0.0, 0.0, 0.0, 1.0);
                }
            }
        `;

        // Fragment shader для blur
        const blurShaderSource = `#version 300 es
            precision mediump float;
            uniform sampler2D u_texture;
            uniform vec2 u_resolution;
            uniform vec2 u_direction;
            uniform float u_radius;
            uniform float u_spread;
            in vec2 v_texCoord;
            out vec4 fragColor;
            
            void main() {
                vec2 texelSize = 1.0 / u_resolution;
                vec4 color = vec4(0.0);
                float total = 0.0;
                
                float radius = u_radius * u_spread;
                
                for (float i = -10.0; i <= 10.0; i += 1.0) {
                    float weight = exp(-0.5 * pow(i / radius, 2.0));
                    vec2 offset = u_direction * i * texelSize;
                    color += texture(u_texture, v_texCoord + offset) * weight;
                    total += weight;
                }
                
                fragColor = color / total;
            }
        `;

        // Fragment shader для комбинирования
        const combineShaderSource = `#version 300 es
            precision mediump float;
            uniform sampler2D u_original;
            uniform sampler2D u_bloom;
            uniform float u_intensity;
            in vec2 v_texCoord;
            out vec4 fragColor;
            
            void main() {
                vec4 original = texture(u_original, v_texCoord);
                vec4 bloom = texture(u_bloom, v_texCoord);
                
                vec3 result = original.rgb + bloom.rgb * u_intensity;
                fragColor = vec4(result, 1.0);
            }
        `;

        this.brightPassProgram = this.createProgram(vertexShaderSource, brightPassShaderSource);
        this.blurProgram = this.createProgram(vertexShaderSource, blurShaderSource);
        this.combineProgram = this.createProgram(vertexShaderSource, combineShaderSource);

        // Quad для full-screen рендера
        this.quadBuffer = gl.createBuffer()!;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
        const positions = new Float32Array([
            -1, -1,  0, 0,
             1, -1,  1, 0,
            -1,  1,  0, 1,
             1,  1,  1, 1
        ]);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

        this.createFramebuffers();
    }

    public hide() {
        this.displayCanvas.hidden = true
        this.on = false
    }

    public show() {
        this.displayCanvas.hidden = false
        this.on = true
    }

    private createShader(type: number, source: string): WebGLShader {
        const gl = this.gl;
        const shader = gl.createShader(type)!;
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('Shader compile error:', gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            throw new Error('Shader compilation failed');
        }
        
        return shader;
    }

    private createProgram(vertexSource: string, fragmentSource: string): WebGLProgram {
        const gl = this.gl;
        const vertexShader = this.createShader(gl.VERTEX_SHADER, vertexSource);
        const fragmentShader = this.createShader(gl.FRAGMENT_SHADER, fragmentSource);
        
        const program = gl.createProgram()!;
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('Program link error:', gl.getProgramInfoLog(program));
            throw new Error('Program linking failed');
        }
        
        return program;
    }

    private createFramebuffers() {
        const gl = this.gl;
        const width = this.displayCanvas.width;
        const height = this.displayCanvas.height;

        this.sourceTexture = this.createTexture(width, height);
        
        this.brightFBO = gl.createFramebuffer()!;
        this.brightTexture = this.createTexture(width, height);
        
        this.blurFBO1 = gl.createFramebuffer()!;
        this.blurTexture1 = this.createTexture(width, height);
        
        this.blurFBO2 = gl.createFramebuffer()!;
        this.blurTexture2 = this.createTexture(width, height);
    }

    private createTexture(width: number, height: number): WebGLTexture {
        const gl = this.gl;
        const texture = gl.createTexture()!;
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        return texture;
    }

    public resize() {
        const dpr = window.devicePixelRatio || 1;
        
        // Берём CSS размеры из source canvas
        const rect = this.sourceCanvas.getBoundingClientRect();
        
        // Устанавливаем CSS размеры
        this.displayCanvas.style.width = rect.width + 'px';
        this.displayCanvas.style.height = rect.height + 'px';
        
        // Устанавливаем размеры буфера с учётом DPR
        this.displayCanvas.width = rect.width * dpr;
        this.displayCanvas.height = rect.height * dpr;

        this.gl.viewport(0, 0, this.displayCanvas.width, this.displayCanvas.height);
        this.createFramebuffers();
    }

    private uploadSourceTexture() {
        const gl = this.gl;
        gl.bindTexture(gl.TEXTURE_2D, this.sourceTexture);
        
        // Переворачиваем текстуру при загрузке
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.sourceCanvas);
        
        // Возвращаем обратно для других текстур
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    }

    private renderToFramebuffer(
        program: WebGLProgram, 
        framebuffer: WebGLFramebuffer | null, 
        texture: WebGLTexture | null, 
        setupUniforms: (program: WebGLProgram) => void
    ) {
        const gl = this.gl;
        
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        if (texture) {
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
        }
        
        gl.useProgram(program);
        
        const posLoc = gl.getAttribLocation(program, 'a_position');
        const texLoc = gl.getAttribLocation(program, 'a_texCoord');
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 16, 0);
        gl.enableVertexAttribArray(texLoc);
        gl.vertexAttribPointer(texLoc, 2, gl.FLOAT, false, 16, 8);
        
        setupUniforms(program);
        
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    public render() {
        if (!this.on) return;
        
        const gl = this.gl;
        const width = this.displayCanvas.width;
        const height = this.displayCanvas.height;

        this.uploadSourceTexture();

        // 1. Bright pass
        this.renderToFramebuffer(this.brightPassProgram, this.brightFBO, this.brightTexture, (program) => {
            gl.uniform1i(gl.getUniformLocation(program, 'u_texture'), 0);
            gl.uniform1f(gl.getUniformLocation(program, 'u_threshold'), this.params.threshold);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.sourceTexture);
        });

        // 2. Blur horizontal
        this.renderToFramebuffer(this.blurProgram, this.blurFBO1, this.blurTexture1, (program) => {
            gl.uniform1i(gl.getUniformLocation(program, 'u_texture'), 0);
            gl.uniform2f(gl.getUniformLocation(program, 'u_resolution'), width, height);
            gl.uniform2f(gl.getUniformLocation(program, 'u_direction'), 1.0, 0.0);
            gl.uniform1f(gl.getUniformLocation(program, 'u_radius'), this.params.radius);
            gl.uniform1f(gl.getUniformLocation(program, 'u_spread'), this.params.spread);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.brightTexture);
        });

        // 3. Blur vertical
        this.renderToFramebuffer(this.blurProgram, this.blurFBO2, this.blurTexture2, (program) => {
            gl.uniform1i(gl.getUniformLocation(program, 'u_texture'), 0);
            gl.uniform2f(gl.getUniformLocation(program, 'u_resolution'), width, height);
            gl.uniform2f(gl.getUniformLocation(program, 'u_direction'), 0.0, 1.0);
            gl.uniform1f(gl.getUniformLocation(program, 'u_radius'), this.params.radius);
            gl.uniform1f(gl.getUniformLocation(program, 'u_spread'), this.params.spread);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.blurTexture1);
        });

        // 4. Combine
        this.renderToFramebuffer(this.combineProgram, null, null, (program) => {
            gl.uniform1i(gl.getUniformLocation(program, 'u_original'), 0);
            gl.uniform1i(gl.getUniformLocation(program, 'u_bloom'), 1);
            gl.uniform1f(gl.getUniformLocation(program, 'u_intensity'), this.params.intensity);
            
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.sourceTexture);
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, this.blurTexture2);
        });
    }
}