const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.czyrxatqcoeozqkollff:Treenode_958@aws-0-us-west-2.pooler.supabase.com:6543/postgres',
});
  

async function testConnection() {
  try {
    await client.connect();
    console.log('Conexión exitosa a la base de datos!');
    const res = await client.query('SELECT NOW()');
    console.log('Hora actual de la BD:', res.rows[0].now);
  } catch (err) {
    console.error('Error al conectar:', err);
  } finally {
    await client.end();
  }
}

testConnection();
