const discord = require('discord.js');
const client = new discord.Client({ 'intents': ['GUILDS', 'GUILD_MESSAGES', 'GUILD_VOICE_STATES'] });

const disVoice = require('@discordjs/voice');
const ytdl = require('ytdl-core');
const { getInfo } = require('ytdl-core');

const cmds = { 'play': ['p', 'play'], 'select': ['sl', 'select'], 'skip': ['sk', 'skip'], 'remove': ['rm', 'remove'], 'pause': ['ps', 'pause'], 'stop': ['st', 'stop', 'shutup'], 'queue': ['q', 'queue'], 'help': ['h', 'help', 'cmd', 'command', 'cmds'], 'info': ['info', 'if'] };
const helpCmd = 'Help Command:\nstart type with \'dj\'\nbot info: type dj info or only type dj\nplay: p, play\nselect: sl, select\nskip: sk, skip\nremove: rm, remove\npause: ps, pause\nstop: st, stop, shutup\nqueue: q, queue\nhelp command: h, help, cmd, command';
var queue = new Map();

client.on('ready', () => console.log('DJ Pes Come!!'));
client.on('messageCreate', async message => {
    if (message.author.bot || !message.content) return;
    const argsInp = splitSpace(message.content);
    if (argsInp[0].toLowerCase() == 'dj') {

        if (argsInp.length == 1 || cmds.info.includes(argsInp[1].toLowerCase())) {
            message.channel.send('DJ Pes Come!!\n==========\nLicense: MIT\nauthor: @Chinchin1107 (Anawach Anantachoke)\nsource code: https://github.com/Chinchin1107/DJ-Pes\n' + '==========\n' + helpCmd + '\n==========');
            return;
        }

        if (cmds.help.includes(argsInp[1].toLowerCase())) {
            message.channel.send(helpCmd);
            return;
        }

        if (cmds.play.includes(argsInp[1].toLowerCase())) {
            if (argsInp.length == 2) {
                message.channel.send('Please type song info.');
                return;
            }

            if (!message.member.voice.channelId) {
                message.channel.send('You must in voice channel for request music.');
                return;
            }

            if (!message.member.voice.channel.permissionsFor(message.client.user).has('CONNECT') || !message.member.voice.channel.permissionsFor(message.client.user).has('SPEAK')) {
                message.channel.send('I don\'t have permission to join or speak in your voice channel.');
                return;
            }


            if (ytdl.validateURL(argsInp[2])) {
                addToQueue(message, argsInp[2]);
            }
        }
    }
});

client.on('voiceStateUpdate', (oldState, newState) => {
    if (oldState.member.user.bot || !queue.has(oldState.guild.id) || oldState.channelId != oldState.guild.me.voice.channelId) return;
    const channelId = queue.get(oldState.guild.id).channelId;
    if (oldState.channel?.members.size <= 1) {
        if (!newState.channelId || (newState.channelId && oldState.guild.id != newState.guild.id)) {
            sendMsg(channelId, 'No one else here.\nBot leave.\n');
            queue.get(oldState.guild.id).player.stop();
            queue.get(oldState.guild.id).connection.disconnect();
            queue.delete(oldState.guild.id);
        } else {
            if (newState.channel.permissionsFor(newState.client.user).has('CONNECT') && newState.channel.permissionsFor(newState.client.user).has('SPEAK')) {
                queue.get(newState.guild.id).connection = disVoice.joinVoiceChannel({channelId: newState.channelId, guildId: newState.guild.id, adapterCreator: newState.guild.voiceAdapterCreator});
                sendMsg(channelId, 'Bot follow ' + newState.member.user.username + ' to the ' + newState.channel.name + ' channel.');
            } else {
                sendMsg(channelId, 'Bot don\'t have permission to follow ' + newState.member.user.username + ' to the ' + newState.channel.name + ' channel.\nBot leave.');
                queue.get(oldState.guild.id).player.stop();
                queue.get(oldState.guild.id).connection.disconnect();
                queue.delete(oldState.guild.id);
            }
        }
    }
});

const addToQueue = async (message, url) => {
    var connection = disVoice.getVoiceConnection(message.guild.id);
    if (!connection || !connection.state.status || message.guild.me.voice.channelId !== message.member.voice.channelId) {
        connection = disVoice.joinVoiceChannel({ channelId: message.member.voice.channelId, guildId: message.guild.id, adapterCreator: message.guild.voiceAdapterCreator });
    }
    if (!queue.has(message.guild.id)) {
        const player = disVoice.createAudioPlayer({
            behaviors: {
                noSubscriber: disVoice.NoSubscriberBehavior.Pause
            }
        });
        connection.subscribe(player);
        queue.set(message.guild.id, { channelId: message.channelId, connection: connection, player: player, loop: false, queue: [url] });
        playMusic(message);
    } else {
        queue.get(message.guild.id).queue.push(url);
        queue.get(message.guild.id).channelId = message.channelId;
    }

    let videoInfo = await ytdl.getInfo(url);
    message.channel.send('DJ Add: ' + videoInfo.videoDetails.title + '(' + Math.floor(videoInfo.videoDetails.lengthSeconds / 60) + ':' + videoInfo.videoDetails.lengthSeconds % 60 + ') into queue.');
}

const playMusic = (message) => {
    var serverQueue = queue.get(message.guild.id);
    serverQueue.player.play(disVoice.createAudioResource(ytdl(serverQueue.queue[0], {
        filter: 'audioonly',
        quality: 'highestaudio',
        highWaterMark: 1 << 25,
    })));

    serverQueue.player.on(disVoice.AudioPlayerStatus.Idle, () => {
        serverQueue.queue.shift();
        if (!serverQueue.queue.length) {
            queue.delete(message.guild.id);
            message.channel.send('Queue End.\nBot leave.');
            serverQueue.connection.destroy();
            return;
        }
        serverQueue.player.play(disVoice.createAudioResource(ytdl(serverQueue.queue[0], {
            filter: 'audioonly',
            quality: 'highestaudio',
            highWaterMark: 1 << 25,
        })));
    });
}

const sendMsg = (channelId, msg) => {
    client.channels.cache.get(channelId).send(msg);
}

const splitSpace = (str) => {
    var result = [''];
    var isSpace = false;
    for (let i = 0; i < str.length; i++) {
        if (str[i] != ' ') {
            if (isSpace) {
                if (result.length > 1) {
                    result.push(str.slice(i));
                    return result;
                } else {
                    result.push(str[i]);
                }
            } else {
                result[result.length - 1] += str[i];
            }
            isSpace = false;
        } else {
            isSpace = true;
        }
    }
    return result;
}

client.login('OTM3MTkxNzIyODYwMDIzOTQ5.YfYJzg.BvmIHeJ1lKLpiH9BR9nIzWNn7G0')
