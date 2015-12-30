export default class DependencyProvider {
    constructor(target) {
        this._target = target;

        target._dependencyGeneration = 0;
    }

    bump() {
        this._target._dependencyGeneration++;
    }
}
