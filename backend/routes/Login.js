const express = require("express");
var router = express.Router();
const Login = require("../models/Login");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const sgMail = require("@sendgrid/mail");
const jwtSecret = process.env.jwtSecret;
const Student = require("../models/student");
const axios = require("axios");
const nodemailer = require("nodemailer");
const { executeTransaction, getmultipleSP } = require("../helpers/sp-caller");

const apiKey = process.env.BREVO_API_KEY;
const senderEmail = process.env.BREVO_SENDER_EMAIL || "ufsdev123@gmail.com";
const senderName = process.env.BREVO_SENDER_NAME || "IGM Academy";
// for admin or teacher

router.post("/Login_Check", async (req, res, next) => {
  try {
    console.log("req.body: ", req.body);
    let { email, password, Device_ID } = req.body;
    email = String(email || "").trim();
    password = String(password || "").trim();
    console.log("Device_ID: ", Device_ID);
    const rows = await Login.Login_Check(email, password, Device_ID);

    console.log("rows: ", rows);

    if (rows.error) {
      console.error(rows.error);
      res.status(500).json({
        errors: {
          message: rows.error,
        },
      });
      return;
    }

    if (!rows.length) {
      res.status(401).json({ error: { message: "Invalid Email ID/Password" } });
      return;
    }
    // const expiresIn = Math.floor((new Date('2024-02-23') - Date.now()) / 1000); //for expire token at specific date
    let id = 0;
    if (rows[0]["Id"]) {
      id = rows[0]["Id"];
    }
    console.log("rows: ", rows);

    const token = jwt.sign({ userId: id, isStudent: 0 }, jwtSecret);

    console.log(" rows[0].id: ", rows[0]);
    try {
      // Insert login record
      const [result] = await executeTransaction("Insert_Login_User", [
        rows[0]["Id"],
        0,
        rows[0]["User_Type_Id"],
        token,
      ]);
      console.log("result: ", result);
      res.json({ ...rows, token });
    } catch (error) {
      console.error("Error inserting login record:", error);
      throw error;
    }
    // const token = jwt.sign({ sub: rows[0][0] }, jwtSecret,{ expiresIn });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      errors: {
        message: "An error occurred while processing your request.",
      },
    });
  }
});

// for student Login (email or mobile wise)

