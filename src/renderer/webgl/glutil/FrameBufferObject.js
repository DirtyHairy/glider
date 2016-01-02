export default class FrameBufferObject {
    constructor(gl) {
        this._gl = gl;
        this._fbo = gl.createFramebuffer();
        this._boundContext = new BoundContext(this);
    }

    bind(cb) {
        const gl = this._gl;

        gl.bindFramebuffer(gl.FRAMEBUFFER, this._fbo);

        if (cb) {
            cb(this._boundContext);
        }

        return this;
    }

    destroy() {
        const gl = this._gl;

        if (this._fbo) {
            gl.deleteFramebuffer(this._fbo);
            this._fbo = null;
        }
    }
}

class BoundContext {
    constructor(fbo) {
        this._fbo = fbo;
    }

    attachColorTexture(texture, textureUnit) {
        const gl = this._fbo._gl;

        texture.bind(textureUnit);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D,
            texture.getTextureObject(), 0);

        return this;
    }

    validate() {
        const gl = this._fbo._gl,
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
}
