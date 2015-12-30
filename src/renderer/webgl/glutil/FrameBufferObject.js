var utils = require('../../../utils');

function FrameBufferObject(gl) {
    this._gl = gl;
    this._fbo = gl.createFramebuffer();
    this._boundContext = new BoundContext(this);
}

utils.extend(FrameBufferObject.prototype, {
    _gl: null,
    _fbo: null,
    _boundContext: null,

    bind: function(cb) {
        var gl = this._gl;

        gl.bindFramebuffer(gl.FRAMEBUFFER, this._fbo);

        if (cb) {
            cb(this._boundContext);
        }

        return this;
    },

    destroy: function() {
        var gl = this._gl;

        if (this._fbo) {
            gl.deleteFramebuffer(this._fbo);
            this._fbo = null;
        }
    }
});

module.exports = FrameBufferObject;

function BoundContext(fbo) {
    this._fbo = fbo;
}

utils.extend(BoundContext.prototype, {
    attachColorTexture: function(texture, textureUnit) {
        var gl = this._fbo._gl;

        texture.bind(textureUnit);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D,
            texture.getTextureObject(), 0);

        return this;
    },

    validate: function() {
        var gl = this._fbo._gl,
            status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);

        switch (status) {
            case gl.FRAMEBUFFER_COMPLETE:
                return this;

            case gl.FRAMEBUFFER_UNSUPPORTED:
                throw new Error('unsupported configuration');

            case gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT:
                throw new Error('incomplete attachment');

            case gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS:
                throw new Error('attachment dimensions do not match');

            case gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT:
                throw new Error('missing attachment');

            default:
                throw new Error('unknown error: ' + status);
        }
    }
});
