import * as disVoice from '@discordjs/voice';
import { VideoEntry } from 'ytsearcher';

export type QueueModel = Map<
    string,
    {
        channelId: string,
        connection: disVoice.VoiceConnection,
        player: disVoice.AudioPlayer,
        loop: boolean,
        pause: boolean,
        queue: string[],
    }
>;

export type SearchCacheModel = Map<string, VideoEntry[]>;

export type GuildDataModel = {
    queue: QueueModel,
    searchCache: SearchCacheModel,
};
