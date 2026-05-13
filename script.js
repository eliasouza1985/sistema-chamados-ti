// ==========================================================================
// CAPTURA DE ELEMENTOS E INICIALIZAÇÃO
// ==========================================================================
const form = document.getElementById('chamadoForm');
const tabelaCorpo = document.getElementById('tabelaCorpo');

// Executa as funções iniciais assim que o documento HTML estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    definirDataAtual();
    renderizarTabela();
    atualizarDashboard(); // Garante que o dashboard inicie com os dados salvos
});

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
    event.preventDefault();

    const cliente = document.getElementById('cliente').value.trim();
    const tecnico = document.getElementById('tecnico').value;
    const departamento = document.getElementById('departamento').value;
    const problema = document.getElementById('problema').value.trim();
    const status = document.getElementById('status').value;
    const chamadoGlpi = document.getElementById('chamadoGlpi').value.trim() || '---';
    const statusGlpi = document.getElementById('statusGlpi').value;

    const dataRaw = document.getElementById('data').value;
    const dataFormatada = dataRaw ? dataRaw.split('-').reverse().join('/') : '---';

    const novoChamado = {
        id: Date.now(),
        cliente,
        tecnico,
        departamento,
        problema,
        status,
        chamadoGlpi,
        statusGlpi,
        data: dataFormatada
    };

    salvarChamado(novoChamado);
    form.reset();
    definirDataAtual();
    renderizarTabela();
    atualizarDashboard(); // Atualiza os números do topo após salvar
});

// ==========================================================================
// GERENCIAMENTO DO LOCALSTORAGE
// ==========================================================================
function obterChamados() {
    const chamados = localStorage.getItem('meusChamados');
    return chamados ? JSON.parse(chamados) : [];
}

function salvarChamado(chamado) {
    const chamados = obterChamados();
    chamados.push(chamado);
    localStorage.setItem('meusChamados', JSON.stringify(chamados));
}

/**
 * NOVA FUNÇÃO: Altera o status e atualiza o banco e o dashboard
 */
function alterarStatus(id, novoStatus) {
    let chamados = obterChamados();
    chamados = chamados.map(c => {
        if (c.id === id) {
            c.status = novoStatus;
        }
        return c;
    });
    localStorage.setItem('meusChamados', JSON.stringify(chamados));
    renderizarTabela();
    atualizarDashboard(); // O dashboard muda assim que você troca o status na tabela
}

// ==========================================================================
// RENDERIZAÇÃO DA TABELA
// ==========================================================================
const telefonesTecnicos = {
    "Elia Souza": "5591982339287",
    "Lucas Lima": "5591984845996",
    "Raphael Paiva": "5591982514451",
    "David Azevedo": "5591981243528",
    "Jairo Rodrigues": "5591988074195",
    "Leonardo Rafael": "5591985120045",
    "Luiz Gonzaga": "5591991903894",
    "Max Fontão": "5591993668297",
    "Osvaldo Junior": "5591989168776"
};

