function RGBA(r, g, b, a) {
    this.r = function() {
        return r;
    };

    this.g = function() {
        return g;
    };

    this.b = function() {
        return b;
    };

    this.alpha = function() {
        return a;
    };

    this.hasAlpha = function() {
        return true;
    };
}

module.exports = RGBA;
