function DependencyProvider(target) {
    target._dependencyGeneration = 0;

    this.bump = function() {
        target._dependencyGeneration++;
    };
}

module.exports = DependencyProvider;
