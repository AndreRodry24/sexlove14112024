// Arquivo: bloquearUsuarios.js

// Função para inicializar e configurar o bot com bloqueio de mensagens privadas
async function configurarBloqueio(sock) {
    // Armazena contadores de mensagens de usuários
    const contadoresMensagens = new Map();

    // IDs dos usuários que não devem ser bloqueados
    const usuariosPermitidos = [
        '559193670996@s.whatsapp.net',   //vania
        '559193310860@s.whatsapp.net',  //vania
        '5514981930016@s.whatsapp.net'  //bot
    ];

    // Função para processar mensagens recebidas
    sock.ev.on('messages.upsert', async (msg) => {
        const mensagem = msg.messages[0];
        if (!mensagem.message) return;

        const remetenteId = mensagem.key.remoteJid;

        // Verifica se a mensagem é privada (ID termina com '@s.whatsapp.net')
        if (remetenteId.endsWith('@s.whatsapp.net')) {
            // Ignora usuários permitidos
            if (usuariosPermitidos.includes(remetenteId)) {
                console.log(`Mensagem de usuário permitido: ${remetenteId}`);
                return; // Não bloqueia e sai da função
            }

            // Incrementa o contador de mensagens para o remetente
            if (!contadoresMensagens.has(remetenteId)) {
                contadoresMensagens.set(remetenteId, 1);
                console.log(`Recebendo mensagem privada de: ${remetenteId}`);
            } else {
                const contador = contadoresMensagens.get(remetenteId);
                contadoresMensagens.set(remetenteId, contador + 1);
                console.log(`Usuário ${remetenteId} enviou ${contador + 1} mensagens.`);

                // Bloqueia o usuário após a segunda mensagem
                if (contador + 1 === 2) {
                    try {
                        // Bloqueia o usuário no WhatsApp
                        await sock.updateBlockStatus(remetenteId, 'block');
                        console.log(`Usuário ${remetenteId} bloqueado após enviar 2 mensagens.`);
                    } catch (error) {
                        console.error(`Erro ao bloquear usuário ${remetenteId}: ${error.message}`);
                    }
                }
            }
        }
    });
}

export default configurarBloqueio;