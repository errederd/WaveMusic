const { ShardingManager } = require('discord.js');
const fs = require('fs');
const config = require('./config.js');
const Logger = require('./structures/Logger.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus } = require('@discordjs/voice');

const logger = new Logger();

if (!fs.existsSync('./src/utils/Logo.txt')) {
    logger.error('LavaLogo.txt file is missing');
    process.exit(1);
}

try {
    const logFile = fs.readFileSync('./src/utils/Logo.txt', 'utf-8');
    console.log('\x1b[35m%s\x1b[0m', logFile);
} catch (err) {
    logger.error('[CLIENT] An error has occurred :', err);
}

const manager = new ShardingManager('./src/client.js', {
    respawn: true,
    token: config.token,
    totalShards: 'auto',
    shardList: 'auto',
});

manager
    .spawn({ amount: manager.totalShards, delay: null, timeout: -1 })
    .then(shards => {
        logger.start(`[CLIENT] ${shards.size} shard(s) spawned.`);
    })
    .catch(err => {
        logger.error('[CLIENT] An error has occurred :', err);
    });

manager.on('shardCreate', shard => {
    shard.on('ready', async () => {
        logger.start(`[CLIENT] Shard ${shard.id} connected to Discord's Gateway.`);

        // Se espera a que el bot esté listo
        shard.client.on('ready', async () => {
            logger.start(`[CLIENT] Client ready, processing voice connection.`);

            const channelId = 'TU_CANAL_DE_VOZ_ID';
            const guildId = 'TU_GUILD_ID';
            const channel = shard.client.channels.cache.get(channelId);

            if (channel && channel.isVoice()) {
                const connection = joinVoiceChannel({
                    channelId: channel.id,
                    guildId: guildId,
                    adapterCreator: channel.guild.voiceAdapterCreator,
                });

                connection.on(VoiceConnectionStatus.Ready, () => {
                    logger.start(`[CLIENT] Conectado al canal de voz ${channel.name}.`);

                    const player = createAudioPlayer();
                    const resource = createAudioResource('./path/to/sonics.ogg');

                    player.play(resource);
                    connection.subscribe(player);

                    player.on(AudioPlayerStatus.Idle, () => {
                        connection.destroy();
                    });
                });
            } else {
                logger.error('[CLIENT] No se encontró el canal de voz.');
            }
        });
    });
});
