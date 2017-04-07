import CanvasRenderer from './canvas/Renderer';
import Transformation from '../Transformation';
import Collection from '../utils/Collection';
import FeatureSet from '../FeatureSet';
import WebglRenderer from './webgl/Renderer';
import RendererInterface from './Renderer';
import AbstractRenderer from './AbstractRenderer';

export const enum Type {
    canvas = 1,
    webgl = 2
}

export const CANVAS: Type = Type.canvas;
export const WEBGL: Type = Type.webgl;

function createRendererInstance(
    rendererType: Type,
    canvas: HTMLCanvasElement,
    imageUrl: string,
    transformation: Transformation,
    featureSets: Collection<FeatureSet>
): AbstractRenderer<any> {
    switch (rendererType) {
        case CANVAS:
            return new CanvasRenderer(canvas, imageUrl, transformation, featureSets);

        case WEBGL:
            return new WebglRenderer(canvas, imageUrl, transformation, featureSets);

        default:
            throw new Error('invalid renderer type');
    }
}

export function createRenderer(
    rendererType: Type,
    canvas: HTMLCanvasElement,
    imageUrl: string,
    transformation: Transformation,
    featureSets: Collection<FeatureSet>
): RendererInterface {
    return createRendererInstance(rendererType, canvas, imageUrl, transformation, featureSets).init();
}
