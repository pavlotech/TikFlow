import fs from 'fs';
import path from 'path';
import { Client } from 'discord.js';
import { IConfigService } from '../config/config.types';
import Logger from '../logger/logger.service';
import { Module } from './module.service';
import ModuleBuilder from './module.builder.class';
import App from '../../../app';

interface ModuleBuilderWithFile {
    builder: ModuleBuilder;
    filename: string;
}

export class ModuleManager {
    private app: App;
    private config: IConfigService;
    private logger: Logger;
    private client: Client;
    private modulesDict: Record<string, Module> = {};
    private modulesPath: string;

    constructor(
        app: App,
        config: IConfigService,
        logger: Logger,
        modulesPath: string,
        client: Client
    ) {
        this.app = app;
        this.config = config;
        this.logger = logger;
        this.modulesPath = modulesPath;
        this.client = client;
    }

    public get modules(): Record<string, Module> {
        return this.modulesDict;
    }

    public async initialize() {
        const allModules = await this.importModules();
        await this.buildModules(allModules);
    }

    private async importModules(): Promise<ModuleBuilderWithFile[]> {
        const modules: ModuleBuilderWithFile[] = [];
        const startPath = path.join(process.cwd(), 'src', 'modules', this.modulesPath);
        const dirsToExplore: string[] = [startPath];
        const filePaths: string[] = [];

        while (dirsToExplore.length > 0) {
            const currentDir = dirsToExplore.pop()!;
            try {
                const entries = await fs.promises.readdir(currentDir, { withFileTypes: true });
                for (const entry of entries) {
                    const fullPath = path.join(currentDir, entry.name);
                    if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.ts'))) {
                        filePaths.push(fullPath);
                    } else if (entry.isDirectory()) {
                        dirsToExplore.push(fullPath);
                    }
                }
            } catch (error) {
                this.logger.error(`Error reading directory ${currentDir}:`, error);
            }
        }

        const importPromises = filePaths.map(async (filePath) => {
            try {
                const importedModule = await import(filePath);
                const builder = importedModule.default as ModuleBuilder;
                if (builder && typeof builder.build === 'function' && builder.options.import !== false) {
                    const moduleName = path
                        .basename(filePath, path.extname(filePath))
                        .replace(/\./g, '_');
                    modules.push({ builder, filename: moduleName });
                    this.logger.info(`Imported module "${moduleName}" from "${filePath}"`);
                }
            } catch (error) {
                this.logger.error(`Error loading module from ${filePath}:`, error);
            }
        });

        await Promise.all(importPromises);
        return modules;
    }

    private async buildModules(moduleBuilders: ModuleBuilderWithFile[]) {
        for (const { builder, filename } of moduleBuilders) {
            const moduleInstance = new Module(
                {
                    app: this.app,
                    config: this.config,
                    logger: this.logger,
                    filename,
                    client: this.client
                },
                builder.build
            );
            await moduleInstance.init();
            this.modulesDict[moduleInstance.name] = moduleInstance;
        }
    }
}