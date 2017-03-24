export default class Program {
    constructor(
        public _gl: WebGLRenderingContext,
        vertexShaderSource: string,
        fragmentShaderSource: string
    ) {
        this._boundContext = new BoundContext(this);
        this._vertexShader = compileShader(_gl, vertexShaderSource, _gl.VERTEX_SHADER);
        this._fragmentShader = compileShader(_gl, fragmentShaderSource, _gl.FRAGMENT_SHADER);
        this._program = linkProgram(_gl, this._vertexShader, this._fragmentShader);
    }

    _getAttribLocation(name: string): number {
        if (this._attributeLocations.hasOwnProperty(name)) {
            return this._attributeLocations[name];
        }

        const location = this._gl.getAttribLocation(this._program, name);

        if (location < 0) {
            throw new Error('attribute ' + name + ' not found');
        }

        this._attributeLocations[name] = location;
        return location;
    }

    _getUniformLocation(name: string): WebGLUniformLocation {
        if (this._uniformLocations.hasOwnProperty(name)) {
            return this._uniformLocations[name];
        }

        const location = this._gl.getUniformLocation(this._program, name);

        if (location < 0) {
            throw new Error('uniform ' + name + ' not found');
        }

        this._uniformLocations[name] = location;
        return location;
    }

    use(cb: (context: BoundContext) => void) {
        this._gl.useProgram(this._program);

        if (cb) {
            cb(this._boundContext);
        }
    }

    destroy(): void {
        const gl = this._gl;

        if (this._program) {
            gl.deleteProgram(this._program);
            this._program = null;
        }

        if (this._vertexShader) {
            gl.deleteShader(this._vertexShader);
            this._vertexShader = null;
        }

        if (this._fragmentShader) {
            gl.deleteShader(this._fragmentShader);
            this._fragmentShader = null;
        }
    }

    private _attributeLocations: {[key: string]: number} = {};
    private _uniformLocations: {[key: string]: WebGLUniformLocation} = {};
    private _boundContext: BoundContext;
    private _vertexShader: WebGLShader;
    private _fragmentShader: WebGLShader;
    private _program: WebGLProgram;
}

function compileShader(gl: WebGLRenderingContext, source: string, type: number): WebGLShader {
    const shader = gl.createShader(type);

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error('shader compile failed: ' + gl.getShaderInfoLog(shader));
    }

    return shader;
}

function linkProgram(gl: WebGLRenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram {
    const program = gl.createProgram();

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error('shader failed to link: ' + gl.getProgramInfoLog(program));
    }

    return program;
}

// tslint:disable-next-line:max-classes-per-file
class BoundContext {
    constructor(private _program: Program) { }

    vertexAttribPointer(name: string, size: number, type: number, normalized = false, stride = 0, offset = 0): this {
        this._program._gl.vertexAttribPointer(
                this._program._getAttribLocation(name),
                size,
                type,
                normalized,
                stride,
                offset
        );

        return this;
    }

    enableVertexAttribArray(name: string): this {
        this._program._gl.enableVertexAttribArray(this._program._getAttribLocation(name));

        return this;
    }

    uniformMatrix2fv: (name: string, value: Float32Array, transpose: boolean) => void;
    uniformMatrix3fv: (name: string, value: Float32Array, transpose: boolean) => void;
    uniformMatrix4fv: (name: string, value: Float32Array, transpose: boolean) => void;

    uniform1i: (name: string, value1: number) => void;
    uniform2i: (name: string, value1: number, value2: number) => void;
    uniform3i: (name: string, value1: number, value2: number, value3: number) => void;
    uniform4i: (name: string, value1: number, value2: number, value3: number, value4: number) => void;

    uniform1f: (name: string, value1: number) => void;
    uniform2f: (name: string, value1: number, value2: number) => void;
    uniform3f: (name: string, value1: number, value2: number, value3: number) => void;
    uniform4f: (name: string, value1: number, value2: number, value3: number, value4: number) => void;
}

[2, 3, 4].forEach((dim) => {
    const method = `uniformMatrix${dim}fv`;

    (BoundContext as any).prototype[method] = new Function('name', 'value', 'transpose',
        `this._program._gl.${method}(this._program._getUniformLocation(name), !!transpose, value);`
    );
});

[1, 2, 3, 4].forEach((dim) => {
    ['f', 'i'].forEach((type) => {
        const args = ['name'],
            callArgs = ['this._program._getUniformLocation(name)'];

        for (let i = 0; i < dim; i++) {
            args.push('v' + i);
            callArgs.push('v' + i);
        }

        const method = `uniform${dim}${type}`;

        args.push(`this._program._gl.${method}( ${callArgs.join(',')} );`);

        (BoundContext as any).prototype[method] = new Function(...args);
    });
});
