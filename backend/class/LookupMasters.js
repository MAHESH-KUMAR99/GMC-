import pool from "../database.js";

export class LookupMasters {
  static async GetLookupFormData() {
    const masterdata = (
      await pool.query(`
                SELECT 
                    (SELECT json_agg(s) FROM states s) AS states,
                    (SELECT json_agg(a) FROM areamaster a) AS areas,
                    (SELECT json_agg(c) FROM neetcategorymaster c) AS neetcategories,
                    (SELECT json_agg(sc) FROM statecategorymaster sc) AS statecategories,
                    (SELECT json_agg(af) FROM armedforcesmaster af) AS armedforces,
                    (SELECT json_agg(m) FROM minoritymaster m) AS minorities,
                    (SELECT json_agg(q) FROM quotamaster q) AS quotas,
                    (SELECT json_agg(e) FROM feerangemaster e) AS feeranges
            `)
    ).rows;

    return masterdata[0];
  }

  static async GetLookupMasterTableDataforVariants() {
    const masterdata = (
      await pool.query(`
                SELECT 
                    (SELECT json_object_agg(c.collegename,c.uid) FROM colleges c) AS collegemaster,
                    (SELECT json_object_agg(cm.counselling, cm.uid) FROM counsellingmaster cm) AS counsellingmaster,
                    (SELECT json_object_agg(em.eligibility, em.uid) FROM eligibilitymaster em) AS eligibilitymaster,
                    (SELECT json_object_agg(nm.neetcategory, nm.uid) FROM neetcategorymaster nm) AS neetcategorymaster,
                    (SELECT json_object_agg(sc.statecategory,sc.uid) FROM statecategorymaster sc) AS statecategorymaster,
                    (SELECT json_object_agg(am.area, am.uid) FROM areamaster am) AS areamaster,
                    (SELECT json_object_agg(mm.minority, mm.uid) FROM minoritymaster mm) AS minoritymaster,
                    (SELECT json_object_agg(afm.armedforce, afm.uid) FROM armedforcesmaster afm) AS armedforcesmaster,
                    (SELECT json_object_agg(qm.quota, qm.uid) FROM quotamaster qm) AS quotamaster,
                    (SELECT json_object_agg(stm.seattype, stm.uid) FROM seattypemaster stm) AS seattypemaster
            `)
    ).rows[0];

    return masterdata;
  }

  static async GetLookupMasterTableData() {
    const masterdata = (
      await pool.query(`
                SELECT 
                    (SELECT json_object_agg(em.eligibility, em.uid) FROM eligibilitymaster em) AS eligibilitymaster,
                    (SELECT json_object_agg(nm.neetcategory, nm.uid) FROM neetcategorymaster nm) AS neetcategorymaster,
                    (SELECT json_object_agg(sc.statecategory,sc.uid) FROM statecategorymaster sc) AS statecategorymaster,
                    (SELECT json_object_agg(am.area, am.uid) FROM areamaster am) AS areamaster,
                    (SELECT json_object_agg(stm.seattype, stm.uid) FROM seattypemaster stm) AS seattypemaster
            `)
    ).rows[0];

    return masterdata;
  }

  static async GetDefaultFilteringUids(lookupmasterdata, studentdetails) {
    // Default eligibility UID
    const defaulteligibilityuid = lookupmasterdata.eligibilitymaster["Open"];

    // Default Neet Category UIDs
    const defaultneetcategoryuids = [];
    defaultneetcategoryuids.push(lookupmasterdata.neetcategorymaster["Open"]);
    defaultneetcategoryuids.push(
      lookupmasterdata.neetcategorymaster["Unreserved"],
    );
    defaultneetcategoryuids.push(studentdetails.neetcategoryuid);

    // Default State Category UIDs
    const defaultstatecategoryuids = [];
    defaultstatecategoryuids.push(lookupmasterdata.statecategorymaster["Open"]);
    defaultstatecategoryuids.push(
      lookupmasterdata.statecategorymaster["Unreserved"],
    );
    defaultstatecategoryuids.push(
      lookupmasterdata.statecategorymaster["General"],
    );
    defaultstatecategoryuids.push(studentdetails.statecategoryuid);

    // Default Area UIDS
    const defaultareauids = [];
    defaultareauids.push(lookupmasterdata.areamaster["All"]);
    defaultareauids.push(studentdetails.areauid);

    return {
      defaulteligibilityuid,
      defaultneetcategoryuids,
      defaultstatecategoryuids,
      defaultareauids,
    };
  }

  static async ExcludeSeatType(studentdetails, seattypemaster) {
    const excludeseattypeuids = [];
    if (!studentdetails.minorityuid) {
      excludeseattypeuids.push(seattypemaster["Minority"]);
    }
    if (studentdetails.quotauid != 1) {
      excludeseattypeuids.push(seattypemaster["NRI"]);
    }
    if (studentdetails.quotauid != 2) {
      excludeseattypeuids.push(seattypemaster["ESIC"]);
    }

    return excludeseattypeuids;
  }

  static async GetFeerangeLookupMaster() {
    const lookupmaster = (
      await pool.query(`
                SELECT 
                    (SELECT json_object_agg(fm.feerange,fm.uid) FROM feerangemaster fm) AS feerangemaster
            `)
    ).rows[0];

    return lookupmaster?.feerangemaster;
  }

  static async MapFeerangeUids(recordlist) {
    const feerangemaster = await this.GetFeerangeLookupMaster();
    for (let each of recordlist) {
      each["feerangeuid"] = feerangemaster[each.feerange];
    }

    return recordlist;
  }

  static async GetAllAreas() {
    const response = (
      await pool.query(`
            SELECT uid,area FROM areamaster ORDER BY area ASC
        `)
    ).rows;
    return response;
  }

  static async UpdateStateAreaList(payload) {
    const updatedstatedata = (
      await pool.query(
        `
            UPDATE states
                SET statearealist = $1
                WHERE uid = $2
            RETURNING uid, statename, statecode, statearealist
        `,
        [payload.areauids, payload.stateuid],
      )
    ).rows[0];

    return updatedstatedata;
  }

  static async GetAllStateCategories() {
    const response = (
      await pool.query(`
            SELECT uid, statecategory FROM statecategorymaster ORDER BY statecategory ASC`)
    ).rows;

    return response;
  }

  static async UpdateStateCategoryList(payload) {
    const updatedstatedata = (
      await pool.query(
        `
            UPDATE states
                SET statecategorylist = $1
                WHERE uid = $2
            RETURNING uid, statename, statecode, statecategorylist
            `,
        [payload?.statecategoryuids, payload.stateuid],
      )
    ).rows[0];

    return updatedstatedata;
  }

  static async GetAdmissionPlanLookupMaster(fileurl) {
    const lookupmaster = (
      await pool.query(`
                SELECT 
                    (SELECT json_object_agg(frm.feerange,frm.uid) FROM feerangemaster frm) AS admissionplanmaster
            `)
    ).rows[0];

    const statlist = await CSVServices.getExcelFieldData(fileurl, "statename");

    lookupmaster.statemaster = statlist;
    return lookupmaster;
  }
}
