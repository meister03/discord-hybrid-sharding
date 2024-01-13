export class AutoResharderManager {
    options: ReClusterOptions;
    name: 'autoresharder';
    onProgress: Boolean;
    manager?: ClusterManager;
    constructor(options?: ReClusterOptions) {
        if (!options) this.options = {};
        else this.options = options;
        this.name = 'autoresharder';
        this.onProgress = false;
    }
    build(manager: ClusterManager) {
        manager[this.name] = this;
        this.manager = manager;
        return this;
    }
}