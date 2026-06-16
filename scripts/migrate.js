import postgres from 'postgres';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    console.error("Error: DATABASE_URL is not defined in .env file.");
    process.exit(1);
}

const sql = postgres(connectionString);

async function run() {
    console.log("Connecting to Supabase and running schema.sql...");
    const schema = fs.readFileSync('schema.sql', 'utf8');
    try {
        await sql.unsafe(schema);
        console.log("Database schema migrated successfully!");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await sql.end();
    }
}

run();
