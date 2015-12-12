function extend(o, properties) {
    Object.keys(properties).forEach(function(key) {
        o[key] = properties[key];
    });
}

function clamp(x, min, max) {
    if (x < min) {
        return min;
    }

    if (x > max) {
        return max;
    }

    return x;
}

module.exports = {
    extend: extend,
    clamp: clamp
};
