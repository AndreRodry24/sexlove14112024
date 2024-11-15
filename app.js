import { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import * as eventosSocket from './bot/baileys/eventosSocket.js';
import { BotControle } from './bot/controles/BotControle.js';
import { MensagemControle } from './bot/controles/MensagemControle.js';
import configSocket from './bot/baileys/configSocket.js';
import moment from 'moment-timezone';
import NodeCache from 'node-cache';
import { handleGroupParticipantsUpdate } from './bot/baileys/avisoadm.js';
import { monitorVideos } from './bot/baileys/videoMonitor.js';
import { handleMessage } from './bot/baileys/advertenciaGrupos.js';
import { mencionarTodos } from './bot/baileys/marcarTodosGrupo.js';
import { removerCaracteres } from './bot/baileys/removerCaracteres.js';
import { configurarBoasVindas } from './bot/baileys/boasVindas.js';
import configurarBloqueio from './bot/baileys/bloquearUsuarios.js';
// Definindo o fuso horário
moment.tz.setDefault('America/Sao_Paulo');

// Cache de tentativas de envios
const cacheTentativasEnvio = new NodeCache();

async function connectToWhatsApp() {
    let inicializacaoCompleta = false;
    const eventosEsperando = [];
    const { state: estadoAuth, saveCreds } = await useMultiFileAuthState('sessao');
    const { version: versaoWaWeb } = await fetchLatestBaileysVersion();
    const c = makeWASocket(configSocket(estadoAuth, cacheTentativasEnvio, versaoWaWeb));
    const bot = new BotControle();

    // Limpando mensagens armazenadas da sessão anterior
    await new MensagemControle().limparMensagensArmazenadas();

    // Configurar boas-vindas e bloqueio de mensagens privadas
    configurarBoasVindas(c);
    configurarBloqueio(c); // Chamando a função de configuração de bloqueio

    // Escutando novos eventos
    c.ev.process(async (events) => {
        const botInfo = await bot.obterInformacoesBot();

        try {
            if (events['connection.update']) {
                const update = events['connection.update'];
                const { connection } = update;

                if (connection === 'open') {
                    await eventosSocket.conexaoAberta(c, botInfo);
                    inicializacaoCompleta = await eventosSocket.atualizacaoDadosGrupos(c, botInfo);
                    await eventosSocket.realizarEventosEspera(c, eventosEsperando);
                } else if (connection === 'close') {
                    const necessarioReconectar = await eventosSocket.conexaoEncerrada(update, botInfo);
                    if (necessarioReconectar) connectToWhatsApp();
                }
            }

            if (events['creds.update']) {
                await saveCreds();
            }

            if (events['messages.upsert']) {
                const m = events['messages.upsert'];
                if (inicializacaoCompleta) {
                    await eventosSocket.receberMensagem(c, m, botInfo);

                    await Promise.all(
                        m.messages.map(async (mensagem) => {
                            const remetenteId = mensagem.key.remoteJid;

                            // Processa outras mensagens normalmente
                            await removerCaracteres(c, mensagem);
                            await handleMessage(c, mensagem);
                            await mencionarTodos(c, mensagem);

                            if (mensagem.message?.videoMessage) {
                                await monitorVideos(c, mensagem);
                            }
                        })
                    );
                } else {
                    eventosEsperando.push({ evento: 'messages.upsert', dados: m });
                }
            }

            if (events['group-participants.update']) {
                const atualizacao = events['group-participants.update'];
                console.log('Evento de atualização de participantes recebido:', atualizacao);

                if (inicializacaoCompleta) {
                    await handleGroupParticipantsUpdate(c, atualizacao, botInfo);
                } else {
                    eventosEsperando.push({ evento: 'group-participants.update', dados: atualizacao });
                }
            }
        } catch (error) {
            console.error('Erro ao processar eventos:', error);
        }
    });

    c.ev.on('messages.reaction', async (reaction) => {
        console.log('Reação recebida:', reaction);
        await eventosSocket.reagirMensagem(c, reaction);
    });

    c.ev.on('chats.set', async (chats) => {
        console.log('Conjunto de chats atualizado:', chats);
    });
}

// Conectar ao WhatsApp
connectToWhatsApp();
