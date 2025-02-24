// locale.service.ts
import path from 'path';
import fs from "fs";
import { translate } from 'bing-translate-api';
import { LocaleData } from './locale.types';

export class Locale {
    private cache: Map<string, LocaleData> = new Map();
    private localeDir: string = path.join(__dirname, 'lang');

    constructor(localeDir?: string) {
        this.localeDir = localeDir ?? this.localeDir;
    }

    public async get(lang: string = ''): Promise<LocaleData> {
        return this.cache.get(lang) ?? await this.loadLocale(lang);
    }

    public async translate(text: string, lang: string) {
        try {
            const translation = await translate(text, null, lang);
            return translation?.translation || text;
        } catch (error) {
            throw new Error(`Translate error: ${error}`);
        }
    }

    private async loadLocale(lang: string): Promise<LocaleData> {
        const supportedLanguages = (await fs.promises.readdir(this.localeDir))
            .map(file => file.split('.')[0]);

        lang = supportedLanguages.includes(lang) ? lang : 'en';

        const modulePath = path.join(this.localeDir, (await fs.promises.readdir(this.localeDir)).find(file => file.startsWith(lang))!);

        const { default: localeData } = await import(modulePath) as { default: LocaleData };
        this.cache.set(lang, localeData);
        return localeData;
    }
}