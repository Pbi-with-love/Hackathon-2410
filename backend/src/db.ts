import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.SUPABASE_URL,
});

pool.on("error", (err: Error) => {
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
});

export { pool };

export async function query(
  text: string,
  params?: unknown[]
): Promise<pg.QueryResult> {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log("executed query", { text, duration, rows: res.rowCount });
  return res;
}

export async function getClient(): Promise<pg.PoolClient> {
  const client = await pool.connect();
  const originalQuery = client.query.bind(client);
  const originalRelease = client.release.bind(client);

  // Monkey-patch the release method to log long-running transactions
  let lastQuery: unknown;
  const timeoutId = setTimeout(() => {
    console.error("A client has been checked out for more than 5 seconds!");
    console.error(
      `The last executed query on this client was: ${JSON.stringify(lastQuery)}`
    );
  }, 5000);

  // @ts-expect-error patching query for instrumentation
  client.query = (...args: unknown[]) => {
    lastQuery = args[0];
    // @ts-expect-error forwarding args
    return originalQuery(...args);
  };

  client.release = () => {
    clearTimeout(timeoutId);
    client.query = originalQuery;
    client.release = originalRelease;
    return originalRelease();
  };

  return client;
}