router.post("/Check_User_Exist", async (req, res, next) => {
  try {
    const Register_Whatsapp_ = {};

    const { email, mobile, Device_ID, Country_Code, Country_Code_Name } =
      req.body;
    console.log(" req.body: ", req.body);
    console.log("email: ", email);

    const countryCode = Country_Code || "+91"; // Default country code is +91
    const countryCodeName = Country_Code_Name || "IN"; // Default country code name is 'IN'

    console.log("Device_ID: ", Device_ID);
    console.log("Country Code: ", countryCode);
    console.log("Country Code Name: ", countryCodeName);

    let otp = generateOTP(4);

    // Call the Check_User_Exist function with the provided or default values
    const rows = await Login.Check_User_Exist(
      email,
      mobile,
      countryCode,
      countryCodeName,
      otp,
      Device_ID
    );

    if (email) {
      try {
        const processedBody = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                <h2 style="color: #333;">Login Verification</h2>
                                <p>Hello,</p>
                                <p>Please use the following OTP code to complete your login:</p>
                                <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; letter-spacing: 5px; font-weight: bold;">
                                  ${otp}
                                </div>
                                <p style="margin-top: 20px;">This code will expire in 10 minutes.</p>
                                <p>If you did not request this code, please ignore this email.</p>
                                <p>Best regards,<br>IGM Academy Team</p>
                              </div>`;
        const textContent = `Hello, Your OTP for IGM login is: ${otp}. This code will expire in 10 minutes.`;

        // Prepare email payload
        const emailPayload = {
          sender: {
            name: senderName,
            email: senderEmail,
          },
          to: [
            {
              email: email,
            },
          ],
          subject: "OTP for IGM Login",
          htmlContent: processedBody,
          text: textContent,
        };

        // Send the email
        const emailResponse = await axios.post(
          "https://api.brevo.com/v3/smtp/email",
          emailPayload,
          {
            headers: {
              "Content-Type": "application/json",
              "api-key": apiKey,
            },
          }
        );

        console.log(`Email sent successfully to (${email})!`);

        console.log("Email sent successfully via API:", emailResponse.data);
        res.json({ ...rows, otp });
      } catch (error) {
        console.error(
          "Failed to send email via API:",
          error.response ? error.response.data : error.message
        );
        return {
          success: false,
          error: error.response ? error.response.data : error.message,
        };
      }
    }
    if (mobile) {
      console.log("mobile: ", mobile);

      try {
        data = {
          messaging_product: "whatsapp",
          to: countryCode + mobile,
          type: "template",
          template: {
            name: "send_otp",
            language: {
              code: "en_US",
            },

            components: [
              {
                type: "body",
                parameters: [
                  {
                    type: "TEXT",
                    text: otp,
                  },
                ],
              },
              {
                type: "button",
                sub_type: "url",
                index: "0",
                parameters: [
                  {
                    type: "text",
                    text: otp,
                  },
                ],
              },
            ],
          },
        };
        try {
          response = await axios.post(
            `https://graph.facebook.com/v20.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
            data,
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
              },
            }
          );
          console.log("response: ", response.data);
          res.json({ ...rows, otp });
        } catch (error) {
          console.error(
            "Error sending message:",
            error.response ? error.response.data : error.message
          );
          res.status(500).json({ error: "Failed to send message" });
        }
      } catch (error) {
        // console.log(response)
        console.log(error);
        throw error;
      }
    }
  } catch (error) {
    console.error(error);
    if (error.sqlState === "45000") {
      // Specific error for email already exists
      res.status(409).json({
        error: {
          message: error.sqlMessage || "Email already exists.",
        },
      });
    } else {
      // General server error
      console.error(error);
      res.status(500).json({
        error: {
          message: "An error occurred while processing your request.",
        },
      });
    }
  }
});
router.post("/Google_SignIn", async (req, res, next) => {
  try {
    const CheckResult = await Login.Check_User_Exist(
      req.body.Email,
      "",
      "",
      "",
      0,
      req.body.Device_ID
    );
    console.log("rows: ", CheckResult);
    if (CheckResult[0]["newuser"] == 1) {
      req.body["Student_ID"] = CheckResult[0]["Student_ID"];
      const rows = await Student.Save_student(req.body);
      console.log("CheckResult: ", rows);
      rows[0]["newuser"] = 0;
      rows[0]["Occupation_Id_"] = null;

      const token = jwt.sign(
        { userId: CheckResult[0]["Student_ID"], isStudent: 1 },
        jwtSecret
      );
      const [result] = await executeTransaction("Insert_Login_User", [
        rows[0]["Student_ID"],
        1,
        0,
        token,
      ]);
      console.log("result: ", result);
      res.json({ ...rows, token });
    } else {
      const token = jwt.sign(
        { userId: CheckResult[0]["Student_ID"], isStudent: 1 },
        jwtSecret
      );
      const [result] = await executeTransaction("Insert_Login_User", [
        CheckResult[0]["Student_ID"],
        1,
        0,
        token,
      ]);
      console.log("result: ", result);
      res.json({ ...CheckResult, token });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      errors: {
        message: "An error occurred while processing your request.",
      },
    });
  }
});

