# te-mova — Dashboard

Dashboard do protótipo te-mova para monitoramento preditivo de vegetação em rodovias Motiva.

## Divisão

1. **Área de dados** — clima (coleta), monitoramento (modelo), alertas e previsão do trecho (janela 20 dias)
2. **Área de designação** — envio da tarefa ao app da equipe + notificações de confirmação/andamento/fim
3. **Área do mapa** — previsão por trecho, pop-up com KM, local, movimentação e previsão
4. **Teste de campo REAL001** — previsão D2→D4 do modelo de teste (LSTM 2.3.0): só crescimento e altura previstos, sem o D4 medido

Marca: **te-mova** · cores `#ffffff` e `#6047ec`

## Rodar

```powershell
cd dashboard
npm install
npm run dev
```

API do Modelo 1 em `http://127.0.0.1:8000` (proxy `/api`).
App Flutter em `http://127.0.0.1:5050` (proxy `/field-app`).

Deploy no Render: ver [GUIA_DEPLOY_RENDER.md](../../GUIA_DEPLOY_RENDER.md).
