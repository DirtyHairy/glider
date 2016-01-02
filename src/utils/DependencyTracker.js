import {generationSymbol} from './DependencyProvider';

export default class DependencyTracker {
    constructor() {
        this._map = new WeakMap();
    }

    isCurrent(target) {
        return this._map.has(target) && (this._map.get(target) === target[generationSymbol]);
    }

    setCurrent(target) {
        this._map.set(target, target[generationSymbol]);

        return this;
    }

    update(target, cb) {
        if (this.isCurrent(target)) {
            return this;
        }

        cb();

        this.setCurrent(target);

        return this;
    }

    allCurrent(targets) {
        const nTargets = targets.length;
        let isCurrent = true;

        for (let i = 0; i < nTargets; i++) {
            if (!isCurrent) {
                return false;
            }

            isCurrent = isCurrent && this.isCurrent(targets[i]);
        }

        return isCurrent;
    }

    updateAll(targets, cb) {
        if (this.allCurrent(targets)) {
            return this;
        }

        const nTargets = targets.length;

        cb();

        for (let i = 0; i < nTargets; i++) {
            this.setCurrent(targets[i]);
        }

        return this;
    }
}
