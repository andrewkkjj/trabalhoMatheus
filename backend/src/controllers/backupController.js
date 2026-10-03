const { testConnection } = require("../database/db");
const { executeMaintenance } = require("../services/maintenanceService");
const { createBackup } = require("../services/backupService");

async function connection(req, res) {
  try {
    const result = await testConnection();
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: "Falha na conexão com o banco." });
  }
}

async function run(req, res) {
  const {
    destination,
    copyDestination,
    retention,
    maintenance,
    encrypt
  } = req.body || {};

  try {
    if (!destination) {
      return res.status(400).json({
        success: false,
        message: "O caminho de destino do backup é obrigatório."
      });
    }

    const maintenanceResult = await executeMaintenance(
      maintenance || null
    );

    const backup = await createBackup({
      destination,
      copyDestination,
      retention,
      encrypt: Boolean(encrypt)
    });

    res.json({
      success: true,
      maintenance: maintenanceResult,
      backup
    });
  } catch (error) {
    console.error(`[BACKUP] ${new Date().toISOString()} - ${error.message}`);

    res.status(500).json({
      success: false,
      message: "O processo de backup falhou.",
      error: error.message
    });
  }
}

module.exports = { connection, run };
