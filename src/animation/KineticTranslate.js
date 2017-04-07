

export default class KineticTranslate {
    constructor(controller, velocityX, velocityY, timeConstant) {
        this._controller = controller;
        this._velocityX = velocityX;
        this._velocityY = velocityY;
        this._timeConstant = timeConstant;

        this._lastTranslateX = 0;
        this._lastTranslateY = 0;

        this._finished = false;
        this._startTimestamp = -1;
    }

    progress(timestamp) {
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

    finished() {
        return this._finished;
    }

    cancel() {
        this._finished = true;
    }
}
