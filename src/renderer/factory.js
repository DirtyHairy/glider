import CanvasRenderer from './canvas/Renderer';
import WebglRenderer from './webgl/Renderer';

export const CANVAS = Symbol('2D canvas renderer');
export const WEBGL = Symbol('WebGL canvas renderer');

export function createRenderer(rendererType, ...args) {
    switch (rendererType) {
        case CANVAS:
            return new CanvasRenderer(...args);

        case WEBGL:
            return new WebglRenderer(...args);

        default:
            throw new Error('invalid renderer type');
    }
}
