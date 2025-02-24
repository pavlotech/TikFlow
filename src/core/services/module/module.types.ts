import { Client } from 'discord.js';
import App from 'src/app';
import { IConfigService } from '../config/config.types';
import Logger from '../logger/logger.service';

export interface ModuleOptions {
    app: App;
    config: IConfigService;
    logger: Logger;
    client: Client;
    name?: string;
    filename?: string;
}

export interface ModuleBuilderOptions {
    name?: string;
    import?: boolean;
    type?: 'module' | 'event'
}

export interface ModuleManagerParams {
    path: string;
    mode: 'modules' | 'server';
    telegram?: { TOKEN: string };
    server?: {};
    modules?: {};
    port?: number;
}