export const generationSymbol = Symbol('generation counter');

class DependencyProvider {
    constructor(private _target: any) {
        this._target[generationSymbol] = 0;
    }

    bump() {
        this._target[generationSymbol]++;
    }
}

export default DependencyProvider;
