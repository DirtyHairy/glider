import RendererInterface from './renderer/Renderer';

export default class RenderControl {
    constructor(private _renderer: RendererInterface) {
    }

    render(): this {
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

    startBatch(): this {
        this._batchId++;

        return this;
    }

    suspendRender(): this {
        this._suspendRender++;

        return this;
    }

    resumeRender(): this {
        this._suspendRender--;

        if (this._suspendRender < 0) {
            this._suspendRender = 0;
        }

        return this;
    }

    commitBatch(): this {
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

    getRenderer(): RendererInterface {
        return this._renderer;
    }

    private _batchId: number = 0;
    private _renderPending: boolean = false;
    private _suspendRender: number = 0;
}
