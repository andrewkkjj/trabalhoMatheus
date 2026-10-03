# Hotel Backup — Aula 4

Backend inicial da plataforma de manutenção e backup.

## 1. Instalação

Abra o terminal dentro de `backend`:

```bash
npm install
```

Copie `.env.example` para `.env` e preencha as configurações.

## 2. Chave AES

Gere uma chave:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Coloque o resultado em `ENCRYPTION_KEY_HEX`.

Nunca coloque `.env` no Git.

## 3. PostgreSQL

A aplicação usa `pg_dump`. Verifique se:

```bash
pg_dump --version
```

funciona no terminal.

Se não funcionar, coloque no `.env` o caminho completo do executável em `PG_DUMP_PATH`.

## 4. Iniciar

```bash
npm start
```

Teste:

```text
GET http://localhost:3000/api/health
GET http://localhost:3000/api/backup/connection
```

## Observação

Nesta primeira versão, a opção de compactação ZIP com senha e a tela frontend ainda serão implementadas.
