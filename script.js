let chartJurosInstance = null;
let chartSimplesInstance = null;
let chartFinInstance = null;
let chartSaldoInstance = null;
let chartMetaInstance = null;

function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function verificarMudancaManual(inputId, infoId) {
    document.getElementById(infoId).innerText = '';
}

// ==========================================
// FUNÇÕES AUXILIARES DE APIS (BANCO CENTRAL)
// ==========================================
async function buscarTaxaSelicGeral(inputId, infoId) {
    try {
        let response = await fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.11/dados/ultimos/1?formato=json');
        let data = await response.json();
        let taxaSelicDia = parseFloat(data[0].valor);
        let taxaSelicAno = (Math.pow(1 + (taxaSelicDia/100), 252) - 1) * 100;
        document.getElementById(inputId).value = taxaSelicAno.toFixed(2);
        document.getElementById(infoId).innerText = `Selic BCB: ${taxaSelicAno.toFixed(2)}% a.a. (Ativo)`;
    } catch (error) {
        document.getElementById(infoId).innerText = 'Erro ao buscar dados do BCB.';
    }
}

async function buscarTaxaJurosAPI() {
    await buscarTaxaSelicGeral('jurosTaxa', 'jurosSelicInfo');
}

async function buscarSelic() {
    await buscarTaxaSelicGeral('finTaxa', 'selicInfo');
}

async function buscarTaxaMetaAPI() {
    await buscarTaxaSelicGeral('metaTaxa', 'metaSelicInfo');
}

async function buscarInflacaoAPI() {
    try {
        let response = await fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.13522/dados/ultimos/1?formato=json');
        let data = await response.json();
        let ipca12m = parseFloat(data[0].valor);
        document.getElementById('jurosInflacao').value = ipca12m.toFixed(2);
        document.getElementById('jurosIpcaInfo').innerText = `IPCA 12m (BCB): ${ipca12m.toFixed(2)}% a.a. (Ativo)`;
    } catch (error) {
        document.getElementById('jurosIpcaInfo').innerText = 'Erro ao buscar IPCA.';
    }
}

// ==========================================
// 1. SIMULADOR DE JUROS COMPOSTOS
// ==========================================
function calcularJuros() {
    let vInicial = parseFloat(document.getElementById('jurosValorInicial').value);
    let aporte = parseFloat(document.getElementById('jurosAporteMensal').value);
    let taxaAnual = parseFloat(document.getElementById('jurosTaxa').value) / 100;
    let anos = parseInt(document.getElementById('jurosAnos').value);
    let meses = parseInt(document.getElementById('jurosMeses').value);
    let inflacaoAnual = parseFloat(document.getElementById('jurosInflacao').value) / 100;

    let totalMeses = (anos * 12) + meses;
    let taxaMensal = Math.pow(1 + taxaAnual, 1/12) - 1;
    let inflacaoMensal = Math.pow(1 + inflacaoAnual, 1/12) - 1;

    let montanteBruto = vInicial;
    let valorAportadoTotal = vInicial;
    let montanteLiquidoInflacao = vInicial;

    let labels = ['Início'];
    let dadosBruto = [vInicial];
    let dadosAportado = [vInicial];

    for (let i = 1; i <= totalMeses; i++) {
        montanteBruto = (montanteBruto + aporte) * (1 + taxaMensal);
        valorAportadoTotal += aporte;
        montanteLiquidoInflacao = montanteBruto / Math.pow(1 + inflacaoMensal, i);

        if (i % Math.max(1, Math.floor(totalMeses / 10)) === 0 || i === totalMeses) {
            labels.push(`Mês ${i}`);
            dadosBruto.push(montanteBruto);
            dadosAportado.push(valorAportadoTotal);
        }
    }

    let rendimentoBruto = montanteBruto - valorAportadoTotal;
    let rendimentoLiquido = montanteLiquidoInflacao - valorAportadoTotal;

    document.getElementById('resJurosAportado').innerText = formatarMoeda(valorAportadoTotal);
    document.getElementById('resJurosRendimentoBruto').innerText = formatarMoeda(rendimentoBruto);
    document.getElementById('resJurosBruto').innerText = formatarMoeda(montanteBruto);
    document.getElementById('resJurosRendimentoLiquido').innerText = formatarMoeda(rendimentoLiquido > 0 ? rendimentoLiquido : 0);
    document.getElementById('resJurosLiquido').innerText = formatarMoeda(montanteLiquidoInflacao);

    const ctx = document.getElementById('chartJuros').getContext('2d');
    if (chartJurosInstance) chartJurosInstance.destroy();

    chartJurosInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                { label: 'Montante Bruto (R$)', data: dadosBruto, borderColor: '#00d26a', backgroundColor: 'rgba(0,210,106,0.1)', fill: true, tension: 0.2 },
                { label: 'Total Aportado (R$)', data: dadosAportado, borderColor: '#94a3b8', borderDash: [5,5], fill: false, tension: 0.2 }
            ]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: '#f8f9fa' } } }, 
            scales: { x: { ticks: { color: '#94a3b8' } }, y: { ticks: { color: '#94a3b8' } } } 
        }
    });
}

