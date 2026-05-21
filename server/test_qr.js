import QRCode from "qrcode";
import { v4 as uuidv4 } from "uuid";

async function test() {
  try {
    const uniqueId = uuidv4();
    const qrUrl = `https://jeddah-chamber.onrender.com/view/${uniqueId}`;
    const qrOptions = {
      errorCorrectionLevel: "Q",
      version: 15,
      margin: 2,
      width: 300,
    };
    console.log("Generating QR code with URL:", qrUrl);
    const qrCodeImage = await QRCode.toDataURL(qrUrl, qrOptions);
    console.log("Success! Generated image of length:", qrCodeImage.length);
  } catch (err) {
    console.error("QR Code Error:", err);
  }
}

test();
