export default class Throttle {
    constructor(cb, interval) {
        this._cb = cb;
        this._interval = interval;
        this._args = null;
        this._lastCallr = Date.now();
        this._timeoutHandle = null;
    }

    call(...args) {
        if (this._timeoutHandle !== null) {
            this._args = args;
            return;
        }

        const now = Date.now();

        if (now - this._lastCall > this._interval) {
            this._cb(...args);
            this._lastCall = now;
        } else {
            this._args = args;
            this._timeoutHandle = setTimeout(() => {
                this._cb(...this._args);
                this._lastCall = now;
                this._timeoutHandle = null;
            }, this._interval - now + this._lastCall);
        }

        return this;
    }

    setInterval(interval) {
        if (interval === this._interval) {
            return this;
        }

        this._interval = interval;

        if (this._timeoutHandle !== null) {
            this.cancel();
            this.call(...this._args);
        }

        return this;
    }

    cancel() {
        if (this._timeoutHandle) {
            clearTimeout(this._timeoutHandle);
            this._timeoutHandle = null;
        }
    }

    destroy() {
        this.cancel();
        this._cb = null;
    }
}