// ==========================================
// 2. SIMULADOR DE JUROS SIMPLES
// ==========================================
function calcularJuroSimples() {
    let C = parseFloat(document.getElementById('simplesCapital').value) || 0;
    let taxaAnual = (parseFloat(document.getElementById('simplesTaxa').value) || 0) / 100;
    let anos = parseInt(document.getElementById('simplesAnos').value) || 0;
    let meses = parseInt(document.getElementById('simplesMeses').value) || 0;

    // Tempo total em anos (t = anos + meses/12)
    let t = anos + (meses / 12);
    let totalMeses = (anos * 12) + meses;

    // J = C * i * t
    let J = C * taxaAnual * t;

    // M = C + J
    let M = C + J;

    document.getElementById('resSimplesCapital').innerText = formatarMoeda(C);
    document.getElementById('resSimplesJuros').innerText = formatarMoeda(J);
    document.getElementById('resSimplesMontante').innerText = formatarMoeda(M);

    // Gerar pontos simples para o gráfico linear
    let labels = ['Início'];
    let dadosMontante = [C];
    let dadosCapital = [C];

    let passo = Math.max(1, Math.floor(totalMeses / 10));
    for (let m = 1; m <= totalMeses; m++) {
        if (m % passo === 0 || m === totalMeses) {
            let tParcial = m / 12;
            let montanteParcial = C * (1 + (taxaAnual * tParcial));
            labels.push(`Mês ${m}`);
            dadosMontante.push(montanteParcial);
            dadosCapital.push(C);
        }
    }

    const ctx = document.getElementById('chartJuroSimples').getContext('2d');
    if (chartSimplesInstance) chartSimplesInstance.destroy();

    chartSimplesInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                { 
                    label: 'Montante Final (M = C + J)', 
                    data: dadosMontante, 
                    borderColor: '#00d26a', 
                    backgroundColor: 'rgba(0,210,106,0.1)', 
                    fill: true, 
                    tension: 0 
                },
                { 
                    label: 'Capital Inicial (C)', 
                    data: dadosCapital, 
                    borderColor: '#94a3b8', 
                    borderDash: [5, 5], 
                    fill: false 
                }
            ]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: '#f8f9fa' } } }, 
            scales: { x: { ticks: { color: '#94a3b8' } }, y: { ticks: { color: '#94a3b8' } } } 
        }
    });
}

