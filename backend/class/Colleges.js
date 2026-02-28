import pool from "../database.js";
import { StateMaster } from "./StatesMaster.js";

export class Colleges {
  static async MapStates(collegelist = []) {
    if (!collegelist.length) return;
    const statelookup = await StateMaster.GetStateLookup();

    for (let each of collegelist) {
      each["stateid"] = statelookup[each.state] || null;
    }
    return collegelist;
  }

  static async InsertBatch(batchlist) {
    const values = [];
    const placeholder = [];

    batchlist.forEach((row, index) => {
      const baseindex = index * 15;
      placeholder.push(
        `($${baseindex + 1},$${baseindex + 2},$${baseindex + 3}, $${baseindex + 4}, $${baseindex + 5}, $${baseindex + 6}, $${baseindex + 7}, $${baseindex + 8}, $${baseindex + 9}, $${baseindex + 10}, $${baseindex + 11}, $${baseindex + 12}, $${baseindex + 13} ,$${baseindex + 14}, $${baseindex + 15})`,
      );

      values.push(
        row.collegename,
        row.collegecode,
        row.region,
        row.address || null,
        row.state,
        row.stateid,
        row.city,
        row.pincode,
        row.course,
        row.institutiontype,
        Number.parseInt(row.yearofpermission),
        row.yearofinception,
        row.collegerating || null,
        row.distancefromairport || null,
        Number.parseInt(row.cityrating) || null,
      );
    });

    const query = `
                INSERT INTO colleges (collegename, collegecode, region, address,statename, stateid, city, pincode, course, institutiontype, yearofpermission, yearofinception, collegerating,distancefromairport, cityrating) VALUES ${placeholder.join(",")};    
        `;

    const res = await pool
      .query(query, values)
      .then((res) => {
        return true;
      })
      .catch((err) => {
        console.log(err);
        return false;
      });
    return res;
  }

  static async BulkCSVUpload(colleglist = []) {
    const totalbatch = Math.round(colleglist.length / 100);
    const batchsize = 100;
    let startindex = 0;
    for (startindex; startindex < totalbatch; startindex++) {
      const batch = colleglist.slice(
        startindex * batchsize,
        startindex * batchsize + batchsize,
      );
      const res = await this.InsertBatch(batch);
      if (res) {
        console.log(`Batch ${startindex + 1} Inserted Successfully`);
      } else {
        console.log(`Error Inserting Batch ${startindex + 1}`);
      }
    }
  }

  static async GetUniqueCollegeReport(collegelist) {
    const uniqueColleges = Array.from(
      collegelist.rows
        .reduce((acc, item) => {
          const key = item.collegename; // correct key

          if (
            !acc.has(key) ||
            acc.get(key).overallmaxmarks < item.overallmaxmarks // correct property
          ) {
            acc.set(key, item);
          }

          return acc;
        }, new Map())
        .values(),
    );

    return uniqueColleges;
  }

