function extend(o, properties) {
    Object.keys(properties).forEach(function(key) {
        o[key] = properties[key];
    });
}

module.exports = {
    extend: extend
};
