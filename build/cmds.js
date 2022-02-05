"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cmds = void 0;
const ytdl = __importStar(require("ytdl-core"));
const disVoice = __importStar(require("@discordjs/voice"));
const ytSearcher = __importStar(require("ytsearcher"));
const fs = __importStar(require("fs"));
class Cmds {
    constructor(guildData, message) {
        var _a, _b;
        this.cmds = {
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
        this.helpCmds = `==========
__**Commands List**__
----------
> **play**: \`p, pl, play <url> or <search>\`
> **select**: \`sl, select <number>\`
> **pause**: \`ps, pause\`\n> **resume**: \`rs, resume\`
> **stop**: \`st, stop\`\n> **skip**: \`sk, skip\`
> **remove**: \`rm, remove <number>\`\n> **loop**: \`lp, loop\`
> **queue**: \`q, que, queue\`\n> **cmds**: \`h, help, cmd, cmds, command, commands\`
> **info**: \`if, info\`
`;
        this.splitSpace = (str) => {
            var result = [''];
            var isSpace = false;
            for (let i = 0; i < str.length; i++) {
                if (str[i] != ' ') {
                    if (isSpace) {
                        if (result.length > 1) {
                            result.push(str.slice(i));
                            return result;
                        }
                        else {
                            result.push(str[i].toLowerCase());
                        }
                    }
                    else {
                        result[result.length - 1] += result.length > 2 ? str[i] : str[i].toLowerCase();
                    }
                    isSpace = false;
                }
                else {
                    isSpace = true;
                }
            }
            return result;
        };
        this.guildData = guildData;
        this.message = message;
        const argsInp = this.splitSpace(message.content);
        this.argsInp = argsInp;
        if (argsInp[0] == 'dj') {
            if ((argsInp.length <= 1 || !this.cmds.select.includes(argsInp[1])) && guildData.searchCache.has(message.guildId)) {
                this.guildData.searchCache.delete(message.guildId);
                return;
            }
            if (argsInp.length == 1 || this.cmds.info.includes(argsInp[1].toLowerCase())) {
                this.info();
                return;
            }
            if (this.cmds.cmds.includes(argsInp[1])) {
                this.commands();
                return;
            }
            if (this.cmds.play.includes(argsInp[1])) {
                new Play(guildData, message, argsInp);
                return;
            }
            if (this.cmds.select.includes(argsInp[1])) {
                this.select();
                return;
            }
            ;
            if (!this.guildData.queue.has(this.message.guildId)) {
                this.message.channel.send('----------\nThere is no music in queue.');
                return;
            }
            if (this.cmds.queue.includes(argsInp[1])) {
                this.queue();
                return;
            }
            ;
            if (!this.message.member.voice.channelId) {
                this.message.channel.send('----------\nYou must in voice channel for request music.');
                return;
            }
            if (!this.message.member.voice.channel.permissionsFor((_a = this.message.guild) === null || _a === void 0 ? void 0 : _a.me).has('CONNECT') || !this.message.member.voice.channel.permissionsFor((_b = this.message.guild) === null || _b === void 0 ? void 0 : _b.me).has('SPEAK')) {
                this.message.channel.send('----------\nI don\'t have permission to join or speak in your voice channel.');
                return;
            }
            if (this.cmds.pause.includes(argsInp[1])) {
                this.pause();
                return;
            }
            ;
            if (this.cmds.resume.includes(argsInp[1])) {
                this.resume();
                return;
            }
            ;
            if (this.cmds.stop.includes(argsInp[1])) {
                this.stop();
                return;
            }
            ;
            if (this.cmds.skip.includes(argsInp[1])) {
                this.skip();
                return;
            }
            ;
            if (this.cmds.remove.includes(argsInp[1])) {
                this.remove();
                return;
            }
            ;
            if (this.cmds.loop.includes(argsInp[1])) {
                this.loop();
                return;
            }
        }
    }
    queue() {
        return __awaiter(this, void 0, void 0, function* () {
            let queue = this.guildData.queue.get(this.message.guildId).queue;
            let queueStr = '';
            for (let i = queue.length - 1; i >= 0; i--) {
                let videoDetails = (yield ytdl.getInfo(queue[i])).videoDetails;
                queueStr += '\n> **' + (i > 0 ? i + '.' : 'Playing Now =>') + '** ' + videoDetails.title + '(' + Math.floor(parseInt(videoDetails.lengthSeconds) / 60) + ':' + parseInt(videoDetails.lengthSeconds) % 60 + ')';
            }
            this.message.channel.send(` 
==========
__**Queue**__

**Queue Length:** ${queue.length},
**Music in queue:**'  ${queueStr}
**Loop:** ${this.guildData.queue.get(this.message.guildId).loop ? 'on' : 'off'}
**Pause:** ${this.guildData.queue.get(this.message.guildId).pause ? 'yes' : 'no'}
`);
        });
    }
    loop() {
        if (this.guildData.queue.get(this.message.guildId).loop) {
            this.guildData.queue.get(this.message.guildId).loop = false;
            this.message.channel.send('----------\nloop is off.');
        }
        else {
            this.guildData.queue.get(this.message.guildId).loop = true;
            this.message.channel.send('----------\nloop is on.');
        }
    }
    remove() {
        if (this.argsInp.length < 2) {
            this.message.channel.send('----------\nYou must enter index of music to remove.\nType `dj remove <number>`.');
            return;
        }
        if (isNaN(parseFloat(this.argsInp[1]))) {
            this.message.channel.send('----------\nYou must enter number.\nType `dj remove <number>`.');
            return;
        }
        if (2 > Math.floor(parseFloat(this.argsInp[1])) || Math.floor(parseFloat(this.argsInp[1])) >= this.guildData.queue.get(this.message.guildId).queue.length) {
            this.message.channel.send('----------\nYou must enter number in index queue, between 2 and ' + this.guildData.queue.get(this.message.guildId).queue.length + '.');
            return;
        }
        this.guildData.queue.get(this.message.guildId).queue.splice(Math.floor(parseFloat(this.argsInp[1])), 1);
        this.message.channel.send('----------\nRemove music from index ' + Math.floor(parseFloat(this.argsInp[1])) + '.');
    }
    skip() {
        if (this.guildData.queue.get(this.message.guildId).queue.length == 0) {
            this.message.channel.send('----------\nThere is no music in queue.');
        }
        else if (this.guildData.queue.get(this.message.guildId).queue.length >= 1) {
            this.guildData.queue.get(this.message.guildId).player.stop();
            this.guildData.queue.get(this.message.guildId).queue.shift();
            Play.playmusic(this.message, this.guildData);
            this.message.channel.send('----------\nSkip music.');
        }
    }
    stop() {
        this.guildData.queue.get(this.message.guildId).connection.destroy();
        this.guildData.queue.delete(this.message.guildId);
        this.message.channel.send('----------\nStop music.\nBot Leave.');
        return;
    }
    pause() {
        if (this.guildData.queue.get(this.message.guildId).pause) {
            this.message.channel.send('----------\nMusic had already puase.\n');
        }
        else {
            this.guildData.queue.get(this.message.guildId).player.pause();
            this.guildData.queue.get(this.message.guildId).pause = true;
            this.message.channel.send('----------\nPause music.\nType `dj resume` to continue music.');
        }
        return;
    }
    resume() {
        if (!this.guildData.queue.get(this.message.guildId).pause) {
            this.message.channel.send('----------\nMusic had already resume.\n');
            return;
        }
        else {
            this.guildData.queue.get(this.message.guildId).player.unpause();
            this.guildData.queue.get(this.message.guildId).pause = false;
            this.message.channel.send('----------\nResume music.\n');
            return;
        }
    }
    select() {
        if (!this.guildData.searchCache.has(this.message.guildId)) {
            this.message.channel.send('----------\nthere is no search list.\ntype \'dj play\' for search song.');
            return;
        }
        if (this.argsInp.length < 2) {
            this.message.channel.send('----------\nyou must type number to select.\nor type \'dj play\' again to search song');
            return;
        }
        if (isNaN(parseFloat(this.argsInp[2]))) {
            this.message.channel.send('----------\nyou must type number only 1 - ' + this.guildData.searchCache.get(this.message.guildId).length);
            return;
        }
        if (1 > Math.round(parseFloat(this.argsInp[2])) || Math.round(parseFloat(this.argsInp[2])) >= this.guildData.searchCache.get(this.message.guildId).length) {
            this.message.channel.send('----------\nyou can select only 1 - ' + this.guildData.searchCache.get(this.message.guildId).length);
            return;
        }
        Play.addToQueue(this.message, this.guildData, this.guildData.searchCache.get(this.message.guildId)[Math.round(parseInt(this.argsInp[2])) - 1].url);
        return;
    }
    commands() {
        this.message.channel.send(this.helpCmds);
    }
    info() {
        this.message.channel.send('\n==========\n**About __DJ-Pes__**!!\n----------\n> **source code**: https://github.com/Chinchin1107/DJ-Pes\n> **author**: @Chinchin1107 (Anawach Anantachoke)\n> **License**: MIT' + '\n' + this.helpCmds);
    }
}
exports.Cmds = Cmds;
class Play {
    constructor(guildData, message, argsInp) {
        this.searcher = new ytSearcher.YTSearcher({ key: JSON.parse(fs.readFileSync('token.json').toString()).token.youtube });
        this.guildData = guildData;
        this.message = message;
        this.argsInp = argsInp;
        this.init();
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.argsInp.length == 2) {
                this.message.channel.send('----------\nPlease type song info.');
                return;
            }
            if (ytdl.validateURL(this.argsInp[2])) {
                this.url = this.argsInp[2];
                Play.addToQueue(this.message, this.guildData, this.url);
            }
            else {
                const searchResult = yield this.searcher.search(this.argsInp[2], { type: 'video' });
                if (searchResult.currentPage) {
                    this.guildData.searchCache.set(this.message.guildId, searchResult.currentPage.slice(0, 5));
                    this.message.channel.send('==========\nType `dj sl (1 - ' + (searchResult.currentPage.length <= 5 ? searchResult.currentPage.length : 5) + ')` or `dj select (1 - ' + (searchResult.currentPage.length <= 5 ? searchResult.currentPage.length : 5) + '`\n');
                    let i = 0;
                    searchResult.currentPage.slice(0, 5).forEach(element => { this.message.channel.send('**' + (i + 1) + '.** ' + element.title + '\n'); i++; });
                }
                else {
                    this.message.channel.send('----------\nCan\'t Find Music.');
                }
            }
        });
    }
    static addToQueue(message, guildData, url) {
        return __awaiter(this, void 0, void 0, function* () {
            var connection = disVoice.getVoiceConnection(message.guildId);
            if (!connection || !connection.state.status || message.guild.me.voice.channelId !== message.member.voice.channelId) {
                connection = disVoice.joinVoiceChannel({ channelId: message.member.voice.channelId, guildId: message.guildId, adapterCreator: message.guild.voiceAdapterCreator });
            }
            if (!guildData.queue.has(message.guildId)) {
                const player = disVoice.createAudioPlayer({
                    behaviors: {
                        noSubscriber: disVoice.NoSubscriberBehavior.Pause
                    }
                });
                connection.subscribe(player);
                guildData.queue.set(message.guildId, { channelId: message.channelId, connection: connection, player: player, loop: false, pause: false, queue: [url] });
                Play.playmusic(message, guildData);
            }
            else {
                guildData.queue.get(message.guildId).queue.push(url);
                guildData.queue.get(message.guildId).channelId = message.channelId;
            }
            let videoInfo = yield ytdl.getInfo(url);
            message.channel.send('DJ Add: ' + videoInfo.videoDetails.title + '(' + Math.floor(parseInt(videoInfo.videoDetails.lengthSeconds) / 60) + ':' + parseInt(videoInfo.videoDetails.lengthSeconds) % 60 + ') into queue.');
        });
    }
    static playmusic(message, guildData) {
        var serverQueue = guildData.queue.get(message.guildId);
        serverQueue.player.play(disVoice.createAudioResource(ytdl.default(serverQueue.queue[0], {
            filter: 'audioonly',
            quality: 'highestaudio',
            highWaterMark: 1 << 25,
        })));
        serverQueue.player.on(disVoice.AudioPlayerStatus.Idle, () => {
            serverQueue.loop ? serverQueue.queue.push(serverQueue.queue.shift()) : serverQueue.queue.shift();
            if (!serverQueue.queue.length) {
                guildData.queue.delete(message.guildId);
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
