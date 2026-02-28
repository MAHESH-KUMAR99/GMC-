import pool from "../database.js";
import { Colleges } from "./Colleges.js";
import { LookupMasters } from "./LookupMasters.js";
import { StateEligibilityRules } from "./StateEligibilityRules.js";

export class Reports {
  static async GetCollegeListByRank(studentprofile) {
    const lookupmasterdata = await LookupMasters.GetLookupMasterTableData();
    const defaultcases = await LookupMasters.GetDefaultFilteringUids(
      lookupmasterdata,
      studentprofile,
    );
    const eligiblestateuidslist =
      await StateEligibilityRules.GetAllEligibleStates(studentprofile);
    const excludeseattypeuids = await LookupMasters.ExcludeSeatType(
      studentprofile,
      lookupmasterdata.seattypemaster,
    );

    const collegelist = await Colleges.GetCollegeListByMarks(
      defaultcases,
      studentprofile,
      eligiblestateuidslist,
      excludeseattypeuids,
    );
    return collegelist;
  }

  static async GetAdmissionPossibiliyReport(
    defaultcases,
    eligiblestateuidslist,
    excludeseattypeuids,
    studentprofile,
  ) {
    const admissoinpossibilitylist =
      await Colleges.GetAdmissionPossibilityReport(
        defaultcases,
        eligiblestateuidslist,
        excludeseattypeuids,
        studentprofile,
      );
    return admissoinpossibilitylist;
  }

  static async CheckReportExists(profileid, enrollementid, reporttype) {
    const isreport = (
      await pool.query(
        `
            SELECT  r.*,
                    rv.fileurl,rv.version,rv.totalrecords 
                FROM reports as r
                LEFT JOIN reportversions AS rv ON r.uid = rv.reportuid
            WHERE r.studentprofileuid=$1 AND r.enrollementuid=$2 AND r.reporttype=$3`,
        [profileid, enrollementid, reporttype],
      )
    ).rows[0];

    return isreport;
  }

  static async CreateReport(profileid, enrollementid, reporttype, filepayload) {
    const reportdata = (
      await pool.query(
        `
                INSERT INTO reports (studentprofileuid, enrollementuid, reporttype)
                VALUES ($1,$2,$3) RETURNING *
            `,
        [profileid, enrollementid, reporttype],
      )
    ).rows[0];

    const reportversiondata = (
      await pool.query(
        `
                INSERT INTO reportversions (reportuid, fileurl, version, totalrecords)
                VALUES ($1,$2,$3,$4) RETURNING *
            `,
        [
          reportdata.uid,
          filepayload.url,
          filepayload.version,
          filepayload.totalrecords,
        ],
      )
    ).rows[0];

    return { ...reportdata, ...reportversiondata };
  }

  static async GetChoiceListReportByRank(studentprofile, choicelistpayload) {
    const lookupmasterdata = await LookupMasters.GetLookupMasterTableData();
    const defaultcases = await LookupMasters.GetDefaultFilteringUids(
      lookupmasterdata,
      studentprofile,
    );
    const eligiblestateuidslist =
      await StateEligibilityRules.GetAllEligibleStates(studentprofile);
    const excludeseattypeuids = await LookupMasters.ExcludeSeatType(
      studentprofile,
      lookupmasterdata.seattypemaster,
    );

    const collegelist = await Colleges.GetChoiceListByRank(
      defaultcases,
      studentprofile,
      eligiblestateuidslist,
      excludeseattypeuids,
      choicelistpayload,
    );
    return collegelist;
  }

  static async GetGeneralUniversityList(studentprofile) {
    const lookupmasterdata = await LookupMasters.GetLookupMasterTableData();
    const defaultcases = await LookupMasters.GetDefaultFilteringUids(
      lookupmasterdata,
      studentprofile,
    );
    const eligiblestateuidslist =
      await StateEligibilityRules.GetAllEligibleStates(studentprofile);
    const excludeseattypeuids = await LookupMasters.ExcludeSeatType(
      studentprofile,
      lookupmasterdata.seattypemaster,
    );
    // console.log(defaultcases,eligiblestateuidslist,excludeseattypeuids)
    const generallist = await Colleges.GetGeneralUniversityList();
    // const collegelist = await Colleges.GetCollegeListByRank(defaultcases,studentprofile,eligiblestateuidslist,excludeseattypeuids);
    // return collegelist
  }
}
