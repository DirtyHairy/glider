export default class PickingBuffer {
    constructor(extend, canvasWidth, canvasHeight, gl) {
        this._initialized = false;
        this._canvasWidth = canvasWidth;
        this._canvasHeight = canvasHeight;
        this._valid = false;

        // These are webgl window coordinates!
        this._bottom = 0;
        this._left = 0;

        this._extend = extend;
        this._buffer = new Uint8Array(this._extend * this._extend * 4);
        this._gl = gl;
    }

    _windowCoordinates(x, y) {
        return {
            x: Math.floor(x + this._canvasWidth / 2),
            y: Math.floor(y + this._canvasHeight / 2)
        };
    }

    contains(x, y) {
        const {x: windowX, y: windowY} = this._windowCoordinates(x, y);

        return  this._buffer && this._valid &&
                (windowX >= this._left) && (windowX < this._left + this._extend) &&
                (windowY >= this._bottom) && (windowY < this._bottom + this._extend);
    }

    update(x, y) {
        const gl = this._gl,
            {x: windowX, y: windowY} = this._windowCoordinates(x, y),
            shift = Math.ceil(this._extend / 2);

        this._left = Math.max(windowX - shift, 0);
        this._bottom = Math.max(windowY - shift, 0);

        gl.readPixels(
            this._left, this._bottom,
            Math.min(this._extend, this._canvasWidth), Math.min(this._extend, this._canvasHeight),
            gl.RGBA, gl.UNSIGNED_BYTE, this._buffer);

        this._valid = true;
    }

    invalidate() {
        this._valid = false;
    }

    read(x, y) {
        if (!this.contains(x, y)) {
            this.update(x, y);
        }

        const {x: windowX, y: windowY} = this._windowCoordinates(x, y),
            relX = windowX - this._left,
            relY = windowY - this._bottom;

        return new Uint8Array(this._buffer.buffer, 4 * (relY * Math.min(this._extend, this._canvasWidth) + relX), 4);
    }

    adjustViewportSize(width, height) {
        this._canvasWidth = width;
        this._canvasHeight = height;
        this._valid = false;
    }
}
