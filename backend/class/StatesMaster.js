import pool from "../database.js";


export class StateMaster{
    static async GetStateLookup(){
        const response = (await pool.query(`
                SELECT 
                    (SELECT json_object_agg(statename,uid) FROM states) as statelookup
            `)).rows[0]
    
        return response.statelookup
    }


    static async GetAllStates(){
        const response = (await pool.query(`
            SELECT uid,statename,statearealist,statecategorylist FROM states ORDER BY statename ASC
        `)).rows;
        return response;
    }
}