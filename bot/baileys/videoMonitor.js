// videoMonitor.js
const videoLimit = 5; // Limite diário de vídeos permitidos
const maxWarnings = 3; // Limite de advertências antes da remoção
const userVideoData = {}; // Objeto para armazenar dados dos usuários

// Função para monitorar o envio de vídeos
export const monitorVideos = async (conn, message) => {
    const { remoteJid: from } = message.key; // ID do grupo/conversa
    const participant = message.key.participant || message.participant || from; // ID do remetente
    const videoMessage = message.message?.videoMessage; // Verifica se a mensagem é de vídeo

    // Verifique se `from` e `videoMessage` são definidos
    if (!from || !videoMessage) {
        return; // Sai da função se os valores essenciais estiverem indefinidos
    }

    const today = new Date().toDateString(); // Obtém a data de hoje

    // Inicializa os dados do usuário se não existir
    if (!userVideoData[participant]) {
        userVideoData[participant] = {
            count: 0,
            date: today,
            warnings: 0
        };
    }

    // Se a data armazenada não for igual à data de hoje, reseta a contagem
    if (userVideoData[participant].date !== today) {
        userVideoData[participant].count = 0; // Reseta a contagem diária de vídeos
        userVideoData[participant].date = today; // Atualiza a data
    }

    // Incrementa a contagem de vídeos do usuário
    userVideoData[participant].count++;

    // Verifica se o usuário ultrapassou o limite diário de vídeos
    if (userVideoData[participant].count === videoLimit) {
        const warningMessage = `@${participant.split('@')[0]}, 𝑽𝒐𝒄𝒆̂ 𝒆𝒏𝒗𝒊𝒐𝒖 𝟓 𝒗𝒊́𝒅𝒆𝒐𝒔. 𝑺𝒆 𝒎𝒂𝒏𝒅𝒂𝒓 𝒐 *𝒔𝒆𝒙𝒕𝒐* 🎥, 𝒗𝒐𝒄𝒆̂ 𝒓𝒆𝒄𝒆𝒃𝒆𝒓𝒂́ 𝒎𝒂𝒊𝒔 𝒖𝒎𝒂 𝒂𝒅𝒗𝒆𝒓𝒕𝒆̂𝒏𝒄𝒊𝒂. 𝑳𝒆𝒊𝒂 𝒂𝒔 𝒓𝒆𝒈𝒓𝒂𝒔! 📜`;
        await conn.sendMessage(from, { text: warningMessage, mentions: [participant] });
    }

    // Verifica se o usuário ultrapassou o limite diário e recebe uma advertência
    if (userVideoData[participant].count > videoLimit) {
        userVideoData[participant].warnings++; // Incrementa a contagem de advertências

        const warningCount = userVideoData[participant].warnings;
        
        // Mensagem de advertência informando o número atual de advertências
        const warningMessage = `@${participant.split('@')[0]}, você excedeu o limite de vídeos diários e recebeu uma *advertência*. Total de advertências: ${warningCount}/${maxWarnings}.`;
        await conn.sendMessage(from, { text: warningMessage, mentions: [participant] });

        // Verifica se o número de advertências atingiu o limite
        if (userVideoData[participant].warnings >= maxWarnings) {
            try {
                await conn.groupParticipantsUpdate(from, [participant], 'remove');
                delete userVideoData[participant]; // Reseta os dados do usuário após a remoção
            } catch (error) {
                console.error(`Erro ao remover ${participant} do grupo:`, error);
            }
        } else {
            // Reseta a contagem diária de vídeos, mas mantém as advertências
            userVideoData[participant].count = 0;
        }
    }
};