  static async GetCollegeListByMarks(
    defaultcases,
    studentdetails,
    eligiblestateuidslist,
    excludeseattypeuids,
  ) {
    const collegelist = await pool.query(
      `
                        SELECT * FROM (
                            SELECT DISTINCT ON (c.collegename)
                                c.collegename,
                                c.region, c.statename, c.city, c.course, c.institutiontype,c.pincode,
                                cr.totalfee,
                                cv.isfemale,
                                cv.isph,
                                cm.counselling,
                                em.eligibility,
                                nm.neetcategory,
                                sm.statecategory,
                                am.area,
                                mm.minority,
                                afm.armedforce,
                                qm.quota,
                                stm.seattype,
                                frm.feerange,
                                cr.r1maxrank,
                                cr.r2maxrank,
                                cr.r3maxrank,
                                cr.r4maxrank,
                                cr.overallmaxrank,
                                cr.overallmaxmarks,
                                cr.year
                            FROM collegeranksandfees cr
                            LEFT JOIN collegevariants cv ON cr.variantuid = cv.uid
                            LEFT JOIN colleges c ON cv.collegeuid = c.uid
                            LEFT JOIN counsellingmaster cm ON cv.counsellinguid = cm.uid
                            LEFT JOIN eligibilitymaster em ON cv.eligibilityuid = em.uid
                            LEFT JOIN neetcategorymaster nm ON cv.neetcategoryuid = nm.uid
                            LEFT JOIN statecategorymaster sm ON cv.statecategoryuid = sm.uid
                            LEFT JOIN areamaster am ON cv.areauid = am.uid
                            LEFT JOIN minoritymaster mm ON cv.minorityuid = mm.uid
                            LEFT JOIN armedforcesmaster afm ON cv.armedforceuid = afm.uid 
                            LEFT JOIN quotamaster qm ON cv.quotauid = qm.uid
                            LEFT JOIN feerangemaster frm ON cr.feerangeuid = frm.uid
                            LEFT JOIN seattypemaster stm ON cv.seattypeuid = stm.uid

                            WHERE
                                cr.year = $12
                                AND (c.stateid = ANY($1) OR cv.eligibilityuid = $2)
                                AND (cv.neetcategoryuid = ANY($3) OR cv.statecategoryuid = ANY($4))
                                AND (($5::INT IS NOT NULL AND (cv.quotauid = $5::INT OR cv.quotauid IS NULL)) OR ($5::INT IS NULL AND cv.quotauid IS NULL))
                                AND (($6::INT IS NOT NULL AND (cv.minorityuid = $6::INT OR cv.minorityuid IS NULL)) OR ($6::INT IS NULL AND cv.minorityuid IS NULL))
                                AND (($7::INT IS NOT NULL AND (cv.armedforceuid = $7::INT OR cv.armedforceuid IS NULL)) OR ($7::INT IS NULL AND cv.armedforceuid IS NULL))
                                AND ($8 = ARRAY[]::INTEGER[] OR cv.seattypeuid != ALL($8))
                                AND ( $9 = 'Female' OR cv.isfemale = 'General')
                                AND cv.areauid = ANY($10)
                                AND ($11 = 'Yes' OR cv.isph = 'No')
                                AND (cr.overallmaxmarks <= $13)

                            ORDER BY c.collegename, cr.overallmaxmarks ASC
                        ) AS unique_colleges
                        ORDER BY unique_colleges.overallmaxrank ASC;
                    `,
      [
        eligiblestateuidslist,
        defaultcases.defaulteligibilityuid,
        defaultcases.defaultneetcategoryuids,
        defaultcases.defaultstatecategoryuids,

        studentdetails.quotauid,
        studentdetails.minorityuid,
        studentdetails.armedforceuid,
        excludeseattypeuids,
        studentdetails.gender,

        defaultcases.defaultareauids,
        studentdetails.isph,
        2024,
        studentdetails.neetmarks,
      ],
    );
    return collegelist.rows;
  }

