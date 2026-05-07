// ==========================================================================
// CAPTURA DE ELEMENTOS E INICIALIZAÇÃO
// ==========================================================================
const form = document.getElementById('chamadoForm');
const tabelaCorpo = document.getElementById('tabelaCorpo');

// Executa as funções iniciais assim que o documento HTML estiver totalmente carregado
document.addEventListener('DOMContentLoaded', () => {
    definirDataAtual();
    renderizarTabela();
});

/**
 * Define a data atual do sistema no formato correto para o campo tipo 'date'
 */
function definirDataAtual() {
    const campoData = document.getElementById('data');
    if (campoData) {
        campoData.valueAsDate = new Date();
    }
}

// ==========================================================================
// TRATAMENTO DO ENVIO DO FORMULÁRIO (SALVAR)
// ==========================================================================
form.addEventListener('submit', (event) => {
    event.preventDefault(); // Impede a página de recarregar

    // Captura os valores dos campos
    const cliente = document.getElementById('cliente').value.trim();
    const tecnico = document.getElementById('tecnico').value;
    const departamento = document.getElementById('departamento').value;
    const problema = document.getElementById('problema').value.trim();
    const status = document.getElementById('status').value;
    const chamadoGlpi = document.getElementById('chamadoGlpi').value.trim() || '---';
    const statusGlpi = document.getElementById('statusGlpi').value;

    // Captura e formata a data para o padrão brasileiro (dd/mm/aaaa)
    const dataRaw = document.getElementById('data').value;
    const dataFormatada = dataRaw ? dataRaw.split('-').reverse().join('/') : '---';

    // Cria o objeto do novo chamado
    const novoChamado = {
        id: Date.now(), // ID único baseado no timestamp atual
        cliente,
        tecnico,
        departamento,
        problema,
        status,
        chamadoGlpi,
        statusGlpi,
        data: dataFormatada
    };

    // Salva o chamado, limpa o formulário e recarrega a tabela visualmente
    salvarChamado(novoChamado);
    form.reset();
    definirDataAtual();
    renderizarTabela();
});

// ==========================================================================
// GERENCIAMENTO DO LOCALSTORAGE (BANCO DE DADOS LOCAL)
// ==========================================================================

/**
 * Busca todos os chamados existentes no banco de dados local do navegador
 * @returns {Array} Lista de chamados salvos
 */
function obterChamados() {
    const chamados = localStorage.getItem('meusChamados');
    return chamados ? JSON.parse(chamados) : [];
}

/**
 * Adiciona um novo chamado na lista existente no LocalStorage
 * @param {Object} chamado 
 */
function salvarChamado(chamado) {
    const chamados = obterChamados();
    chamados.push(chamado);
    localStorage.setItem('meusChamados', JSON.stringify(chamados));
}

// ==========================================================================
// RENDERIZAÇÃO DA TABELA (INTERFACE GRÁFICA)
// ==========================================================================

// 1. Cadastre aqui os números de WhatsApp dos seus técnicos (com DDD e apenas números)
const telefonesTecnicos = {
    "Elia Souza": "5591982339287",  // Substitua pelo número real (Ex: 55 + DDD + Número)
    "Lucas Lima": "5591984845696",
    "Raphael Paiva": "5591982514451",
    "David Azevedo": "5591981243528",
    "Jairo Rodrigues": "5591988074195",
    "Leonardo Rafael": "5591985120045",
    "Luiz Gonzaga": "5591991903894",
    "Max Fontão": "5591993668297",
    "Osvaldo Junior": "5591989168776"
};

/**
 * Reconstrói as linhas da tabela HTML com base nos dados do LocalStorage
 */
function renderizarTabela() {
    const chamados = obterChamados();
    tabelaCorpo.innerHTML = ''; // Limpa os registros existentes na tela

    // Se não houver registros salvos, exibe uma mensagem amigável na tabela
    if (chamados.length === 0) {
        tabelaCorpo.innerHTML = `
            <tr>
                <td colspan="10" style="text-align: center; color: #a0aec0; padding: 20px;">
                    Nenhum chamado registrado até o momento.
                </td>
            </tr>`;
        return;
    }

    chamados.forEach((chamado) => {
        const tr = document.createElement('tr');

        // Define a classe CSS do status interno
        let classeStatus = 'status-pendente';
        if (chamado.status === 'Em Andamento') {
            classeStatus = 'status-andamento';
        } else if (chamado.status === 'Finalizado') {
            classeStatus = 'status-finalizado';
        }

        const problemaResumido = chamado.problema.length > 35
            ? chamado.problema.substring(0, 32) + '...'
            : chamado.problema;

        // ==========================================
        // GERAÇÃO DA MENSAGEM DO WHATSAPP
        // ==========================================
        const telefone = telefonesTecnicos[chamado.tecnico] || '';
        let botaoWhats = '---';

        if (telefone) {
            // Texto personalizado que o técnico vai receber
            const textoMensagem = `Olá ${chamado.tecnico}, você tem um novo chamado designado!\n\n` +
                `👤 *Usuário (Cliente):* ${chamado.cliente}\n` +
                `🏢 *Departamento/Setor:* ${chamado.departamento}\n` +
                `🛠️ *Problema:* ${chamado.problema}\n` +
                `🎫 *Nº GLPI:* ${chamado.chamadoGlpi}\n\n` +
                `Favor se deslocar até o setor para prestar o atendimento.`;

            // Codifica o texto para formato de URL do WhatsApp
            const textoCodificado = encodeURIComponent(textoMensagem);
            const linkWhats = `https://api.whatsapp.com/send?phone=${telefone}&text=${textoCodificado}`;

            // Cria o botão verde do WhatsApp
            botaoWhats = `<a href="${linkWhats}" target="_blank" class="btn-whatsapp">📲 Enviar</a>`;
        }

        tr.innerHTML = `
            <td>${chamado.cliente}</td>
            <td>${chamado.tecnico}</td>
            <td>${chamado.departamento}</td>
            <td title="${chamado.problema}">${problemaResumido}</td>
            <td><span class="status-badge ${classeStatus}">${chamado.status}</span></td>
            <td><strong>${chamado.chamadoGlpi}</strong></td>
            <td>${chamado.statusGlpi}</td>
            <td>${chamado.data}</td>
            <td>${botaoWhats}</td> 
            <td>
                <button class="btn-excluir" onclick="deletarChamado(${chamado.id})">Excluir</button>
            </td>
        `; // <-- Corrigido: Fechamos a tag <tr> implicitamente na inserção da linha
        tabelaCorpo.appendChild(tr);
    });
}

