import transporter from "../config/transporter.config.js";
import config from "../config/index.js";

export const mailHelper = async (options) => {
        const message = {
        from: config.SMTP_MAIL_EMAIL, // sender address
        to: options.email, // list of receivers
        subject: options.subject, // Subject line
        text: options.text, // plain text body
        // html: "<b>Hello world?</b>", // html body
      }
      await transporter.sendMail(message)
}