  static async GetAdmissionPossibilityReport(
    defaultcases,
    eligiblestateuidslist,
    excludeseattypeuids,
    studentprofile,
  ) {
    const admissionPlan = await pool.query(
      `
            WITH filtered_colleges AS (
                SELECT DISTINCT ON (c.collegename)
                    c.collegename,
                    c.region, c.statename, c.city, c.course, c.institutiontype, c.pincode,
                    cr.totalfee,
                    cv.isfemale,
                    cv.isph,
                    cm.counselling,
                    em.eligibility,
                    nm.neetcategory,
                    sm.statecategory,
                    am.area,
                    mm.minority,
                    afm.armedforce,
                    qm.quota,
                    stm.seattype,
                    frm.feerange,
                    cr.r1maxrank,
                    cr.r2maxrank,
                    cr.r3maxrank,
                    cr.r4maxrank,
                    cr.overallmaxrank,
                    cr.overallmaxmarks,
                    cr.year
                FROM collegeranksandfees cr
                LEFT JOIN collegevariants cv ON cr.variantuid = cv.uid
                LEFT JOIN colleges c ON cv.collegeuid = c.uid
                LEFT JOIN counsellingmaster cm ON cv.counsellinguid = cm.uid
                LEFT JOIN eligibilitymaster em ON cv.eligibilityuid = em.uid
                LEFT JOIN neetcategorymaster nm ON cv.neetcategoryuid = nm.uid
                LEFT JOIN statecategorymaster sm ON cv.statecategoryuid = sm.uid
                LEFT JOIN areamaster am ON cv.areauid = am.uid
                LEFT JOIN minoritymaster mm ON cv.minorityuid = mm.uid
                LEFT JOIN armedforcesmaster afm ON cv.armedforceuid = afm.uid
                LEFT JOIN quotamaster qm ON cv.quotauid = qm.uid
                LEFT JOIN feerangemaster frm ON cr.feerangeuid = frm.uid
                LEFT JOIN seattypemaster stm ON cv.seattypeuid = stm.uid
                WHERE
                    cr.year = $12
                    AND (c.stateid = ANY($1) OR cv.eligibilityuid = $2)
                    AND (cv.neetcategoryuid = ANY($3) OR cv.statecategoryuid = ANY($4))
                    AND (($5::INT IS NOT NULL AND (cv.quotauid = $5::INT OR cv.quotauid IS NULL)) OR ($5::INT IS NULL AND cv.quotauid IS NULL))
                    AND (($6::INT IS NOT NULL AND (cv.minorityuid = $6::INT OR cv.minorityuid IS NULL)) OR ($6::INT IS NULL AND cv.minorityuid IS NULL))
                    AND (($7::INT IS NOT NULL AND (cv.armedforceuid = $7::INT OR cv.armedforceuid IS NULL)) OR ($7::INT IS NULL AND cv.armedforceuid IS NULL))
                    AND ($8 = ARRAY[]::INTEGER[] OR cv.seattypeuid != ALL($8))
                    AND ($9 = 'Female' OR cv.isfemale = 'General')
                    AND cv.areauid = ANY($10)
                    AND ($11 = 'Yes' OR cv.isph = 'No')
                    AND cr.overallmaxrank >= ($13::INT * 0.70)
                ORDER BY c.collegename, cr.overallmaxmarks ASC
            ),
            categorized AS (
                SELECT *,
                    CASE
                        WHEN overallmaxrank >= $13::INT THEN 'green'
                        WHEN overallmaxrank >= ($13::INT * 0.85) THEN 'yellow'
                        ELSE 'red'
                    END AS zone
                FROM filtered_colleges
            ),
            ranked AS (
                SELECT *,
                    ROW_NUMBER() OVER (PARTITION BY zone ORDER BY 
                        CASE zone
                            WHEN 'green' THEN overallmaxrank 
                        END ASC,
                        CASE zone
                            WHEN 'yellow' THEN overallmaxrank
                            WHEN 'red' THEN overallmaxrank
                        END DESC
                    ) AS rn
                FROM categorized
            )
            SELECT * FROM ranked
            WHERE 
                (zone = 'green' AND rn <= $14)
                OR (zone = 'yellow' AND rn <= $15)
                OR (zone = 'red' AND rn <= $16)
            ORDER BY 
                CASE zone WHEN 'green' THEN 1 WHEN 'yellow' THEN 2 WHEN 'red' THEN 3 END,
                overallmaxrank DESC;
        `,
      [
        eligiblestateuidslist, // $1
        defaultcases.defaulteligibilityuid, // $2
        defaultcases.defaultneetcategoryuids, // $3
        defaultcases.defaultstatecategoryuids, // $4
        studentprofile.quotauid, // $5
        studentprofile.minorityuid, // $6
        studentprofile.armedforceuid, // $7
        excludeseattypeuids, // $8
        studentprofile.gender, // $9
        defaultcases.defaultareauids, // $10
        studentprofile.isph, // $11
        2024, // $12
        studentprofile.neetrank, // $13
        25, // $14 - green limit (rest/majority)
        15, // $15 - yellow limit
        10, // $16 - red limit
      ],
    );

    return admissionPlan.rows;
  }