// ==========================================
// 3. SIMULADOR DE FINANCIAMENTO (PRICE vs SAC)
// ==========================================
function calcularFinanciamento() {
    let valor = parseFloat(document.getElementById('finValorImovel').value);
    let renda = parseFloat(document.getElementById('finRenda').value);
    let taxaAnual = parseFloat(document.getElementById('finTaxa').value) / 100;
    let mesesDesejados = parseInt(document.getElementById('finMeses').value);

    let taxaMensal = taxaAnual / 12;
    let limiteParcela = renda * 0.30;

    let parcelaPrice = valor * (taxaMensal * Math.pow(1 + taxaMensal, mesesDesejados)) / (Math.pow(1 + taxaMensal, mesesDesejados) - 1);
    
    let prazoSugerido = mesesDesejados;
    if (parcelaPrice > limiteParcela) {
        let termo = 1 - (valor * taxaMensal) / limiteParcela;
        if (termo > 0) {
            prazoSugerido = Math.ceil(-Math.log(termo) / Math.log(1 + taxaMensal));
            parcelaPrice = limiteParcela;
        }
    }

    // Cálculo detalhado PRICE
    let totalPagoPrice = parcelaPrice * prazoSugerido;
    let totalJurosPrice = totalPagoPrice - valor;

    // Cálculo detalhado SAC
    let amortizacaoSac = valor / prazoSugerido;
    let parcelaSacInicial = amortizacaoSac + (valor * taxaMensal);
    let parcelaSacFinal = amortizacaoSac + (amortizacaoSac * taxaMensal);
    
    let totalJurosSac = 0;
    let saldoTemp = valor;
    for (let i = 0; i < prazoSugerido; i++) {
        let jurosMes = saldoTemp * taxaMensal;
        totalJurosSac += jurosMes;
        saldoTemp -= amortizacaoSac;
    }
    let totalPagoSac = valor + totalJurosSac;

    let compPrice = (parcelaPrice / renda) * 100;
    let compSac = (parcelaSacInicial / renda) * 100;

    // Validação se cabe ou não (limite de 30% da renda)
    let statusPrice = compPrice <= 30 ? '<span class="text-success fw-bold">Cabe no orçamento (≤ 30%)</span>' : '<span class="text-danger fw-bold">Não cabe no orçamento (> 30%)</span>';
    let statusSac = compSac <= 30 ? '<span class="text-success fw-bold">Cabe no orçamento (≤ 30%)</span>' : '<span class="text-danger fw-bold">Não cabe no orçamento (> 30%)</span>';

    // Preenchendo Cards (Adicione um elemento span com id adequado nos seus cards se quiser exibi-los lá também)
    document.getElementById('resPriceParcela').innerText = formatarMoeda(parcelaPrice);
    document.getElementById('resPriceFinal').innerText = formatarMoeda(parcelaPrice);
    document.getElementById('resPriceJuros').innerText = formatarMoeda(totalJurosPrice);
    document.getElementById('resPricePrazo').innerText = prazoSugerido;
    document.getElementById('resPriceComp').innerText = compPrice.toFixed(1) + '%';

    document.getElementById('resSacInicial').innerText = formatarMoeda(parcelaSacInicial);
    document.getElementById('resSacFinal').innerText = formatarMoeda(parcelaSacFinal);
    document.getElementById('resSacJuros').innerText = formatarMoeda(totalJurosSac);
    document.getElementById('resSacPrazo').innerText = prazoSugerido;
    document.getElementById('resSacComp').innerText = compSac.toFixed(1) + '%';

    // Preenchendo Tabela Comparativa Abaixo do Botão
    document.getElementById('tblPriceParcela').innerText = formatarMoeda(parcelaPrice);
    document.getElementById('tblPriceFinal').innerText = formatarMoeda(parcelaPrice);
    document.getElementById('tblPriceJuros').innerText = formatarMoeda(totalJurosPrice);
    document.getElementById('tblPricePrazo').innerText = prazoSugerido;
    document.getElementById('tblPriceComp').innerHTML = `${compPrice.toFixed(1)}% <br>${statusPrice}`;

    document.getElementById('tblSacInicial').innerText = formatarMoeda(parcelaSacInicial);
    document.getElementById('tblSacFinal').innerText = formatarMoeda(parcelaSacFinal);
    document.getElementById('tblSacJuros').innerText = formatarMoeda(totalJurosSac);
    document.getElementById('tblSacPrazo').innerText = prazoSugerido;
    document.getElementById('tblSacComp').innerHTML = `${compSac.toFixed(1)}% <br>${statusSac}`;

    // Preparação correta dos dados mês a mês para os gráficos de financiamento
    let labelsFin = [];
    let dadosPrice = [];
    let dadosSac = [];
    let saldoPriceArr = [];
    let saldoSacArr = [];

    let saldoDevedorSac = valor;
    let saldoDevedorPrice = valor;
    let passo = Math.max(1, Math.floor(prazoSugerido / 12));

    for (let m = 1; m <= prazoSugerido; m++) {
        let jurosPriceMes = saldoDevedorPrice * taxaMensal;
        let amortizacaoPriceMes = parcelaPrice - jurosPriceMes;
        saldoDevedorPrice -= amortizacaoPriceMes;

        let jurosSacMes = saldoDevedorSac * taxaMensal;
        let pSac = amortizacaoSac + jurosSacMes;
        saldoDevedorSac -= amortizacaoSac;

        if (m === 1 || m % passo === 0 || m === prazoSugerido) {
            labelsFin.push(`Mês ${m}`);
            dadosPrice.push(parcelaPrice);
            dadosSac.push(pSac);
            saldoPriceArr.push(Math.max(0, saldoDevedorPrice));
            saldoSacArr.push(Math.max(0, saldoDevedorSac));
        }
    }

    const ctxFin = document.getElementById('chartFinanciamento').getContext('2d');
    if (chartFinInstance) chartFinInstance.destroy();

    chartFinInstance = new Chart(ctxFin, {
        type: 'bar',
        data: {
            labels: labelsFin,
            datasets: [
                { label: 'Parcela PRICE (Fixa)', data: dadosPrice, backgroundColor: 'rgba(0,210,106,0.7)' },
                { label: 'Parcela SAC (Decrescente)', data: dadosSac, backgroundColor: 'rgba(54, 162, 235, 0.7)' }
            ]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: '#f8f9fa' } } }, 
            scales: { x: { ticks: { color: '#94a3b8' } }, y: { ticks: { color: '#94a3b8' } } } 
        }
    });

    const ctxSaldo = document.getElementById('chartSaldoDevedor').getContext('2d');
    if (chartSaldoInstance) chartSaldoInstance.destroy();

    chartSaldoInstance = new Chart(ctxSaldo, {
        type: 'line',
        data: {
            labels: labelsFin,
            datasets: [
                { label: 'Saldo Devedor PRICE', data: saldoPriceArr, borderColor: '#00d26a', backgroundColor: 'rgba(0,210,106,0.1)', fill: true, tension: 0.2 },
                { label: 'Saldo Devedor SAC', data: saldoSacArr, borderColor: '#36a2eb', backgroundColor: 'rgba(54, 162, 235, 0.1)', fill: true, tension: 0.2 }
            ]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: '#f8f9fa' } } }, 
            scales: { x: { ticks: { color: '#94a3b8' } }, y: { ticks: { color: '#94a3b8' } } } 
        }
    });
}

