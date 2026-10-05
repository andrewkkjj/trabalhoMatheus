const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { spawn } = require("child_process");

function ensureDirectory(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function safeFileName(value) {
  return String(value).replace(/[^a-zA-Z0-9._-]/g, "_");
}

function runPgDump(destination) {
    return new Promise((resolve, reject) => {

        ensureDirectory(path.dirname(destination));

        const pgDumpPath =
            process.env.PG_DUMP_PATH ||
            "C:\\Program Files\\PostgreSQL\\18\\bin\\pg_dump.exe";

        console.log("Executando pg_dump:");
        console.log(pgDumpPath);

        const args = [
            "-h", process.env.DB_HOST,
            "-p", String(process.env.DB_PORT || 5432),
            "-U", process.env.DB_USER,
            "-d", process.env.DB_NAME,
            "-F", "c",
            "-f", destination
        ];

        const child = spawn(
            pgDumpPath,
            args,
            {
                env: {
                    ...process.env,
                    PGPASSWORD: String(process.env.DB_PASSWORD)
                },
                windowsHide: true,
                shell: false
            }
        );

        let stderr = "";

        child.stderr.on("data", (chunk) => {
            stderr += chunk.toString();
        });

        child.on("error", (error) => {
            console.error("Erro ao iniciar pg_dump:");
            console.error(error);

            reject(error);
        });

        child.on("close", (code) => {

            if (code === 0) {
                console.log("Backup PostgreSQL criado com sucesso.");
                resolve();
                return;
            }

            reject(
                new Error(
                    stderr.trim() ||
                    `pg_dump terminou com código ${code}`
                )
            );
        });
    });
}

function encryptFile(input, output) {
  return new Promise((resolve, reject) => {
    const keyHex = process.env.ENCRYPTION_KEY_HEX;

    if (!keyHex || !/^[0-9a-fA-F]{64}$/.test(keyHex)) {
      return reject(new Error("ENCRYPTION_KEY_HEX não configurada com uma chave AES-256 válida."));
    }

    const key = Buffer.from(keyHex, "hex");
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    const inputStream = fs.createReadStream(input);
    const outputStream = fs.createWriteStream(output);

    outputStream.write(iv);

    inputStream.pipe(cipher).pipe(outputStream);

    outputStream.on("finish", () => {
      try {
        fs.appendFileSync(output, cipher.getAuthTag());
        resolve();
      } catch (error) {
        reject(error);
      }
    });

    inputStream.on("error", reject);
    outputStream.on("error", reject);
  });
}

function copyBackup(source, destinationDir) {
  ensureDirectory(destinationDir);
  const target = path.join(destinationDir, path.basename(source));
  fs.copyFileSync(source, target);
  return target;
}

function applyRetention(dir, keep) {
  if (!keep || keep < 1 || !fs.existsSync(dir)) return [];

  const files = fs.readdirSync(dir)
    .filter(name => name.endsWith(".backup") || name.endsWith(".backup.enc"))
    .map(name => {
      const full = path.join(dir, name);
      return { name, full, time: fs.statSync(full).mtimeMs };
    })
    .sort((a, b) => b.time - a.time);

  const removed = files.slice(keep);
  removed.forEach(file => fs.unlinkSync(file.full));
  return removed.map(file => file.name);
}

async function createBackup(options = {}) {
  const backupDir = path.resolve(options.destination || process.env.BACKUP_DIR || "../backup");
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const baseName = `hotel_backup_${safeFileName(stamp)}.backup`;

  ensureDirectory(backupDir);

  const rawBackup = path.join(backupDir, baseName);
  await runPgDump(rawBackup);

  let finalFile = rawBackup;

  if (options.encrypt) {
    const encrypted = `${rawBackup}.enc`;
    await encryptFile(rawBackup, encrypted);
    fs.unlinkSync(rawBackup);
    finalFile = encrypted;
  }

  let copiedTo = null;
  if (options.copyDestination) {
    copiedTo = copyBackup(finalFile, path.resolve(options.copyDestination));
  }

  const keep = Number(options.retention ?? process.env.BACKUP_RETENTION ?? 5);
  const removed = applyRetention(backupDir, keep);

  return {
    file: finalFile,
    copiedTo,
    removed,
    size: fs.statSync(finalFile).size
  };
}

module.exports = { createBackup };
