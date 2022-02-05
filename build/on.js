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
Object.defineProperty(exports, "__esModule", { value: true });
exports.On = void 0;
const cmd = __importStar(require("./cmds"));
const disVoice = __importStar(require("@discordjs/voice"));
//models
require("./models/guildDataModel");
class On {
    constructor(guildData, client) {
        this.guildData = guildData;
        this.client = client;
        this.ready();
        this.messageCreate();
        this.voiceStateUpdate();
    }
    ready() {
        this.client.on('ready', () => {
            console.log('DJ Pes Come!!');
        });
    }
    messageCreate() {
        this.client.on('messageCreate', message => {
            if (message.author.bot || !message.content)
                return;
            new cmd.Cmds(this.guildData, message);
        });
    }
    voiceStateUpdate() {
        this.client.on('voiceStateUpdate', (oldState, newState) => {
            if (oldState.member.user.bot || !this.guildData.queue.has(oldState.guild.id) || oldState.channelId != oldState.guild.me.voice.channelId)
                return;
            const channelId = this.guildData.queue.get(oldState.guild.id).channelId;
            if (oldState.channel.members.size <= 1) {
                if (!newState.channelId || (newState.channelId && oldState.guild.id != newState.guild.id)) {
                    this.sendMsg(channelId, '----------\nno one else here.\nbot leave.\n');
                    this.guildData.queue.get(oldState.guild.id).player.stop();
                    this.guildData.queue.get(oldState.guild.id).connection.disconnect();
                    this.guildData.queue.delete(oldState.guild.id);
                }
                else {
                    if (newState.channel.permissionsFor(newState.guild.me).has('CONNECT') && newState.channel.permissionsFor(newState.guild.me).has('SPEAK')) {
                        this.guildData.queue.get(newState.guild.id).connection = disVoice.joinVoiceChannel({ channelId: newState.channelId, guildId: newState.guild.id, adapterCreator: newState.guild.voiceAdapterCreator });
                        this.sendMsg(channelId, '----------\nbot follow ' + newState.member.user.username + ' to the ' + newState.channel.name + ' channel.');
                    }
                    else {
                        this.sendMsg(channelId, '----------\nbot don\'t have permission to follow ' + newState.member.user.username + ' to the ' + newState.channel.name + ' channel.\nbot leave.');
                        this.guildData.queue.get(oldState.guild.id).player.stop();
                        this.guildData.queue.get(oldState.guild.id).connection.disconnect();
                        this.guildData.queue.delete(oldState.guild.id);
                    }
                }
            }
        });
    }
    sendMsg(channelId, message) {
        this.client.channels.cache.get(channelId).send(message);
    }
}
exports.On = On;