// ==========================================
// 4. SIMULADOR DE META DE PATRIMÔNIO
// ==========================================
function calcularMeta() {
    let meta = parseFloat(document.getElementById('metaValor').value);
    let inicial = parseFloat(document.getElementById('metaInicial').value);
    let taxaAnual = parseFloat(document.getElementById('metaTaxa').value) / 100;
    let anos = parseInt(document.getElementById('metaAnos').value);
    let meses = parseInt(document.getElementById('metaMeses').value);

    let totalMeses = (anos * 12) + meses;
    let taxaMensal = Math.pow(1 + taxaAnual, 1/12) - 1;

    let fatorComp = Math.pow(1 + taxaMensal, totalMeses);
    let futuroInicial = inicial * fatorComp;
    let falta = meta - futuroInicial;

    let aporteNecessario = 0;
    if (falta > 0 && taxaMensal > 0) {
        aporteNecessario = falta / (((fatorComp - 1) / taxaMensal));
    } else if (falta <= 0) {
        aporteNecessario = 0;
    }

    document.getElementById('resMetaAporte').innerText = formatarMoeda(aporteNecessario);
    document.getElementById('resMetaDetalhes').innerText = `Para alcançar ${formatarMoeda(meta)} em ${totalMeses} meses a ${(taxaAnual*100).toFixed(1)}% a.a.`;

    let labelsMeta = ['Início'];
    let dadosEvolucao = [inicial];
    let montanteAtual = inicial;

    for (let i = 1; i <= totalMeses; i++) {
        montanteAtual = (montanteAtual + aporteNecessario) * (1 + taxaMensal);
        if (i % Math.max(1, Math.floor(totalMeses / 10)) === 0 || i === totalMeses) {
            labelsMeta.push(`Mês ${i}`);
            dadosEvolucao.push(montanteAtual);
        }
    }

    const ctx = document.getElementById('chartMeta').getContext('2d');
    if (chartMetaInstance) chartMetaInstance.destroy();

    chartMetaInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labelsMeta,
            datasets: [
                { label: 'Evolução do Patrimônio (R$)', data: dadosEvolucao, borderColor: '#36a2eb', backgroundColor: 'rgba(54, 162, 235, 0.1)', fill: true, tension: 0.2 }
            ]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: '#f8f9fa' } } }, 
            scales: { x: { ticks: { color: '#94a3b8' } }, y: { ticks: { color: '#94a3b8' } } } 
        }
    });
}