// ==========================================================================
// OPERAÇÃO DE EXCLUSÃO (REMOVER)
// ==========================================================================

/**
 * Remove permanentemente um chamado pelo ID gerado
 * @param {number} id 
 */
function deletarChamado(id) {
    // Exibe um alerta de confirmação para evitar exclusões acidentais
    if (confirm('Tem certeza que deseja excluir permanentemente este registro?')) {
        let chamados = obterChamados();
        // Filtra a lista mantendo apenas os registros que têm o ID diferente do selecionado
        chamados = chamados.filter(chamado => chamado.id !== id);

        // Atualiza a memória local e renderiza novamente a tabela atualizada
        localStorage.setItem('meusChamados', JSON.stringify(chamados));
        renderizarTabela();
    }
} // <-- Corrigido: Adicionada a chave de fechamento da função deletarChamado

// ==========================================================================
// EXPORTAR RELATÓRIO PARA EXCEL (CSV)
// ==========================================================================
function gerarRelatorioCSV() {
    const chamados = obterChamados();
    const dataInicio = document.getElementById('dataInicio').value;
    const dataFim = document.getElementById('dataFim').value;

    if (chamados.length === 0) {
        alert('Não existem chamados registrados para gerar o relatório!');
        return;
    }

    let chamadosFiltrados = chamados;

    // Filtra os chamados com base no intervalo de datas, se ambos os campos estiverem preenchidos
    if (dataInicio && dataFim) {
        chamadosFiltrados = chamados.filter(chamado => {
            const partesData = chamado.data.split('/'); // Supondo que a data esteja no formato "dd/mm/aaaa"
            const dataChamado = new Date(partesData[2], partesData[1] - 1, partesData[0]);

            const inicio = new Date(dataInicio);
            const fim = new Date(dataFim);
            inicio.setHours(0, 0, 0); // Considera o início do dia para a data de início
            fim.setHours(23, 59, 59); // Considera o final do dia para a data de término

            return dataChamado >= inicio && dataChamado <= fim;
        });
    }
    if (chamadosFiltrados.length === 0) {
        alert('Nenhum chamado encontrado no intervalo de datas selecionado!');
        return;
    }

    const cabecalho = [
        'Usuário (Cliente)',
        'Técnico Responsável',
        'Departamento',
        'Descrição do Problema',
        'Status Interno',
        'Nº Chamado GLPI',
        'Status GLPI',
        'Data de Abertura'
    ];

    const linhas = chamadosFiltrados.map(chamado => {
        const problemaTratado = chamado.problema.replace(/[\n\r]+/g, ' ').replace(/;/g, ',');
        const clienteTratado = chamado.cliente.replace(/;/g, ',');

        return [
            `"${clienteTratado}"`,
            `"${chamado.tecnico}"`,
            `"${chamado.departamento}"`,
            `"${problemaTratado}"`,
            `"${chamado.status}"`,
            `"${chamado.chamadoGlpi}"`,
            `"${chamado.statusGlpi}"`,
            `"${chamado.data}"`
        ].join(';');
    });

    const conteudoCompleto = [cabecalho.join(';'), ...linhas].join('\n');
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + conteudoCompleto], { type: 'text/csv;charset=utf-8;' });

    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    const dataHoje = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_chamados_${dataHoje}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    document.addEventListener('DOMContentLoaded', () => {
    definirDataAtual();
    renderizarTabela();
    atualizarDashboard(); // Adicione isso aqui
});
}

/**
 * Calcula as estatísticas e atualiza os cards no topo da página
 */
function atualizarDashboard() {
    const chamados = obterChamados();

    const total = chamados.length;
    const pendentes = chamados.filter(c => c.status === 'Pendente').length;
    const andamento = chamados.filter(c => c.status === 'Em Andamento').length;
    const finalizados = chamados.filter(c => c.status === 'Finalizado').length;

    // Atualiza os elementos na tela
    document.getElementById('totalChamados').textContent = total;
    document.getElementById('totalPendentes').textContent = pendentes;
    document.getElementById('totalAndamento').textContent = andamento;
    document.getElementById('totalFinalizados').textContent = finalizados;
}

// Sempre que salvar ou excluir, chame:
atualizarDashboard();