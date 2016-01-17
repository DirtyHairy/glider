export function extend(o, properties) {
    Object.keys(properties).forEach((key) => {
        o[key] = properties[key];
    });
}

export function clamp(x, min, max) {
    if (x < min) {
        return min;
    }

    if (x > max) {
        return max;
    }

    return x;
}

export function delegate(proto, target, method) {
    if (Array.isArray(method)) {
        method.forEach((m) => {
            delegate(proto, target, m);
        });
    }

    const functionBody = `return this.${target}.${method}.apply(this.${target}, arguments);`;

    proto[method] = new Function(functionBody); // jshint ignore: line
}

export function delegateFluent(proto, target, method) {
    if (Array.isArray(method)) {
        method.forEach((m) => {
            delegateFluent(proto, target, m);
        });
    }
    const functionBody = `this.${target}.${method}.apply(this.${target}, arguments); return this;`;

    proto[method] = new Function(functionBody); // jshint ignore: line
}

export function destroy(victim) {
    if (victim && victim.destroy) {
        victim.destroy();
    }

    return null;
}

export function loadImage(url) {
    const image = new Image();

    return new Promise((resolve, reject) => {
        image.addEventListener('load', () => resolve(image));

        image.addEventListener('error', () =>
            reject(new Error('image load for ' + url + ' failed')));

        image.src = url;
    });
}
