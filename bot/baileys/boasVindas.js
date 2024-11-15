export const configurarBoasVindas = (socket) => {
    socket.ev.on('group-participants.update', async (update) => {
        const { id, participants, action } = update;
        console.log("Evento de atualização de participantes:", update);

        if (action === 'add') {
            console.log("Participantes adicionados:", participants);

            for (const participant of participants) {
                try {
                    // Obtendo o nome do participante
                    const participantName = participant.split('@')[0];
                    console.log(`Nome do participante: ${participantName}`);

                    // Tentando obter a foto de perfil do participante
                    let profilePictureUrl;
                    try {
                        profilePictureUrl = await socket.profilePictureUrl(participant, 'image');
                        console.log(`URL da foto de perfil para ${participantName}:`, profilePictureUrl);
                    } catch (error) {
                        console.log(`Erro ao obter a foto de perfil de ${participantName}:`, error);
                        profilePictureUrl = 'https://images2.imgbox.com/5a/fa/YNrZBov6_o.png';
                    }

                    // Criando a mensagem de boas-vindas com menção
                    const welcomeMessage = {
                        text: `🎉 𝐁𝐄𝐌-𝐕𝐈𝐍𝐃𝐎(𝐚) 𝐚𝐨 𝐠𝐫𝐮𝐩𝐨 ꧁🍀🥰😈 *Տᗴ᙭ ᒪOᐯᗴ* 😈🥰🍀꧂, @${participantName}! 🎉Aqui é o lugar perfeito para se *divertir, interagir e compartilhar bons momentos* com a galera! 😎✨ Participe das conversas e aproveite ao máximo! 💬💖 \n \n 𝒟𝑖𝑔𝑖𝑡𝑒 *#𝑟𝑒𝑔𝑟𝑎𝑠* 𝑝𝑎𝑟𝑎 𝑠𝑎𝑏𝑒𝑟 𝑞𝑢𝑎𝑖𝑠 𝑠𝑎𝑜.📜`,
                        mentions: [participant]
                    };

                    console.log("Enviando foto de perfil e mensagem de boas-vindas...");

                    // Enviando mensagem com ou sem a imagem de perfil
                    if (profilePictureUrl) {
                        await socket.sendMessage(id, { 
                            image: { url: profilePictureUrl }, 
                            caption: welcomeMessage.text, 
                            mentions: [participant]
                        });
                    } else {
                        await socket.sendMessage(id, { 
                            text: welcomeMessage.text, 
                            mentions: [participant]
                        });
                    }

                    console.log("Foto de perfil e mensagem de boas-vindas enviadas com sucesso!");

                } catch (error) {
                    console.error('Erro ao enviar mensagem de boas-vindas:', error);
                }
            }
        } else {
            console.log("Ação não é de adição de participantes, ignorando...");
        }
    });
};