// ==========================================
// 5. TABELA DE ATIVOS (COM STATUS DE ATUALIZAÇÃO)
// ==========================================
async function carregarTabelaAtivos() {
    let tbody = document.getElementById('tabelaAtivos');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">Atualizando cotações do mercado...</td></tr>`;

    try {
        // Buscando dados de Dólar, Euro e Bitcoin em tempo real
        const resposta = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL,BTC-BRL');
        const dados = await resposta.json();

        const dolar = dados.USDBRL;
        const euro = dados.EURBRL;
        const btc = dados.BTCBRL;

        const ativos = [
            { 
                nome: 'Ibovespa (IBOV)', 
                tipo: 'Índice Nacional', 
                valor: '129.120 pts', 
                variacao: '+0.65%', 
                status: 'Alta',
                modo: '<small class="text-muted" title="Valor estático de referência">(Manual)</small>' 
            },
            { 
                nome: 'S&P 500', 
                tipo: 'Índice EUA', 
                valor: '5.310 pts', 
                variacao: '+0.51%', 
                status: 'Alta',
                modo: '<small class="text-muted" title="Valor estático de referência">(Manual)</small>' 
            },
            { 
                nome: 'Dólar (USD/BRL)', 
                tipo: 'Moeda', 
                valor: `R$ ${parseFloat(dolar.bid).toFixed(2)}`, 
                variacao: `${parseFloat(dolar.pctChange) >= 0 ? '+' : ''}${dolar.pctChange}%`, 
                status: parseFloat(dolar.pctChange) >= 0 ? 'Alta' : 'Baixa',
                modo: '<small class="text-success" title="Atualizado automaticamente pela API">(Online)</small>' 
            },
            { 
                nome: 'Euro (EUR/BRL)', 
                tipo: 'Moeda', 
                valor: `R$ ${parseFloat(euro.bid).toFixed(2)}`, 
                variacao: `${parseFloat(euro.pctChange) >= 0 ? '+' : ''}${euro.pctChange}%`, 
                status: parseFloat(euro.pctChange) >= 0 ? 'Alta' : 'Baixa',
                modo: '<small class="text-success" title="Atualizado automaticamente pela API">(Online)</small>' 
            },
            { 
                nome: 'Bitcoin (BTC)', 
                tipo: 'Criptomoeda', 
                valor: `R$ ${parseFloat(btc.bid).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, 
                variacao: `${parseFloat(btc.pctChange) >= 0 ? '+' : ''}${btc.pctChange}%`, 
                status: parseFloat(btc.pctChange) >= 0 ? 'Alta' : 'Baixa',
                modo: '<small class="text-success" title="Atualizado automaticamente pela API">(Online)</small>' 
            },
            { 
                nome: 'Tesouro Selic', 
                tipo: 'Renda Fixa', 
                valor: '13,25% a.a.', 
                variacao: 'Estável', 
                status: 'Estável',
                modo: '<small class="text-muted" title="Valor estático de referência">(Manual)</small>' 
            },
            { 
                nome: 'Tesouro IPCA+ 2035', 
                tipo: 'Renda Fixa', 
                valor: 'R$ 1.255,80', 
                variacao: '+0.32%', 
                status: 'Alta',
                modo: '<small class="text-muted" title="Valor estático de referência">(Manual)</small>' 
            }
        ];

        tbody.innerHTML = '';

        ativos.forEach(ativo => {
            let badgeColor = ativo.status === 'Alta' ? 'bg-success' : (ativo.status === 'Baixa' ? 'bg-danger' : 'bg-secondary');
            let varClass = ativo.variacao.includes('+') ? 'text-success' : (ativo.variacao.includes('-') ? 'text-danger' : 'text-muted');
            
            let tr = `<tr>
                <td><strong>${ativo.nome}</strong></td>
                <td>${ativo.tipo} ${ativo.modo}</td>
                <td>${ativo.valor}</td>
                <td class="${varClass}">${ativo.variacao}</td>
                <td><span class="badge ${badgeColor}">${ativo.status}</span></td>
            </tr>`;
            tbody.innerHTML += tr;
        });

    } catch (erro) {
        console.error("Erro ao buscar cotações online:", erro);
    }
}

// Inicializar cálculos ao carregar a página
window.onload = function() {
    calcularJuros();
    calcularJuroSimples();
    calcularFinanciamento();
    calcularMeta();
    carregarTabelaAtivos();
};