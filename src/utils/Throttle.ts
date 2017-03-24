export default class Throttle {

    constructor(
        private _cb: (...args: Array<any>) => void,
        private _interval: number)
     {}

    call(...args: Array<any>): this {
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

    setInterval(interval: number): this {
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

    cancel(): this {
        if (this._timeoutHandle) {
            clearTimeout(this._timeoutHandle);
            this._timeoutHandle = null;
        }

        return this;
    }

    destroy(): void {
        this.cancel();
        this._cb = null;
    }

    private _lastCall = 0;
    private _args: Array<any> = [];
    private _timeoutHandle: any = null;
}