  static async GetChoiceListByRank(
    defaultcases,
    studentdetails,
    eligiblestateuidslist,
    excludeseattypeuids,
    choicelistpayload,
  ) {
    const strategyCumulativeFields = {
      A: ["cr.r1maxrank"],
      B: ["cr.r1maxrank", "cr.r2maxrank"],
      C: ["cr.r1maxrank", "cr.r2maxrank", "cr.r3maxrank"],
      D: ["cr.r1maxrank", "cr.r2maxrank", "cr.r3maxrank", "cr.r4maxrank"],
    };

    const fields = strategyCumulativeFields[choicelistpayload.strategy];

    // Build dynamic rank condition:
    // If ANY round field has value > 0 AND <= eligibleRank → include
    // If ALL round fields are 0/null → fallback to overallmaxrank <= eligibleRank
    const roundChecks = fields
      .map((f) => `(${f} IS NOT NULL AND ${f} > 0 AND ${f} <= $13)`)
      .join(" OR ");
    const allZeroChecks = fields
      .map((f) => `(${f} IS NULL OR ${f} = 0)`)
      .join(" AND ");

    const rankCondition = `
        (
            (${roundChecks})
            OR
            (${allZeroChecks} AND cr.overallmaxrank <= $13)
        )
    `;

    console.log(rankCondition);

    const collegelist = await pool.query(
      `
        SELECT 
            c.collegename,
            c.region, c.statename, c.city, c.course, c.institutiontype, c.pincode,
            cv.isph,
            cv.isfemale,
            cr.totalfee,
            cm.counselling,
            em.eligibility,
            nm.neetcategory,
            sm.statecategory,
            am.area,
            mm.minority,
            afm.armedforce,
            qm.quota,
            stm.seattype,
            frm.feerange,
            cr.r1maxrank,
            cr.r2maxrank,
            cr.r3maxrank,
            cr.r4maxrank,
            cr.overallmaxrank,
            cr.year
        FROM collegeranksandfees cr
        LEFT JOIN collegevariants cv ON cr.variantuid = cv.uid
        LEFT JOIN colleges c ON cv.collegeuid = c.uid
        LEFT JOIN counsellingmaster cm ON cv.counsellinguid = cm.uid
        LEFT JOIN eligibilitymaster em ON cv.eligibilityuid = em.uid
        LEFT JOIN neetcategorymaster nm ON cv.neetcategoryuid = nm.uid
        LEFT JOIN statecategorymaster sm ON cv.statecategoryuid = sm.uid
        LEFT JOIN areamaster am ON cv.areauid = am.uid
        LEFT JOIN minoritymaster mm ON cv.minorityuid = mm.uid
        LEFT JOIN armedforcesmaster afm ON cv.armedforceuid = afm.uid 
        LEFT JOIN quotamaster qm ON cv.quotauid = qm.uid
        LEFT JOIN feerangemaster frm ON cr.feerangeuid = frm.uid
        LEFT JOIN seattypemaster stm ON cv.seattypeuid = stm.uid

        WHERE
            cr.year = $12
            AND (c.stateid = ANY($1) OR cv.eligibilityuid = $2)
            AND (cv.neetcategoryuid = ANY($3) OR cv.statecategoryuid = ANY($4))
            AND (($5::INT IS NOT NULL AND (cv.quotauid = $5::INT OR cv.quotauid IS NULL)) OR ($5::INT IS NULL AND cv.quotauid IS NULL))
            AND (($6::INT IS NOT NULL AND (cv.minorityuid = $6::INT OR cv.minorityuid IS NULL)) OR ($6::INT IS NULL AND cv.minorityuid IS NULL))
            AND (($7::INT IS NOT NULL AND (cv.armedforceuid = $7::INT OR cv.armedforceuid IS NULL)) OR ($7::INT IS NULL AND cv.armedforceuid IS NULL))
            AND ($8 = ARRAY[]::INTEGER[] OR cv.seattypeuid != ALL($8))
            AND ( $9 = 'Female' OR cv.isfemale = 'General')
            AND cv.areauid = ANY($10)
            AND ($11 = 'Yes' OR cv.isph = 'No')
            AND ${rankCondition}
    `,
      [
        eligiblestateuidslist,
        defaultcases.defaulteligibilityuid,
        defaultcases.defaultneetcategoryuids,
        defaultcases.defaultstatecategoryuids,
        studentdetails.quotauid,
        studentdetails.minorityuid,
        studentdetails.armedforceuid,
        excludeseattypeuids,
        studentdetails.gender,
        defaultcases.defaultareauids,
        studentdetails.isph,
        2024,
        choicelistpayload.eligibleRank,
      ],
    );

    const uniqueColleges = await this.GetUniqueCollegeReport(collegelist);
    return uniqueColleges;
  }

  static async GetGeneralUniversityList(studentprofile) {
    const colleges = await pool.query(`
                SELECT 
                    * 
                    FROM colleges 
                    LEFT JOIN collegevariants cv ON colleges.uid = cv.collegeuid
                    WHERE cv 

            `);
  }
}
