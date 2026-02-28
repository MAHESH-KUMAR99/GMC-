import pool from "../database.js";


export class StateEligibilityRules{

    static async GetAllEligibleStates(studentdetails){

        const res = (await pool.query(`
            SELECT stateuid FROM stateeligibilityrules
            WHERE (
                (allowdomicilestate = true AND stateuid = $1)
                OR (allow10thstate = true AND stateuid = $2)
                OR (allow12thstate = true AND stateuid = $3)
                OR (allowdomicileand10thstate = true AND stateuid = $1 AND stateuid = $2)
                OR (allowdomicileand12thstate = true AND stateuid = $1 AND stateuid = $3)
                OR (allow10thand12thstate = true AND stateuid = $2 AND stateuid = $3)
                OR (allowdomicileand10thand12thstate = true AND stateuid = $1 AND stateuid = $2 AND stateuid = $3)
            );
        `, [studentdetails.domicilestateuid, studentdetails.state10thuid, studentdetails.state12thuid])).rows;
        
        const eligiblestateidslist = res.map(each => each.stateuid);
        return eligiblestateidslist;
    }
}
