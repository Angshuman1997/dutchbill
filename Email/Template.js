const generateMessageBody = (recipientName, otpCode) => {
  return `
        Subject: Your One-Time Password (OTP) for Verification
    
        Dear ${recipientName},
    
        Thank you for using our services. Your One-Time Password (OTP) for verification is: ${otpCode}.
    
        Please enter this OTP on the verification page to complete your action.
    
        If you did not request this OTP or have any concerns, please contact our support team immediately.
    
        Thank you,
        Team DutchBill
      `;
};

module.exports = {
  generateMessageBody,
};
