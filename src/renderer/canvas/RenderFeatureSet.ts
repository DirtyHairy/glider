import FeatureSet from '../../FeatureSet';
import Transformation from '../../Transformation';
import Quad from '../../Quad';

export default class RenderFeatureSet {
    constructor(private _ctx: CanvasRenderingContext2D, private _featureSet: FeatureSet,
                private _transformation: Transformation, private _canvas: HTMLCanvasElement) {
    }

    render(): void {
        const scale = this._transformation.getScale(),
            dx = this._transformation.getTranslateX(),
            dy = this._transformation.getTranslateY(),
            dxDiscrete = Math.round(dx * scale),
            dyDiscrete = Math.round(dy * scale),
            canvasWidth2 = this._canvas.width / 2,
            canvasHeight2 = this._canvas.height / 2;

        this._featureSet.forEach((feature: Quad) => {
            const originalHeight = feature.getHeight(),
                width =     Math.round(feature.getWidth() * scale),
                height =    Math.round(originalHeight * scale),
                left =      Math.round(feature.getLeft() * scale + canvasWidth2) + dxDiscrete,
                top =       Math.round((-feature.getBottom() - originalHeight) * scale + canvasHeight2) - dyDiscrete;

            if (!rectangleIntersection(
                0, 0, this._canvas.width, this._canvas.height,
                left, top, left + width, top + height)
            ) {
                return;
            }

            this._ctx.fillStyle = feature.getFillColor().toString();
            this._ctx.fillRect(left, top, width, height);
        });
    }
}

function rectangleIntersection(l1: number, t1: number, r1: number, b1: number,
                               l2: number, t2: number, r2: number, b2: number): boolean {
    return !(r2 < l1 || l2 > r1 || b2 < t1 || t2 > b1);
}