function renderizarTabela() {
    const chamados = obterChamados();
    tabelaCorpo.innerHTML = '';

    if (chamados.length === 0) {
        tabelaCorpo.innerHTML = `<tr><td colspan="10" style="text-align: center; color: #a0aec0; padding: 20px;">Nenhum chamado registrado.</td></tr>`;
        return;
    }

    chamados.forEach((chamado) => {
        const tr = document.createElement('tr');
        
        // Determina a classe de cor para o select
        let classeCor = 'status-pendente';
        if (chamado.status === 'Em Andamento') classeCor = 'status-andamento';
        if (chamado.status === 'Finalizado') classeCor = 'status-finalizado';

        const problemaResumido = chamado.problema.length > 35 ? chamado.problema.substring(0, 32) + '...' : chamado.problema;

        const telefone = telefonesTecnicos[chamado.tecnico] || '';
        let botaoWhats = '---';

        if (telefone) {
            const textoMensagem = `Olá ${chamado.tecnico}, chamado designado!\n\n👤 *Cliente:* ${chamado.cliente}\n🏢 *Setor:* ${chamado.departamento}\n🛠️ *Problema:* ${chamado.problema}\n🎫 *GLPI:* ${chamado.chamadoGlpi}`;
            const linkWhats = `https://api.whatsapp.com/send?phone=${telefone}&text=${encodeURIComponent(textoMensagem)}`;
            botaoWhats = `<a href="${linkWhats}" target="_blank" class="btn-whatsapp">📲 Enviar</a>`;
        }

        tr.innerHTML = `
            <td>${chamado.cliente}</td>
            <td>${chamado.tecnico}</td>
            <td>${chamado.departamento}</td>
            <td title="${chamado.problema}">${problemaResumido}</td>
            <td>
                <select class="status-select ${classeCor}" onchange="alterarStatus(${chamado.id}, this.value)">
                    <option value="Pendente" ${chamado.status === 'Pendente' ? 'selected' : ''}>Pendente</option>
                    <option value="Em Andamento" ${chamado.status === 'Em Andamento' ? 'selected' : ''}>Em Andamento</option>
                    <option value="Finalizado" ${chamado.status === 'Finalizado' ? 'selected' : ''}>Finalizado</option>
                </select>
            </td>
            <td><strong>${chamado.chamadoGlpi}</strong></td>
            <td>${chamado.statusGlpi}</td>
            <td>${chamado.data}</td>
            <td>${botaoWhats}</td> 
            <td><button class="btn-excluir" onclick="deletarChamado(${chamado.id})">Excluir</button></td>
        `;
        tabelaCorpo.appendChild(tr);
    });
}

// ==========================================================================
// OPERAÇÃO DE EXCLUSÃO
// ==========================================================================
function deletarChamado(id) {
    if (confirm('Deseja excluir este registro?')) {
        let chamados = obterChamados();
        chamados = chamados.filter(c => c.id !== id);
        localStorage.setItem('meusChamados', JSON.stringify(chamados));
        renderizarTabela();
        atualizarDashboard();
    }
}

// ==========================================================================
// RELATÓRIO E DASHBOARD
// ==========================================================================
function gerarRelatorioCSV() {
    const chamados = obterChamados();
    const dataInicio = document.getElementById('dataInicio').value;
    const dataFim = document.getElementById('dataFim').value;

    if (chamados.length === 0) { alert('Sem dados!'); return; }

    let filtrados = chamados;
    if (dataInicio && dataFim) {
        const inicio = new Date(dataInicio + "T00:00:00");
        const fim = new Date(dataFim + "T23:59:59");
        filtrados = chamados.filter(c => {
            const [d, m, a] = c.data.split('/');
            const dataC = new Date(a, m - 1, d);
            return dataC >= inicio && dataC <= fim;
        });
    }

    const cabecalho = ['Cliente', 'Tecnico', 'Setor', 'Problema', 'Status', 'GLPI', 'Status GLPI', 'Data'];
    const linhas = filtrados.map(c => [`"${c.cliente}"`,`"${c.tecnico}"`,`"${c.departamento}"`,`"${c.problema.replace(/;/g,',')}"`,`"${c.status}"`,`"${c.chamadoGlpi}"`,`"${c.statusGlpi}"`,`"${c.data}"`].join(';'));
    
    const blob = new Blob(['\uFEFF' + [cabecalho.join(';'), ...linhas].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio_chamados.csv`;
    link.click();
}

function atualizarDashboard() {
    const chamados = obterChamados();
    document.getElementById('totalChamados').textContent = chamados.length;
    document.getElementById('totalPendentes').textContent = chamados.filter(c => c.status === 'Pendente').length;
    document.getElementById('totalAndamento').textContent = chamados.filter(c => c.status === 'Em Andamento').length;
    document.getElementById('totalFinalizados').textContent = chamados.filter(c => c.status === 'Finalizado').length;
}