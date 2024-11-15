// removerCaracteres.js

// Função para remover participantes em caso de mensagens longas
export async function removerCaracteres(c, mensagem) {
    // Obtém o texto da mensagem, seja como 'conversation', 'extendedTextMessage', ou 'caption' de mídias
    const textoMensagem = mensagem.message?.conversation || 
                          mensagem.message?.extendedTextMessage?.text || 
                          mensagem.message?.imageMessage?.caption || 
                          mensagem.message?.videoMessage?.caption || 
                          mensagem.message?.documentMessage?.caption;

    if (textoMensagem) {
        // Verifica o comprimento total da mensagem
        const comprimentoTotal = textoMensagem.length;

        // Obtém o ID do usuário que enviou a mensagem
        const usuarioId = mensagem.key.participant || mensagem.key.remoteJid;
        const grupoId = mensagem.key.remoteJid;

        // Verifica se o usuário é um administrador no grupo
        const metadata = await c.groupMetadata(grupoId);
        const isAdmin = metadata.participants.some(participant => participant.id === usuarioId && (participant.admin === 'admin' || participant.admin === 'superadmin'));

        // Apenas se o usuário NÃO for administrador
        if (!isAdmin) {
            // Verifica se a mensagem tem mais de 950 caracteres
            if (comprimentoTotal > 950) {
                try {
                    await c.groupParticipantsUpdate(grupoId, [usuarioId], 'remove'); // Remove o usuário
                    await c.sendMessage(grupoId, { text: '✅🚫 𝐔𝐬𝐮𝐚𝐫𝐢𝐨 𝐛𝐚𝐧𝐢𝐝𝐨 𝐩𝐨𝐫 𝐦𝐞𝐧𝐬𝐚𝐠𝐞𝐦 𝐬𝐮𝐬𝐩𝐞𝐢𝐭𝐚 𝐜𝐨𝐦 𝐦𝐮𝐢𝐭𝐨𝐬 𝐜𝐚𝐫𝐚𝐜𝐭𝐞𝐫𝐞𝐬 𝐞𝐬𝐩𝐞𝐜𝐢𝐚𝐢𝐬 ✨💥 𝐞 𝐞𝐱𝐭𝐫𝐞𝐦𝐚𝐦𝐞𝐧𝐭𝐞𝐧𝐭𝐞 𝐥𝐨𝐧𝐠𝐚! 📝⛔' }); // Envia mensagem ao grupo
                    console.log(`Usuário ${usuarioId} banido por mensagem longa.`);
                } catch (error) {
                    console.error(`Erro ao remover participante:`, error);
                    await c.sendMessage(grupoId, { text: 'Erro ao tentar banir o usuário. ❌' });
                }
            }
        } else {
            console.log(`Usuário ${usuarioId} é administrador e não será removido.`);
        }
    }
}
