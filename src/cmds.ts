//moduels
import * as discord from 'discord.js';
import * as ytdl from 'ytdl-core';
import * as disVoice from '@discordjs/voice';
import * as ytSearcher from 'ytsearcher';
import * as fs from 'fs';

//models
import { GuildDataModel, QueueModel } from './models/guildDataModel';
import internal from 'stream';
import { runInThisContext } from 'vm';

export class Cmds {
    cmds = {
        play: ['p', 'pl', 'play'],
        select: ['sl', 'select'],
        pause: ['ps', 'pause'],
        resume: ['rs', 'resume'],
        stop: ['st', 'stop'], 'skip': ['sk', 'skip'],
        remove: ['rm', 'remove'], 'loop': ['lp', 'loop'],
        queue: ['q', 'que', 'queue'],
        cmds: ['h', 'help', 'cmd', 'cmds', 'command', 'commands'],
        info: ['if', 'info']
    };
    helpCmds = `==========
__**Commands List**__
----------
***\*Uppercase, lowercase doesn't matter.\****
***type dj first then type***
    **select and find**
> **play**: \`p, pl, play <url> or <search>\`
> **select**: \`sl, select <number>\`
    **pause and stop**
> **pause**: \`ps, pause\`\n> **resume**: \`rs, resume\`
> **resume**: \`rs, resume\`\n> **resume**: \`rs, resume\`
> **stop**: \`st, stop\`\n> **skip**: \`sk, skip\`
    **manage queue**
> **skip**: \`sk, skip\`\n> **remove**: \`rm, remove <number>\`;
> **remove**: \`rm, remove <number>\`\n> **loop**: \`lp, loop\`
> **queue**: \`q, que, queue\`\n> **cmds**: \`h, help, cmd, cmds, command, commands\`

> **commands**: \`h, help, cmd, cmds, command, commands\`
> **info**: \`if, info, (type only dj)\`
`;
    guildData: GuildDataModel;
    message: discord.Message;
    argsInp: string[];

    constructor(guildData: GuildDataModel, message: discord.Message) {
        this.guildData = guildData;
        this.message = message;

        const argsInp: string[] = this.splitSpace(message.content);
        this.argsInp = argsInp;

        if (argsInp[0] == 'dj') {
            if ((argsInp.length <= 1 || !this.cmds.select.includes(argsInp[1])) && guildData.searchCache.has(message.guildId as string)) {
                this.guildData.searchCache.delete(message.guildId as string);
                return;
            }
            
            if (this.cmds.queue.includes(argsInp[1])) { this.queue(); return; };

            if (argsInp.length == 1 || this.cmds.info.includes(argsInp[1].toLowerCase())) { this.info(); return; }

            if (this.cmds.cmds.includes(argsInp[1])) { this.commands(); return; }
            
            if (!this.message.member!.voice.channelId) {
                this.message.channel.send('----------\nYou must in voice channel for request music.');
                return;
            }
            
            if (!this.message.member!.voice.channel!.permissionsFor(this.message.guild?.me as discord.GuildMember).has('CONNECT') || !this.message.member!.voice.channel!.permissionsFor(this.message.guild?.me as discord.GuildMember).has('SPEAK')) {
                this.message.channel.send('----------\nI don\'t have permission to join or speak in your voice channel.');
                return;
            }
            
            if (this.cmds.play.includes(argsInp[1])) { new Play(guildData, message, argsInp); return; }
            
            if (this.cmds.select.includes(argsInp[1])) { this.select(); return; };

            if (!this.guildData.queue.has(this.message.guildId as string)) {
                this.message.channel.send('----------\nThere is no music in queue.');
                return;
            }

            if (this.cmds.pause.includes(argsInp[1])) { this.pause(); return; };

            if (this.cmds.resume.includes(argsInp[1])) { this.resume(); return; };

            if (this.cmds.stop.includes(argsInp[1])) { this.stop(); return; };

            if (this.cmds.skip.includes(argsInp[1])) { this.skip(); return; };

            if (this.cmds.remove.includes(argsInp[1])) { this.remove(); return; };

            if (this.cmds.loop.includes(argsInp[1])) { this.loop(); return; }
        }
    }

    private async queue(): Promise<void> {
        if (!this.guildData.queue.has(this.message.guildId as string)) {
            this.message.channel.send('----------\nThere is no music in queue.');
            return;
        }

        let queue = this.guildData.queue.get(this.message.guildId as string)!.queue;
        let queueStr = '';

        for (let i = queue.length - 1; i >= 0; i--) {
            let videoDetails = (await ytdl.getInfo(queue[i])).videoDetails;
            queueStr += '\n> **' + (i > 0 ? i + '.' : 'Playing Now =>') + '** ' + videoDetails.title + '(' + Math.floor(parseInt(videoDetails.lengthSeconds) / 60) + ':' + parseInt(videoDetails.lengthSeconds) % 60 + ')';
        }

        this.message.channel.send(` 
==========
__**Queue**__
----------
**Queue Length:** ${queue.length},
**Music in queue:** ${queueStr}
**Loop:** ${this.guildData.queue.get(this.message.guildId as string)!.loop ? 'on' : 'off'}, **Pause:** ${this.guildData.queue.get(this.message.guildId as string)!.pause ? 'yes' : 'no'},
`);
    }

