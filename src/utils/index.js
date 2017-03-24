export function clamp(x, min, max) {
    if (x < min) {
        return min;
    }

    if (x > max) {
        return max;
    }

    return x;
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
