var util = require('util');

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

function delegate(proto, target, method) {
    if (Array.isArray(method)) {
        method.forEach(function(m) {
            delegate(proto, target, m);
        });
    }

    var functionBody = util.format('return this.%s.%s.apply(this.%s, arguments);', target, method, target);

    proto[method] = new Function(functionBody); // jshint ignore: line
}

function delegateFluent(proto, target, method) {
    if (Array.isArray(method)) {
        method.forEach(function(m) {
            delegateFluent(proto, target, m);
        });
    }

    var functionBody = util.format('this.%s.%s.apply(this.%s, arguments); return this;', target, method, target);

    proto[method] = new Function(functionBody); // jshint ignore: line
}

function destroy(victim) {
    if (victim && victim.destroy) {
        victim.destroy();
    }

    return null;
}

module.exports = {
    extend: extend,
    clamp: clamp,
    delegate: delegate,
    delegateFluent: delegateFluent,
    destroy: destroy
};