    private loop(): void {

        if (this.guildData.queue.get(this.message.guildId as string)!.loop) {
            this.guildData.queue.get(this.message.guildId as string)!.loop = false;
            this.message.channel.send('----------\nloop is off.\nTo unloop type `dj lp` or `dj loop` again.');
        } else {
            this.guildData.queue.get(this.message.guildId as string)!.loop = true;
            this.message.channel.send('----------\nloop is on\nTo loop type `dj lp` or `dj loop` again.');
        }

    }

    private remove(): void {
        if (this.argsInp.length < 2) {
            this.message.channel.send('----------\nYou must enter index of music to remove.\nType `dj rm <number>` or `dj remove <number>`.');
            return;
        }

        if (isNaN(parseFloat(this.argsInp[2]))) {
            this.message.channel.send('----------\nYou must enter number.\nType `dj remove <number>`.');
            return;
        }

        if (2 > Math.floor(parseFloat(this.argsInp[2])) || Math.floor(parseFloat(this.argsInp[2])) >= this.guildData.queue.get(this.message.guildId as string)!.queue.length) {
            this.message.channel.send('----------\nYou must enter number in index queue, between 2 and ' + this.guildData.queue.get(this.message.guildId as string)!.queue.length + '.');
            return;
        }

        this.guildData.queue.get(this.message.guildId as string)!.queue.splice(Math.floor(parseFloat(this.argsInp[2])), 1);
        this.message.channel.send('----------\nRemove music from index ' + Math.floor(parseFloat(this.argsInp[2])) + '.');
    }

    private skip(): void {
        if (this.guildData.queue.get(this.message.guildId as string)!.queue.length == 0) {
            this.message.channel.send('----------\nThere is no music in queue.');
        } else if (this.guildData.queue.get(this.message.guildId as string)!.queue.length >= 1) {
            this.guildData.queue.get(this.message.guildId as string)!.player.stop();
            this.guildData.queue.get(this.message.guildId as string)!.queue.shift();
            Play.playmusic(this.message, this.guildData);
            this.message.channel.send('----------\nSkip music.');
        }
    }

    private stop(): void {


        this.guildData.queue.get(this.message.guildId as string)!.connection.destroy();
        this.guildData.queue.delete(this.message.guildId as string);
        this.message.channel.send('----------\nStop music.\nBot Leave.');
        return;
    }

    private pause(): void {
        if (this.guildData.queue.get(this.message.guildId as string)!.pause) {
            this.message.channel.send('----------\nMusic had already puase.\nTo play type `dj rs` or `dj resume`\n');
        } else {
            this.guildData.queue.get(this.message.guildId as string)!.player.pause();
            this.guildData.queue.get(this.message.guildId as string)!.pause = true;
            this.message.channel.send('----------\nPause music.\nType `dj rs` or `dj resume` to continue music.');
        }
        return;
    }

    private resume(): void {
        if (!this.guildData.queue.get(this.message.guildId as string)!.pause) {
            this.message.channel.send('----------\nMusic had already resume.\n');
            return;
        } else {
            this.guildData.queue.get(this.message.guildId as string)!.player.unpause();
            this.guildData.queue.get(this.message.guildId as string)!.pause = false;
            this.message.channel.send('----------\nResume music.\n');
            return;

        }
    }

    private select(): void {
        if (!this.guildData.searchCache.has(this.message.guildId as string)) {
            this.message.channel.send('----------\nthere is no search list.\ntype \`dj p\` or \`dj play\` for search song.');
            return;
        }

        if (this.argsInp.length < 2) {
            this.message.channel.send('----------\nyou must type number to select.\nor type \`dj pf\` or \`dj play\` again to search song');
            return;
        }

        if (isNaN(parseFloat(this.argsInp[2]))) {
            this.message.channel.send('----------\nyou must type number only 1 - ' + this.guildData.searchCache.get(this.message.guildId as string)!.length);
            return;
        }

        if (1 > Math.round(parseFloat(this.argsInp[2])) || Math.round(parseFloat(this.argsInp[2])) >= this.guildData.searchCache.get(this.message.guildId as string)!.length) {
            this.message.channel.send('----------\nyou can select only 1 - ' + this.guildData.searchCache.get(this.message.guildId as string)!.length);
            return;
        }

        Play.addToQueue(this.message, this.guildData, this.guildData.searchCache.get(this.message.guildId as string)![Math.round(parseInt(this.argsInp[2])) - 1].url);
        return;
    }

    private commands(): void {
        this.message.channel.send(this.helpCmds);
    }

