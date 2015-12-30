import DependencyProvider from '../../utils/DependencyProvider';

var utils = require('../../utils'),
    RGBA = require('../../RGBA');

function PickingColorManager(featureSetIndex) {
    this._featureSetIndex = featureSetIndex;
    this._dependecyProvider = new DependencyProvider(this);
}

utils.extend(PickingColorManager.prototype, {
    _featureSetIndex: 0,
    _dependecyProvider: null,

    setFeatureSetIndex: function(index) {
        this._featureSetIndex = index;
        this._dependecyProvider.bump();

        return this;
    },

    getColor: function(i) {
        return new RGBA(
            (((this._featureSetIndex + 1) & 0xFF00) >>> 8) / 255,
            (( this._featureSetIndex + 1) & 0x00FF) / 255,
            ((i & 0xFF00) >>> 8) / 255,
            ( i & 0x00FF) / 255
        );
    }
});

module.exports = PickingColorManager;
