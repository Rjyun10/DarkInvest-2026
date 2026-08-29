# 💰 DarkInvest - Simulador Financeiro & Comparador de Ativos

Um painel web moderno, interativo e responsivo desenvolvido para simulação de financiamentos imobiliários (Sistemas PRICE e SAC), projeções de juros compostos, metas financeiras e acompanhamento de cotações de mercado em tempo real.

---

## 🚀 Tecnologias Utilizadas

Este projeto foi construído utilizando tecnologias modernas de desenvolvimento front-end e integrações de APIs:

* **HTML5**: Estruturação semântica de todas as páginas e componentes do painel.
* **CSS3**: Estilização personalizada, temas customizados e efeitos visuais refinados.
* **Bootstrap 5**: Framework responsivo para o layout dinâmico dos cards, tabelas e sistema de grid.
* **JavaScript (ES6+)**: Lógica de cálculo financeiro, manipulação do DOM e requisições assíncronas.
* **Chart.js**: Biblioteca avançada para renderização de gráficos interativos de barras e linhas (evolução do saldo devedor e comparação de parcelas).
* **APIs Externas**: Integração com a *AwesomeAPI* para busca e atualização diária de cotações de moedas e criptomoedas (Dólar, Euro e Bitcoin).
* **Google Gemini AI**: Utilizado como assistente de inteligência artificial durante o desenvolvimento e estruturação de código.

---

## 📊 Funcionalidades do Projeto

1. **Simulador de Financiamento (PRICE vs SAC)**:
   * Cálculo detalhado e comparativo entre as tabelas Price e SAC.
   * Validação automática de limite de comprometimento de renda ($\le 30\%$).
   * Gráficos dinâmicos de barras (parcelas) e linhas (evolução do saldo devedor mês a mês).

2. **Calculadora de Juros Compostos**:
   * Projeção de investimentos com aportes mensais e prazos customizáveis.

3. **Planejador de Metas**:
   * Acompanhamento de objetivos financeiros de curto e longo prazo.

4. **Tabela de Ativos e Cotações**:
   * Monitoramento de índices de mercado, moedas estrangeiras, criptomoedas e renda fixa com indicadores de status (Online/Manual).

---

## 📁 Estrutura do Projeto

O projeto está organizado da seguinte forma:

```text
Simulador de Investimentos/
│
├── imagens/
│   └── favicon.png
├── index.html
├── style.css
├── script.js
└── README.md