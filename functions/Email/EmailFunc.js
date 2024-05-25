const nodemailer = require("nodemailer");
require("dotenv").config();

// Create a transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Function to send an email
async function sendEmail(fromEmail, toEmail, subject, text, html) {
  try {
    // Send mail with defined transport object
    const info = await transporter.sendMail({
      from: `"Team Bard" <${fromEmail}>`, // Sender address
      to: toEmail, // List of receivers
      subject, // Subject line
      text, // Plain text body
      html, // HTML body
    });

    // Test
    // const info = await transporter.sendMail({
    //   from: '"Team Bard" <project01bard@gmail.com>', // Sender address
    //   to: "angshubardhan97@gmail.com", // List of receivers
    //   subject: "Hello ✔", // Subject line
    //   text: "Hello world?", // Plain text body
    //   html: "<b>Hello world?</b>", // HTML body
    // });

    // console.log("Message sent: %s", info.messageId);
    // Preview only available when sending through an Ethereal account
    // console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));

    return { success: true, info: info };
  } catch (error) {
    // console.error("Error sending email:", error);
    return { success: false, info: error };
  }
}

// Export the sendEmail function
module.exports = { sendEmail };
