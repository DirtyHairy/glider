export default class RenderControl {
    constructor(renderer) {
        this._renderer = renderer;
        this._batchId = 0;
        this._renderPending = false;
        this._suspendRender = 0;
    }

    render() {
        if (this._suspendRender > 0) {
            return this;
        }

        if (this._batchId > 0) {
            this._renderPending = true;
        } else {
            this._renderer.render();
        }

        return this;
    }

    startBatch() {
        this._batchId++;

        return this;
    }

    suspendRender() {
        this._suspendRender++;

        return this;
    }

    resumeRender() {
        this._suspendRender--;

        if (this._suspendRender < 0) {
            this._suspendRender = 0;
        }

        return this;
    }

    commitBatch() {
        if (this._batchId <= 0) {
            this._batchId = 0;
            return this;
        }

        this._batchId--;

        if (this._batchId === 0 && this._renderPending) {
            this._renderer.render();
            this._renderPending = false;
        }

        return this;
    }

    getRenderer() {
        return this._renderer;
    }
}
