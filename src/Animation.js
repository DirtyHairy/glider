import KineticTranslate from './animation/KineticTranslate';

export default class Animation {

    constructor(controller, renderer) {
        this._controller = controller;
        this._renderer = renderer;

        this._kineticTranslate = null;
        this._kineticTranslateTimeConstant = 325;
    }

    kineticTranslate(velocityX, velocityY) {
        this.stopKineticTranslate();

        this._kineticTranslate = new KineticTranslate(
            this._controller, velocityX, velocityY, this._kineticTranslateTimeConstant
        );

        this._renderer.addAnimation(this._kineticTranslate);

        return this;
    }

    stopKineticTranslate() {
        if (this._kineticTranslate) {
            this._kineticTranslate.cancel();
        }

        return this;
    }

}
