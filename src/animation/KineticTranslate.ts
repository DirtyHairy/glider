import Controller from '../Controller';

export default class KineticTranslate {
    constructor(
        private _controller: Controller,
        private _velocityX: number,
        private _velocityY: number,
        private _timeConstant: number
    ) {}

    progress(timestamp: number): void {
        if (this._finished) {
            return;
        }

        if (this._startTimestamp < 0) {
            this._startTimestamp = timestamp;
            return;
        }

        const totalDelta = timestamp - this._startTimestamp,
            factor = Math.exp(-totalDelta / this._timeConstant),
            integratedFactor = (1 - factor) * this._timeConstant,
            translateX = integratedFactor * this._velocityX,
            translateY = integratedFactor * this._velocityY;

        if (Math.abs(factor * this._velocityX) < 0.01 && Math.abs(factor * this._velocityY) < 0.01) {
            this._finished = true;
        } else {
            this._controller.translateRelative(translateX - this._lastTranslateX, translateY - this._lastTranslateY);

            this._lastTranslateX = translateX;
            this._lastTranslateY = translateY;
        }
    }

    finished(): boolean {
        return this._finished;
    }

    cancel(): void {
        this._finished = true;
    }

    private _lastTranslateX = 0;
    private _lastTranslateY = 0;
    private _finished = false;
    private _startTimestamp = -1;
}
