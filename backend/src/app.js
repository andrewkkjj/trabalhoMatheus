const express = require("express");
const path = require("path");
const backupRoutes = require("./routes/backupRoutes"); // Ajusta se o nome/caminho for diferente

const app = express();

// Middleware para processar JSON no corpo das requisições
app.use(express.json());

// 1. Servir o ficheiro index.html na rota raiz (http://localhost:3000/)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// 2. Se tiveres outros ficheiros estáticos em src (como CSS ou JS externos)
app.use(express.static(__dirname));

// 3. Rotas da API
app.use("/api/backup", backupRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Hotel Backup API rodando em http://localhost:${PORT}`);
});