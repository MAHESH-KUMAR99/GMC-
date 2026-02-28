import { Authentication } from "../class/auth.js";
import { Colleges } from "../class/Colleges.js";
import { Profiles } from "../class/Profiles.js";
import { Reports } from "../class/Reports.js";
import { JWTSession } from "../class/Session.js";
import { Users } from "../class/User.js";

export const GetStarted = async (req, res) => {
  try {
    const payload = req.body;
    const cookies = req.cookies;
    const useruid = req.params.useruid;

    const data = await Users.GetLookupFormData();
    const profiledata = await Profiles.GetProfileByUserUid(useruid);
    return res.status(200).json({ success: true, data, profiledata });
  } catch (err) {
    console.error("GetStarted error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
// export const GetStarted = async (req, res) => {
//     try {
//         const data = await Users.GetLookupFormData();
//         console.log("Neet Categories:", JSON.stringify(data.neetcategories?.[0])); // 👈 ye add karo
//         return res.status(200).json({ success: true, data });
//     } catch (err) {
//         console.error("GetStarted error:", err);
//         return res.status(500).json({ success: false, message: "Server error" });
//     }
// };

export const SaveProfile = async (req, res) => {
  const payload = req.body;
  const userdata = await Users.GetUserInfo(Number.parseInt(payload.useruid));

  const profileData = await Profiles.GetProfileByUserUid(payload.useruid);
  console.log(profileData);
  if (profileData) {
    return res.status(200).json({ success: true, profileuid: profileData.uid });
  } else {
    const profiledata = await Profiles.CreateNewProfile({
      ...userdata,
      ...payload,
    });
    return res.status(200).json({ success: true, profileuid: profiledata.uid });
  }
};

export const SaveScore = async (req, res) => {
  const payload = req.body;
  const scoretype = payload.inputType === "marks" ? "neetmarks" : "neetranks"; // ✅
  const newdata = await Profiles.UpdateScore(
    payload.profileuid,
    scoretype,
    payload.score,
  );
  console.log(newdata);
  return res.status(200).json({ success: true, data: newdata });
};

export const SendOTP = async (req, res) => {
  console.log("running");
  const { mobile, otp } = req.body;

  const result = await Authentication.SendOTPSMS(mobile, otp);

  if (result) {
    res.json({ success: true, message: "OTP sent successfully" });
  } else {
    res.status(500).json({ success: false, message: "OTP send failed" });
  }
};

export const LoginUser = async (req, res) => {
  const { phone, name, email } = req.body;
  const userdata = await Users.CheckExist(phone);
  const sessionobject = new JWTSession();
  if (userdata) {
    const token = await sessionobject.generateJWTToken(userdata.uid);
    return res
      .status(200)
      .json({ success: true, token, useruid: userdata.uid });
  } else {
    const userdata = await Users.CreateNewUser({ phone, name, email });
    const token = await sessionobject.generateJWTToken(userdata.uid);
    return res
      .status(200)
      .json({ success: true, token, useruid: userdata.uid });
  }
};

export const VerifyOTP = async (req, res) => {};

export const GetSpinData = async (req, res) => {
  const payload = req.body;
  const profiledata = await Profiles.GetProfileByProfileUid(payload.profileuid);
  const collegelist = await Reports.GetCollegeListByRank(profiledata);

  const groupedByInstitutionType = collegelist.reduce(
    (acc, curr) => {
      const type = curr.institutiontype;
      if (type) {
        acc[type] = (acc[type] || 0) + 1;
      }
      return acc;
    },
    {
      Government: 0,
      Private: 0,
      Deemed: 0,
    },
  );

  console.log(groupedByInstitutionType);

  // if(groupedByInstitutionType?.Government){

  // }
  // else{
  //   groupedByInstitutionType["Government"] = 0;
  // }

  return res
    .status(200)
    .json({ success: true, data: groupedByInstitutionType });
};

export const CheckLogin = async (req, res) => {
  const { token } = req.body;
  const session = new JWTSession();

  if (!token) {
    return res.status(400).json({ valid: false, message: "Token required" });
  }

  const result = await session.verifyJWTToken(token);

  const profiledata = await Profiles.GetProfileByProfileUid(result.uid);
  res.json({ ...result, profileuid: profiledata.uid }); // { valid: true/false, uid: mobile }
};