    private info(): void {
        this.message.channel.send('\n==========\n**About __DJ-Pes__**!!\n----------\n> **source code**: https://github.com/Chinchin1107/DJ-Pes\n> **author**: @Chinchin1107 (Anawach Anantachoke)\n> **License**: MIT' + '\n' + this.helpCmds);
    }

    private splitSpace = (str: string) => {
        var result = [''];
        var isSpace = false;
        for (let i = 0; i < str.length; i++) {
            if (str[i] != ' ') {
                if (isSpace) {
                    if (result.length > 1) {
                        result.push(str.slice(i));
                        return result;
                    } else {
                        result.push(str[i].toLowerCase());
                    }
                } else {
                    result[result.length - 1] += result.length > 2 ? str[i] : str[i].toLowerCase();
                }
                isSpace = false;
            } else {
                isSpace = true;
            }

        }
        return result;
    }
}

class Play {
    message: discord.Message;
    argsInp: string[]
    guildData: GuildDataModel;

    url!: string;
    searcher = new ytSearcher.YTSearcher({ key: JSON.parse(fs.readFileSync('token.json').toString()).token.youtube });

    constructor(guildData: GuildDataModel, message: discord.Message, argsInp: string[]) {
        this.guildData = guildData;
        this.message = message;
        this.argsInp = argsInp;

        this.init();
    }

    private async init(): Promise<void> {
        if (this.argsInp.length == 2) {
            this.message.channel.send('----------\nPlease type song info.');
            return;
        }

        if (ytdl.validateURL(this.argsInp[2])) {
            this.url = this.argsInp[2];
            Play.addToQueue(this.message, this.guildData, this.url);
        } else {
            const searchResult = await this.searcher.search(this.argsInp[2], { type: 'video' });

            if (searchResult.currentPage) {
                this.guildData.searchCache.set(this.message.guildId as string, searchResult.currentPage.slice(0, 5));
                this.message.channel.send('==========\nType `dj sl (1 - ' + (searchResult.currentPage.length <= 5 ? searchResult.currentPage.length : 5) + ')` or `dj select (1 - ' + (searchResult.currentPage.length <= 5 ? searchResult.currentPage.length : 5) + ')`\n');
                let i = 0;
                searchResult.currentPage.slice(0, 5).forEach(element => { this.message.channel.send('**' + (i + 1) + '.** ' + element.title + '\n'); i++; });
            } else {
                this.message.channel.send('----------\nCan\'t Find Music.');
            }
        }
    }

    static async addToQueue(message: discord.Message, guildData: GuildDataModel, url: string): Promise<void> {
        var connection = disVoice.getVoiceConnection(message.guildId as string);
        if (!connection || !connection.state.status || message.guild!.me!.voice.channelId !== message.member!.voice.channelId) {
            connection = disVoice.joinVoiceChannel({ channelId: message.member!.voice.channelId as string, guildId: message.guildId as string, adapterCreator: message.guild!.voiceAdapterCreator });

        }
        if (!guildData.queue.has(message.guildId as string)) {
            const player = disVoice.createAudioPlayer({
                behaviors: {
                    noSubscriber: disVoice.NoSubscriberBehavior.Pause
                }
            });
            connection.subscribe(player);
            guildData.queue.set(message.guildId as string, { channelId: message.channelId, connection: connection, player: player, loop: false, pause: false, queue: [url] });
            Play.playmusic(message, guildData);
        } else {
            guildData.queue.get(message.guildId as string)!.queue.push(url);
            guildData.queue.get(message.guildId as string)!.channelId = message.channelId;
        }

        let videoInfo = await ytdl.getInfo(url);
        message.channel.send('DJ Add: ' + videoInfo.videoDetails.title + '(' + Math.floor(parseInt(videoInfo.videoDetails.lengthSeconds) / 60) + ':' + parseInt(videoInfo.videoDetails.lengthSeconds) % 60 + ') into queue.');
    }

    static playmusic(message: discord.Message, guildData: GuildDataModel): void {
        var serverQueue = guildData.queue.get(message.guildId as string) as {
            channelId: string;
            connection: disVoice.VoiceConnection;
            player: disVoice.AudioPlayer;
            loop: boolean;
            queue: string[];
        };
        serverQueue.player.play(disVoice.createAudioResource(ytdl.default(serverQueue.queue[0], {
            filter: 'audioonly',
            quality: 'highestaudio',
            highWaterMark: 1 << 25,
        })));

        serverQueue.player.on(disVoice.AudioPlayerStatus.Idle, () => {
            serverQueue.loop ? serverQueue.queue.push(serverQueue.queue.shift() as string) : serverQueue.queue.shift();
            if (!serverQueue.queue.length) {
                guildData.queue.delete(message.guildId as string);
                message.channel.send('Queue End.\nBot leave.');
                serverQueue.connection.destroy();
                return;
            }
            serverQueue.player.play(disVoice.createAudioResource(ytdl.default(serverQueue.queue[0], {
                filter: 'audioonly',
                quality: 'highestaudio',
                highWaterMark: 1 << 25,
            })));
        });
    }
}
