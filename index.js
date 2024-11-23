const _lib = require('./lib/imports');

const rl = _lib.readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Função para gerar uma cor ANSI aleatória
function randomColor() {
    const colors = [
        '\x1b[31m', // Vermelho
        '\x1b[32m', // Verde
        '\x1b[33m', // Amarelo
        '\x1b[34m', // Azul
        '\x1b[35m', // Magenta
        '\x1b[36m', // Ciano
        '\x1b[37m', // Branco
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}


function colorize(text) {
    return text
        .split('')
        .map(char => (char.trim() ? randomColor() + char : char))
        .join('') + '\x1b[0m'; // Reseta a cor no final
}

let ANSI = `
 ██████╗ ███████╗███╗   ██╗ ██████╗  █████╗ ██████╗ ███████╗██╗   ██╗     ██████╗██╗     
██╔════╝ ██╔════╝████╗  ██║██╔════╝ ██╔══██╗██╔══██╗██╔════╝╚██╗ ██╔╝    ██╔════╝██║     
██║  ███╗█████╗  ██╔██╗ ██║██║  ███╗███████║██████╔╝█████╗   ╚████╔╝     ██║     ██║     
██║   ██║██╔══╝  ██║╚██╗██║██║   ██║██╔══██║██╔══██╗██╔══╝    ╚██╔╝      ██║     ██║     
╚██████╔╝███████╗██║ ╚████║╚██████╔╝██║  ██║██║  ██║██║        ██║       ╚██████╗███████╗
 ╚═════╝ ╚══════╝╚═╝  ╚═══╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝        ╚═╝        ╚═════╝╚══════╝
                                                                                         `;

console.log(colorize(ANSI));

const client = new _lib.Client();

rl.question('Digite o token da sua conta: ', (token) => {
    rl.question('Digite o ID do usuário cujas mensagens você deseja apagar: ', (userId) => {
        client.login(token).then(async () => {
            console.log('Login bem-sucedido!');
            await deleteAllMessagesInDM(userId);
            rl.close();
        }).catch(error => {
            console.error('Falha ao fazer login:', error);
            rl.close();
        });
    });
});

async function deleteAllMessagesInDM(userId) {
    try {
        const user = await client.users.fetch(userId);
        const dmChannel = await user.createDM();
        let messages = await dmChannel.messages.fetch({ limit: 100 });

        let deletedMessages = 0;
        const logStream = _lib.fs.createWriteStream('deleted_messages.txt', { flags: 'a' });

        while (messages.size > 0) {
            for (const message of messages.values()) {
                await message.delete();
                deletedMessages++;

                logStream.write(`Mensagem deletada: ${message.content}\n`);

                await new Promise(resolve => setTimeout(resolve, 1000)); // Delay de 1s para evitar a bct do rate limit
            }

            messages = await dmChannel.messages.fetch({ limit: 100 });
        }

        console.log(`Todas as mensagens do usuário ${userId} foram apagadas.`);
        logStream.close();  // Fecha o arquivo após terminar
    } catch (error) {
        console.error('Erro ao tentar apagar mensagens:', error);
    }
}

client.on('ready', () => {
    console.log(`Conectado como ${client.user.tag}`); 
});
