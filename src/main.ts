//modules
import * as discord from 'discord.js';
import * as disVoice from '@discordjs/voice';
import * as fs from 'fs';
import * as on from './on';

//models
import { GuildDataModel } from './models/guildDataModel';

const token = JSON.parse(fs.readFileSync('token.json').toString());

class Main {
    guildData: GuildDataModel = { queue: new Map(), searchCache: new Map() };
    client: discord.Client = new discord.Client({ intents: ['GUILDS', 'GUILD_MESSAGES', 'GUILD_VOICE_STATES'] });

    constructor() {
        this.client.login(token.token.discord);
        
        new on.On(this.guildData, this.client);
    }
}

const main = () => new Main();

main();
