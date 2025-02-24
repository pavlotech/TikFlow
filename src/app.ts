import { Client, IntentsBitField } from 'discord.js';
import { PrismaClient } from '@prisma/client';
import Logger from './core/services/logger/logger.service';
import { IConfigService } from './core/services/config/config.types';
import { ModuleManager } from './core/services/module/module.manager.class';

interface AppDependencies {
    config: IConfigService;
    path: string;
    discord?: {
        TOKEN: string;
    };
}

export default class App {
    public readonly config: IConfigService;
    public readonly logger: Logger;
    public readonly prisma: PrismaClient;
    public readonly client: Client;
    public readonly modules: Record<string, any> = {};
    public readonly moduleManager: ModuleManager;

    constructor(private params: AppDependencies) {
        this.config = params.config;
        this.logger = new Logger({
            logDirectory: 'logs',
            saveIntervalHours: 1,
            colorizeObjects: true
        });
        this.prisma = new PrismaClient();

        this.client = new Client({
            intents: [
                IntentsBitField.Flags.Guilds,
                IntentsBitField.Flags.GuildMessages,
                IntentsBitField.Flags.MessageContent,
                IntentsBitField.Flags.GuildMembers
            ]
        });

        this.moduleManager = new ModuleManager(
            this,
            this.config,
            this.logger,
            this.params.path,
            this.client
        );

        this.main().catch(err => {
            this.logger.error('Error in main:', err);
        });
    }

    private async main() {
        await this.prisma.$connect();

        await this.moduleManager.initialize();
        Object.assign(this.modules, this.moduleManager.modules);

        const tokenKey = this.params.discord?.TOKEN || 'DISCORD_TOKEN';
        const token = this.config.get(tokenKey);

        if (!token) {
            throw new Error(`Discord token not provided in config under key: ${tokenKey}`);
        }

        await this.client.login(token);

        this.client.once('ready', () => {
            this.logger.info(`Discord client logged in as ${this.client.user?.tag}`);
        });
    }
}