import { Module } from './module.service';
import { ModuleBuilderOptions } from './module.types';

export default class ModuleBuilder {
    public readonly build: (module: Module) => Module | Promise<Module>;
    public readonly options: ModuleBuilderOptions;

    constructor(
        options: ModuleBuilderOptions,
        build: (module: Module) => Module | Promise<Module>
    ) {
        this.options = { import: options.import === undefined ? true : options.import, ...options };
        this.build = build;
    }
}

export { Module };