  const { pool } = require("../database/db");

  function decideMaintenance(lastMaintenance) {
    if (!lastMaintenance) {
      return {
        action: "VACUUM FULL ANALYZE",
        rule: "Nenhuma execução anterior ou consulta sem data"
      };
    }

    const last = new Date(lastMaintenance);
    const now = new Date();
    const days = (now - last) / (1000 * 60 * 60 * 24);

    if (days < 30) {
      return {
        action: "NONE",
        rule: "Última manutenção há menos de 30 dias",
        days
      };
    }

    if (days <= 60) {
      return {
        action: "VACUUM",
        rule: "Diferença entre 30 e 60 dias",
        days
      };
    }

    return {
      action: "VACUUM FULL ANALYZE",
      rule: "Diferença superior a 60 dias",
      days
    };
  }

  async function getLastSuccessfulMaintenance() {
    const result = await pool.query(`
      SELECT MAX(data_inicio) AS ultima_manutencao
      FROM public.manutencoes
      WHERE resultado = 'SUCESSO'
    `);
    return result.rows[0].ultima_manutencao;
  }

  async function executeMaintenance(requestedAction = null) {
    const last = await getLastSuccessfulMaintenance();
    const automatic = decideMaintenance(last);

    // A escolha explícita prevalece sobre a decisão automática.
    let selected = automatic;
    let manual = false;

    if (requestedAction) {
      const normalized = requestedAction.toUpperCase();

      if (!["NONE", "VACUUM", "VACUUM FULL ANALYZE"].includes(normalized)) {
        throw new Error("Manutenção inválida. Use NONE, VACUUM ou VACUUM FULL ANALYZE.");
      }

      selected = {
        action: normalized,
        rule: "Execução manual",
        days: automatic.days
      };
      manual = true;
    }

    if (selected.action === "NONE") {
      return {
        executed: false,
        manual,
        decision: selected.action,
        rule: selected.rule,
        lastMaintenance: last,
        days: selected.days ?? null
      };
    }

    const startedAt = new Date();

    try {
      await pool.query(selected.action === "VACUUM"
        ? "VACUUM"
        : "VACUUM FULL ANALYZE");

      const finishedAt = new Date();

      await pool.query(`
        INSERT INTO public.manutencoes
        (tipo, data_inicio, data_fim, resultado, regra_aplicada, observacao)
        VALUES ($1, $2, $3, 'SUCESSO', $4, $5)
      `, [
        selected.action === "VACUUM" ? "VACUUM" : "VACUUM FULL ANALYZE",
        startedAt,
        finishedAt,
        selected.rule,
        manual ? "Manutenção executada por escolha explícita do usuário." : "Manutenção decidida automaticamente pela plataforma."
      ]);

      return {
        executed: true,
        manual,
        decision: selected.action,
        rule: selected.rule,
        lastMaintenance: last,
        days: selected.days ?? null,
        startedAt,
        finishedAt,
        result: "SUCESSO"
      };
    } catch (error) {
      const finishedAt = new Date();

      await pool.query(`
        INSERT INTO public.manutencoes
        (tipo, data_inicio, data_fim, resultado, regra_aplicada, observacao)
        VALUES ($1, $2, $3, 'FALHA', $4, $5)
      `, [
        selected.action === "VACUUM" ? "VACUUM" : "VACUUM FULL ANALYZE",
        startedAt,
        finishedAt,
        selected.rule,
        `Falha: ${error.message}`
      ]);

      throw error;
    }
  }

  module.exports = {
    decideMaintenance,
    getLastSuccessfulMaintenance,
    executeMaintenance
  };
