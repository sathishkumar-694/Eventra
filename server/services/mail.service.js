import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export const sendEmail = async (to, subject, html) => {
  if (!resend) {
    console.log(`\n--- [MOCK EMAIL SEND via RESEND] ---`);
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Content:\n${html.replace(/<[^>]*>/g, " ").trim().substring(0, 400)}...`);
    console.log(`-------------------------\n`);
    return { mock: true };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM || "onboarding@resend.dev",
      to,
      subject,
      html,
    });

    if (error) {
      console.error(`Resend API error sending email to ${to}:`, error);
      throw error;
    }

    return data;
  } catch (err) {
    console.error(`Failed to send email via Resend: ${err.message}`);
    throw err;
  }
};

export const getBookingConfirmationTemplate = (username, eventTitle, seats, price) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
      <h2 style="color: #4CAF50;">Booking Confirmed!</h2>
      <p>Hi <strong>${username}</strong>,</p>
      <p>Your booking for <strong>${eventTitle}</strong> has been successfully confirmed.</p>
      <hr style="border: 0; border-top: 1px solid #eee;" />
      <p><strong>Tickets:</strong> ${seats}</p>
      <p><strong>Total Amount:</strong> $${price}</p>
      <hr style="border: 0; border-top: 1px solid #eee;" />
      <p>Thank you for using Eventra!</p>
    </div>
  `;
};

export const getBookingCancellationTemplate = (username, eventTitle, seats) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
      <h2 style="color: #F44336;">Booking Cancelled</h2>
      <p>Hi <strong>${username}</strong>,</p>
      <p>Your booking for <strong>${eventTitle}</strong> (${seats} tickets) has been cancelled.</p>
      <p>If payment was made, your refund is being processed.</p>
      <hr style="border: 0; border-top: 1px solid #eee;" />
      <p>If you have any questions, feel free to contact support.</p>
    </div>
  `;
};

export const getEventApprovalTemplate = (organizerName, eventTitle, status, reason = "") => {
  const isApproved = status === "APPROVED";
  const titleColor = isApproved ? "#4CAF50" : "#F44336";
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
      <h2 style="color: ${titleColor};">Event Status Update: ${status}</h2>
      <p>Hi <strong>${organizerName}</strong>,</p>
      <p>Your event <strong>${eventTitle}</strong> has been <strong>${status.toLowerCase()}</strong> by the admin team.</p>
      ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
      <p>Thank you for hosting with Eventra!</p>
    </div>
  `;
};

export const getRoleApprovalTemplate = (username, status, reason = "") => {
  const isApproved = status === "APPROVED";
  const titleColor = isApproved ? "#4CAF50" : "#F44336";

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
      <h2 style="color: ${titleColor};">Organizer Role Request: ${status}</h2>
      <p>Hi <strong>${username}</strong>,</p>
      <p>Your request for the <strong>Organizer</strong> role has been <strong>${status.toLowerCase()}</strong>.</p>
      ${reason ? `<p><strong>Comments:</strong> ${reason}</p>` : ""}
      ${isApproved ? "<p>You can now log back in to access the organizer panel and create new events!</p>" : ""}
    </div>
  `;
};

export const getWaitlistNotificationTemplate = (username, eventTitle) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
      <h2 style="color: #2196F3;">Seat Available - Waitlist Promotion!</h2>
      <p>Hi <strong>${username}</strong>,</p>
      <p>A seat has freed up for <strong>${eventTitle}</strong>! You have been promoted to the next slot.</p>
      <p style="background: #E3F2FD; padding: 15px; border-radius: 4px; border-left: 4px solid #2196F3;">
        <strong>Important:</strong> You have <strong>30 minutes</strong> to complete your booking. If you do not book within this time, the opportunity will pass to the next person on the waitlist.
      </p>
      <p>Thank you for using Eventra!</p>
    </div>
  `;
};
