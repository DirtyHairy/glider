var utils = require('./utils');

function RenderControl(renderer) {
    this._renderer = renderer;
}

utils.extend(RenderControl.prototype, {
    _renderer: null,

    _batchId: 0,
    _renderPending: false,
    _suspendRender: 0,

    render: function() {
        if (this._suspendRender > 0) {
            return;
        }

        if (this._batchId > 0) {
            this._renderPending = true;
        } else {
            this._renderer.render();
        }
    },

    startBatch: function() {
        this._batchId++;

        return this;
    },

    suspendRender: function() {
        this._suspendRender++;

        return this;
    },

    resumeRender: function() {
        this._suspendRender--;

        if (this._suspendRender < 0) {
            this._suspendRender = 0;
        }

        return this;
    },

    commitBatch: function() {
        if (this._batchId <= 0) {
            this._batchId = 0;
            return this;
        }

        this._batchId--;

        if (this._batchId === 0 && this._renderPending) {
            this._renderer.render();
            this._renderPending = false;
        }

        return this;
    },

    getRenderer: function() {
        return this._renderer;
    }
});

module.exports = RenderControl;
