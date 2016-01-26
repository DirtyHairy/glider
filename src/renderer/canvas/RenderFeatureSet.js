export default class RenderFeatureSet {
    constructor(ctx, featureSet, transformation, canvas) {
        this._ctx = ctx;
        this._featureSet = featureSet;
        this._transformation = transformation;
        this._canvas = canvas;
    }

    render() {
        const scale = this._transformation.getScale(),
            dx = this._transformation.getTranslateX(),
            dy = this._transformation.getTranslateY(),
            dxDiscrete = Math.round(dx * scale),
            dyDiscrete = Math.round(dy * scale),
            canvasWidth2 = this._canvas.width / 2,
            canvasHeight2 = this._canvas.height / 2;

        this._featureSet.forEach((feature) => {
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

function rectangleIntersection(l1, t1, r1, b1, l2, t2, r2, b2) {
    return !(r2 < l1 || l2 > r1 || b2 < t1 || t2 > b1);
}
