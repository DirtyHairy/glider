export function clamp(x: number, min: number, max: number): number {
    if (x < min) {
        return min;
    }

    if (x > max) {
        return max;
    }

    return x;
}

export interface Destroyable {
    destroy?: () => void;
}

export function destroy(victim: Destroyable): null {
    if (victim && victim.destroy) {
        victim.destroy();
    }

    return null;
}

export function loadImage(url: string) {
    const image = new Image();

    return new Promise((resolve, reject) => {
        image.addEventListener('load', () => resolve(image));

        image.addEventListener('error', () =>
            reject(new Error('image load for ' + url + ' failed')));

        image.src = url;
    });
}
