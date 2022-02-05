//modules
import * as discord from 'discord.js';
import * as cmd from './cmds';
import * as disVoice from '@discordjs/voice'

//models
import './models/guildDataModel';
import { GuildDataModel } from './models/guildDataModel';

export class On {
    client: discord.Client;
    guildData: GuildDataModel;

    constructor(guildData: GuildDataModel, client: discord.Client) {
        this.guildData = guildData;
        this.client = client;
        this.ready();
        this.messageCreate();
        this.voiceStateUpdate();
    }

    private ready(): void {
        this.client.on('ready', () => {
            console.log('DJ Pes Come!!');
        });
    }

    private messageCreate(): void {
        this.client.on('messageCreate', message => {
            if (message.author.bot || !message.content) return
            new cmd.Cmds(this.guildData, message)
        });
    }

    private voiceStateUpdate(): void {
        this.client.on('voiceStateUpdate', (oldState, newState) => {
            if (oldState.member!.user.bot || !this.guildData.queue.has(oldState.guild.id) || oldState.channelId != oldState.guild.me!.voice.channelId) return;
            const channelId = this.guildData.queue.get(oldState.guild.id)!.channelId;
            if (oldState.channel!.members.size <= 1) {
                if (!newState.channelId || (newState.channelId && oldState.guild.id != newState.guild.id)) {
                    this.sendMsg(channelId, '----------\nno one else here.\nbot leave.\n');
                    this.guildData.queue.get(oldState.guild.id)!.player.stop();
                    this.guildData.queue.get(oldState.guild.id)!.connection.disconnect();
                    this.guildData.queue.delete(oldState.guild.id);
                } else {
                    if (newState.channel!.permissionsFor(newState.guild.me as discord.GuildMember).has('CONNECT') && newState.channel!.permissionsFor(newState.guild.me as discord.GuildMember).has('SPEAK')) {
                        this.guildData.queue.get(newState.guild.id)!.connection = disVoice.joinVoiceChannel({ channelId: newState.channelId, guildId: newState.guild.id, adapterCreator: newState.guild.voiceAdapterCreator });

                        this.sendMsg(channelId, '----------\nbot follow ' + newState.member!.user.username + ' to the ' + newState.channel!.name + ' channel.');
                    } else {
                        this.sendMsg(channelId, '----------\nbot don\'t have permission to follow ' + newState.member!.user.username + ' to the ' + newState.channel!.name + ' channel.\nbot leave.');
                        this.guildData.queue.get(oldState.guild.id)!.player.stop();
                        this.guildData.queue.get(oldState.guild.id)!.connection.disconnect();
                        this.guildData.queue.delete(oldState.guild.id);
                    }
                }
            }
        });
    }

    private sendMsg(channelId: string, message: string): void {
        (this.client.channels.cache.get(channelId) as discord.TextChannel).send(message);
    }
}
