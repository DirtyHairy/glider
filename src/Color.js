function Color(r, g, b, alpha) {
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
        return alpha;
    };

    this.hasAlpha = function() {
        return typeof(alpha) !== 'undefined';
    };
}

module.exports = Color;
