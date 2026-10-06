const path = require("path");

// Carrega o arquivo .env que está na pasta backend
require("dotenv").config({
    path: path.resolve(__dirname, "../.env")
});

// Verificação das configurações
// Não mostra a senha, apenas verifica se ela foi carregada.
console.log("=== CONFIGURAÇÃO ===");
console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_PORT:", process.env.DB_PORT);
console.log("DB_NAME:", process.env.DB_NAME);
console.log("DB_USER:", process.env.DB_USER);
console.log(
    "DB_PASSWORD carregada:",
    typeof process.env.DB_PASSWORD
);
console.log("====================");

// Importações
const express = require("express");
const backupRoutes = require("./routes/backupRoutes");

// Aplicação Express
const app = express();

// Permite receber JSON
app.use(express.json());

// Arquivos estáticos da pasta src
const frontendPath = path.resolve(__dirname, "../../frontend");

app.use(express.static(frontendPath));

app.get("/", (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
});

// Rotas da API
app.use(
    "/api/backup",
    backupRoutes
);

// Porta
const PORT = process.env.PORT || 3000;

// Inicia servidor
app.listen(PORT, () => {
    console.log("");
    console.log(
        `Hotel Backup API rodando em http://localhost:${PORT}`
    );

    console.log(
        `Teste do banco: http://localhost:${PORT}/api/backup/connection`
    );
});