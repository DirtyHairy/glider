import Point from '../../Point';

class PickingBuffer {
    constructor(private _extend: number, private _canvasWidth: number, private _canvasHeight: number,
                private _gl: WebGLRenderingContext) {
        this._buffer = new Uint8Array(this._extend * this._extend * 4);
    }

    contains(x: number, y: number): boolean {
        const {x: windowX, y: windowY} = this._windowCoordinates(x, y);

        return this._buffer && this._valid &&
                (windowX >= this._left) && (windowX < this._left + this._extend) &&
                (windowY >= this._bottom) && (windowY < this._bottom + this._extend);
    }

    update(x: number, y: number): void {
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

    invalidate(): void {
        this._valid = false;
    }

    read(x: number, y: number): Uint8Array {
        if (!this.contains(x, y)) {
            this.update(x, y);
        }

        const {x: windowX, y: windowY} = this._windowCoordinates(x, y),
            relX = windowX - this._left,
            relY = windowY - this._bottom;

        return new Uint8Array(this._buffer.buffer, 4 * (relY * Math.min(this._extend, this._canvasWidth) + relX), 4);
    }

    adjustViewportSize(width: number, height: number): void {
        this._canvasWidth = width;
        this._canvasHeight = height;
        this._valid = false;
    }

    private _windowCoordinates(x: number, y: number): Point {
        return {
            x: Math.floor(x + this._canvasWidth / 2),
            y: Math.floor(y + this._canvasHeight / 2)
        };
    }

    private _bottom: number = 0;
    private _buffer: Uint8Array;
    private _left: number = 0;
    private _valid: boolean = false;
}

export default PickingBuffer;
