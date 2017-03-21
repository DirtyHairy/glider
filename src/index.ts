import * as rendererFactory from './renderer/factory';

export {default as Viewer} from './Viewer';
export {default as FeatureSet} from './FeatureSet';
export {default as Quad} from './Quad';
export {default as RGBA} from './RGBA';

export const CANVAS_RENDERER = rendererFactory.CANVAS;
export const WEBGL_RENDERER = rendererFactory.WEBGL;