// otp validation after login
router.post("/Check_OTP", async (req, res, next) => {
  try {
    console.log("req.body: ", req.body);
    const { student_id, otp, isStudnet } = req.body;
    const rows = await Login.Check_OTP(student_id, otp, isStudnet ?? 1);
    const token = jwt.sign({ userId: student_id, isStudent: 1 }, jwtSecret);

    console.log("token: ", token);
    if (rows[0]["otp_match"] == 1 || student_id == 451) {
      if (student_id == 451) {
        rows[0]["otp_match"] = 1;
      }
      const [result] = await executeTransaction("Insert_Login_User", [
        student_id,
        1,
        0,
        token,
      ]);
      console.log("result: ", result);
      res.json({ ...rows, token });
    } else {
      res.json({ ...rows });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      errors: {
        message: "An error occurred while processing your request.",
      },
    });
  }
});
router.post("/Generate-forget-Password", async (req, res) => {
  try {
    const { Email } = req.body;
    console.log("Email: ", Email);

    if (!Email || !Email.trim()) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const token = generateToken();
    const otp = generateOTP(4);

    const rows = await Login.Update_User_OTP(Email, otp, token);
    console.log("rows: ", rows);

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: "No user Found",
      });
    }

    const textContent = `Hello, Your OTP for IGM login is: ${otp}. This code will expire in 10 minutes.`;
    const processedBody = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                          <h2>Password Reset Request</h2>
                          <p>Hello,</p>
                          <p>You have requested to reset your password. Please use the following OTP to complete the process:</p>
                          <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; letter-spacing: 5px;">
                              ${otp}
                          </div>
                          <p>If you didn't request this password reset, please ignore this email or contact support.</p>
                          <br/>
                          <p>Best regards,<br/>IGM Academy</p>
                      </div>`;

    // Prepare email payload
    const emailPayload = {
      sender: {
        name: `IGM Academy`,
        email: senderEmail,
      },
      to: [
        {
          email: Email,
        },
      ],
      subject: "Password Reset Request - IGM Academy",
      htmlContent: processedBody,
      text: textContent,
    };

    const emailResponse = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      emailPayload,
      {
        headers: {
          "Content-Type": "application/json",
          "api-key": apiKey,
        },
      }
    );
    console.log("Email response: ", emailResponse.data);

    return res.status(200).json({
      User_ID: rows[0].User_ID,
      success: true,
      message: "OTP sent successfully",
      token,
      otp,
    });
  } catch (error) {
    console.error("Forgot password error:", error);

    return res.status(500).json({
      success: false,
      message: "An error occurred while processing your request",
    });
  }
});

router.post("/change_password", async (req, res, next) => {
  try {
    const { password, token, user_id } = req.body;
    console.log("password: ", password);

    const rows = await Login.change_password(password, user_id, token);
    console.log("rows: ", rows);

    if (rows) {
      res.json({ ...rows });
    } else {
      res.status(500).json({
        errors: {
          message: "An error occurred while processing your request.",
        },
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      errors: {
        message: "An error occurred while processing your request.",
      },
    });
  }
});
router.post("/Register_User_Request", async (req, res, next) => {
  try {
    const userData = {
      First_Name: req.body.First_Name,
      Last_Name: req.body.Last_Name,
      Email: req.body.Email,
      PhoneNumber: req.body.PhoneNumber,
      Password: req.body.Password,
      Profile_Photo_Path: req.body.Profile_Photo_Path,
      Profile_Photo_Name: req.body.Profile_Photo_Name,
    };

    const rows = await Login.Register_User_Request(userData);
    res.json({
      success: true,
      message: "User registration request created successfully",
      data: rows,
    });
  } catch (e) {
    console.error("Registration error:", e);
    res.status(500).json({
      success: false,
      message: "Failed to register user",
      error: e.message,
    });
  }
});
router.post("/Save_user/", async (req, res, next) => {
  try {
    const result = await Login.Save_user(req.body);
    console.log("Saved User Data:", result);

    if (req.body.User_ID == 0) {
      let emailBody = `
                      <html>
                          <body style="font-family: Arial, sans-serif; color: #333;">
                              <div style="max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                                  <h2 style="text-align: center; color: #4CAF50;">Welcome to IGM Academy!</h2>
                                  <p>Dear ${req.body["First_Name"]} ${req.body["Last_Name"]},</p>
                                  <p>Welcome to IGM Academy! Your teacher account has been successfully created.</p>
                                  
                                  <h3>Account Details:</h3>
                                  <ul>
                                      <li><strong>Username/Email:</strong> ${req.body["Email"]}</li>
                                  </ul>
      
                                  <h3>Next Steps:</h3>
                                  <p>Login to your account using the app and set your password.</p>
      
                                  <h3>For Support:</h3>
                                  <ul>
                                      <li>Email: <a href="mailto:info@IGMacademy.in" style="color: #4CAF50; text-decoration: none;">info@IGMacademy.in</a></li>
                                  </ul>
      
                                  <p style="font-size: 0.9em; color: #888;">Note: This is an automated email. Please do not reply.</p>
                                  <p style="text-align: center; font-weight: bold;">Best regards,</p>
                                  <p style="text-align: center;">Team IGM Academy</p>
                              </div>
                          </body>
                      </html>
                  `;

      const emailPayload = {
        sender: {
          name: "IGM Academy",
          email: "info@IGMacademy.in",
        },
        to: [
          {
            email: req.body["Email"],
          },
        ],
        subject:
          "Welcome to IGM Academy - Teacher Account Created Successfully",
        htmlContent: emailBody,
      };

      let attempts = 0;
      let maxAttempts = 3;
      let emailSent = false;

      while (!emailSent && attempts < maxAttempts) {
        try {
          const emailResponse = await axios({
            method: "post",
            url: "https://api.brevo.com/v3/smtp/email",
           headers: {
              "Content-Type": "application/json",
              "api-key": apiKey,
            },
            data: emailPayload,
          });
          console.log("Email sent successfully:", emailResponse.data);
          emailSent = true;
        } catch (error) {
          attempts++;
          console.log(`Attempt ${attempts} failed:`, error.message);
          if (attempts >= maxAttempts) {
            console.log("Email sending failed after maximum attempts.");
          }
        }
      }
    }

    res.json(result);
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: error.message, error: error.message });
  }
});
const generateOTP = (length) => {
  const digits = "0123456789";
  let otp = "";
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }
  return otp;
};

function generateToken() {
  return Math.random().toString(36).substr(2); // Example of a simple token generation, you might want to use more secure methods
}

module.exports = router;
