require("dotenv").config();
const express = require("express");
const AWS = require("aws-sdk");
const cors = require("cors");

const app = express();
app.use(cors());

// AWS config
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

// Generate pre-signed URL
app.get("/generate-upload-url", async (req, res) => {
  try {
    const fileName = req.query.fileName;
    const fileType = req.query.fileType;

    console.log("File:", fileName, fileType);

    const params = {
      Bucket: process.env.BUCKET_NAME,
      Key: Date.now() + "-" + fileName,
      Expires: 60,
      ContentType: fileType,
    };

    const uploadURL = await s3.getSignedUrlPromise("putObject", params);

    res.json({ uploadURL });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
async function uploadFile() {
  const file = document.getElementById("fileInput").files[0];
  const status = document.getElementById("status");
  const scanStatus = document.getElementById("scanStatus");
  const btn = document.getElementById("uploadBtn");

  if (!file) {
    alert("Please select a file");
    return;
  }

  try {
    btn.disabled = true;

    // 🔍 SCAN SIMULATION START
    scanStatus.innerText = "🔍 Scanning file...";
    scanStatus.className = "status scan";

    await new Promise(resolve => setTimeout(resolve, 1500));

    scanStatus.innerText = "✔ No threats found";
    scanStatus.className = "status safe";

    await new Promise(resolve => setTimeout(resolve, 800));
    // 🔍 SCAN SIMULATION END

    status.innerText = "Uploading...";
    status.className = "status loading";

    const res = await fetch(
      `http://localhost:5000/generate-upload-url?fileName=${file.name}&fileType=${file.type}`
    );

    const data = await res.json();

    await fetch(data.uploadURL, {
      method: "PUT",
      headers: {
        "Content-Type": file.type,
      },
      body: file,
    });

    status.innerText = "Upload successful";
    status.className = "status success";

  } catch (err) {
    console.error(err);
    status.innerText = "Upload failed";
    status.className = "status error";
  } finally {
    btn.disabled = false;
  }
}