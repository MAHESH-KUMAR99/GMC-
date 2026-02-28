import fetch from "node-fetch"; // ✅ add karo top pe

export class Authentication {
  static SendOTPSMS = async (mobile, otp) => {
    const message = `${otp} is your OTP for login to NEET Navigator MBBS Lighthouse portal. OTP is valid for 30 minutes. Please do not share this OTP. Regards, NEET Navigator Team`;

    const url = `https://alerts.cbis.in/SMSApi/send?userid=neettr&password=NeeT@12&sendMethod=quick&mobile=${mobile}&msg=${encodeURIComponent(message)}&senderid=MBBSLH&msgType=text&dltEntityId=&dltTemplateId=1207168069013452090&duplicatecheck=true&output=json`;

    const response = await fetch(url)
      .then(() => true)
      .catch((err) => {
        console.log(err);
        return false;
      });

    return response;
  };
}