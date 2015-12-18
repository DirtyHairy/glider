var utils = require('../../../utils');

function Program(gl, vertexShaderSource, fragmentShaderSource) {
    this._gl = gl;
    this._attributeLocations = {};
    this._uniformLocations = {};
    this._boundContext = new BoundContext(this);

    this._vertexShader = compileShader(gl, vertexShaderSource, gl.VERTEX_SHADER);
    this._fragmentShader = compileShader(gl, fragmentShaderSource, gl.FRAGMENT_SHADER);

    this._program = linkProgram(gl, this._vertexShader, this._fragmentShader);
}

utils.extend(Program.prototype, {
    _vertexShader: null,
    _fragmentShader: null,
    _program: null,
    _gl: null,
    _boundContext: null,

    _attributeLocations: null,
    _uniformLocations: null,

    _getAttribLocation: function(name) {
        if (this._attributeLocations.hasOwnProperty(name)) {
            return this._attributeLocations[name];
        }

        var location = this._gl.getAttribLocation(this._program, name);

        if (location < 0) {
            throw new Error('attribute ' + name + ' not found');
        }

        this._attributeLocations[name] = location;
        return location;
    },

    _getUniformLocation: function(name) {
        if (this._uniformLocations.hasOwnProperty(name)) {
            return this._uniformLocations[name];
        }

        var location = this._gl.getUniformLocation(this._program, name);

        if (location < 0) {
            throw new Error('uniform ' + name + ' not found');
        }

        this._uniformLocations[name] = location;
        return location;
    },

    use: function(cb) {
        this._gl.useProgram(this._program);

        if (cb) {
            cb.apply(this._boundContext);
        }
    },

    destroy: function() {
        var gl = this._gl;

        if (this._vertexShader) {
            gl.deleteShader(this._vertexShader);
            this._vertexShader = null;
        }

        if (this._fragmentShader) {
            gl.deleteShader(this._fragmentShader);
            this._fragmentShader = null;
        }

        if (this._program) {
            gl.deleteProgram(this._program);
            this._program = null;
        }
    }
});

module.exports = Program;

function compileShader(gl, source, type) {
    var shader = gl.createShader(type);

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error('shader compile failed: ' + gl.getShaderInfoLog(shader));
    }

    return shader;
}

function linkProgram(gl, vertexShader, fragmentShader) {
    var program = gl.createProgram();

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error('shader failed to link: ' + gl.getProgramInfoLog(program));
    }

    return program;
}

function BoundContext(program) {
    this._program = program;
}

utils.extend(BoundContext.prototype, {
    vertexAttribPointer: function(name, size, type, normalized, stride, offset) {
        this._program._gl.vertexAttribPointer(
                this._program._getAttribLocation(name),
                size,
                type,
                !!normalized,
                stride || 0,
                offset || 0
        );
    },

    enableVertexAttribArray: function(name) {
        this._program._gl.enableVertexAttribArray(this._program._getAttribLocation(name));
    }
});

[2, 3, 4].forEach(function(dim) {
    var method = 'uniformMatrix' + dim + 'fv';

    BoundContext.prototype[method] = new Function('name', 'value', 'transpose', // jshint ignore:line
        'this._program._gl.' + method + '(this._program._getUniformLocation(name), !!transpose, value);'
    );
});

[1, 2, 3, 4].forEach(function(dim) {
    ['f', 'i'].forEach(function(type) {
        var args = ['name'],
            callArgs = ['this._program._getUniformLocation(name)'],
            i = 0;

        for (i = 0; i < dim; i++) {
            args.push('v' + i);
            callArgs.push('v' + i);
        }

        var method = 'uniform' + dim + type,
            body = 'this._program._gl.' + method + '(' + callArgs.join(',') + ')';

        args.push(body);

        var Constructor = Function.bind.apply(Function, [this].concat(args));

        BoundContext.prototype[method] = new Constructor();
    });
});
