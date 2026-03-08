import dotenv from 'dotenv';
import { resetOracleEvolution } from './src/app/actions/intel/resetEvolution.js';

dotenv.config({ path: '.env.local' });

async function test() {
    console.log("Calling resetOracleEvolution...");
    const result = await resetOracleEvolution();
    console.log("Result:", result);
    process.exit(0);
}

test();
