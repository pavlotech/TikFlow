import EventEmitter from 'events';
import App from 'src/app';
import { ConfigService } from 'src/core/services/config/config.service';

const config = new ConfigService();

EventEmitter.defaultMaxListeners = 1000;

new App({
    config: config,
    path: '',
    discord: {
        TOKEN: 'DISCORD_TOKEN',
    },
});