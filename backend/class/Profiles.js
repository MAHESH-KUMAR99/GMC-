import pool from "../database.js";

export class Profiles {
  static async CreateNewProfile(payload) {
    const data = (
      await pool.query(
        `
                INSERT INTO studentprofile (useruid,name, email, gender, domicilestateuid, neetcategoryuid, statecategoryuid, state10thuid, state12thuid, source )

                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                RETURNING *
            `,
        [
          payload.uid,
          payload.name,
          payload.email,
          payload.gender,
          payload.state_uid,
          payload.category_uid,
          payload.stateCategory_uid,
          payload.state10thuid,
          payload.state12thuid,
          payload.source,
        ],
      )
    ).rows[0];
    return data;
  }

  static async GetProfileByUserUid(useruid) {
    const data = (
      await pool.query(
        `
                SELECT 
                    uid,gender, domicilestateuid, neetcategoryuid, statecategoryuid, state10thuid, state12thuid
                    FROM studentprofile WHERE useruid = $1
            `,
        [useruid],
      )
    ).rows[0];
    return data;
  }


  static async UpdateScore(profileuid, scroretype, newscore){
    const data = await pool.query(
        `
        UPDATE studentprofile SET ${scroretype} = $1 WHERE uid = $2 RETURNING *
        `,
        [newscore, profileuid]
    );
    return data.rows[0];
  }



  static async GetProfileByProfileUid(profileuid){
    const data = await pool.query(
      `
        SELECT * FROM studentprofile WHERE uid = $1`,
      [profileuid]
    );
    return data.rows[0];
  }
}
