import KineticTranslate from './animation/KineticTranslate';
import Controller from './Controller';
import Renderer from './renderer/Renderer';

export default class Animation {

    constructor(
        private _controller: Controller,
        private _renderer: Renderer
    ) {}

    kineticTranslate(velocityX: number, velocityY: number): this {
        this.stopKineticTranslate();

        this._kineticTranslate = new KineticTranslate(
            this._controller, velocityX, velocityY, this._kineticTranslateTimeConstant
        );

        this._renderer.addAnimation(this._kineticTranslate);

        return this;
    }

    stopKineticTranslate(): this {
        if (this._kineticTranslate) {
            this._kineticTranslate.cancel();
        }

        return this;
    }

    private _kineticTranslate: KineticTranslate = null;
    private _kineticTranslateTimeConstant = 325;

}
