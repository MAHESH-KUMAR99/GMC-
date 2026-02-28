import pool from "../database.js";


export class Users{
    static async CheckExist(phone){
        const data = (await pool.query(
            `
            SELECT * FROM users WHERE phonenumber = $1
            `,[phone])).rows[0]
        return data
    }

    static async GetLookupFormData(){
        const masterdata = (await pool.query(`
                SELECT 
                    (SELECT json_agg(s) FROM states s) AS states,
                    (SELECT json_agg(c) FROM neetcategorymaster c) AS neetcategories,
                    (SELECT json_agg(sc) FROM statecategorymaster sc) AS statecategories
            `)).rows

        return masterdata[0];
    }

    


    static async CreateNewUser(payload){
        const data = (await pool.query(`
            INSERT INTO users (phonenumber, name, email , isemailverified, isphoneverified)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
            `,[payload.phone, payload.name, payload.email, true,true])).rows[0]
        return data
    }


    static async GetUserInfo(userid){
        const data = (await pool.query(
            `
            SELECT * FROM users WHERE uid = $1
            `,[userid])).rows[0]
        return data
    }
}