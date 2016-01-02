export const generationSymbol = Symbol('generation counter');

export default class DependencyProvider {
    constructor(target) {
        this._target = target;

        target[generationSymbol] = 0;
    }

    bump() {
        this._target[generationSymbol]++;
    }
}
