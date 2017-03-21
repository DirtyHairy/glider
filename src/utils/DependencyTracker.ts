import {generationSymbol} from './DependencyProvider';

class DependencyTracker {
    isCurrent(target: any): boolean {
        return this._map.has(target) && (this._map.get(target) === target[generationSymbol]);
    }

    setCurrent(target: any): this {
        this._map.set(target, target[generationSymbol]);

        return this;
    }

    setAllCurrent(targets: Array<any>): this {
        const nTargets = targets.length;

        for (let i = 0; i < nTargets; i++) {
            this.setCurrent(targets[i]);
        }

        return this;
    }

    update(target: any, cb: () => void): this {
        if (this.isCurrent(target)) {
            return this;
        }

        cb();

        this.setCurrent(target);

        return this;
    }

    allCurrent(targets: Array<any>): boolean {
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

    updateAll(targets: Array<any>, cb: () => void) {
        if (this.allCurrent(targets)) {
            return this;
        }

        cb();

        this.setAllCurrent(targets);

        return this;
    }

    private _map = new WeakMap<Object, number>();
}

export default DependencyTracker;
