import Animation from '../animation/AnimationInterface';
import PickingManager from './PickingManager';

interface Renderer {
    render(): this;
    getCanvas(): HTMLCanvasElement;
    applyCanvasResize(): this;
    addAnimation(animation: Animation): this;
    removeAnimation(animation: Animation): this;
    ready(): Promise<any>;
    getPickingProvider(): PickingManager;
    destroy(): void;
    getImageWidth(): number;
    getImageHeight(): number;
};

export default Renderer;
