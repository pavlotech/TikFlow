import path from 'path';
import { Client, ApplicationCommandDataResolvable } from 'discord.js';
import { IConfigService } from '../config/config.types';
import Logger from '../logger/logger.service';
import App from '../../../app';
import { ModuleOptions } from './module.types';

const commands: ApplicationCommandDataResolvable[] = [];

export class Module {
    public readonly config: IConfigService;
    public readonly logger: Logger;
    public readonly app: App;
    public readonly client: Client;
    public readonly name: string;
    public readonly slashCommands: ApplicationCommandDataResolvable[] = [];

    constructor(
        private readonly options: ModuleOptions,
        private readonly buildFn: (module: Module) => Module | Promise<Module>
    ) {
        this.config = options.config;
        this.logger = options.logger;
        this.app = options.app;
        this.client = options.client;
        this.name = options.name || this.generateModuleName(options.filename);
    }

    private generateModuleName(filename?: string): string {
        if (!filename) {
            return 'module';
        }
        return path
            .basename(filename, path.extname(filename))
            .replace(/\./g, '_');
    }

    public async init() {
        await this.buildFn(this);
    }

    public async addSlashCommand(command: ApplicationCommandDataResolvable) {
        commands.push(command);
    }

    public getSlashCommands(): ApplicationCommandDataResolvable[] {
        return commands;
    }
}