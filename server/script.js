const express = require('express');
const fs = require('fs');
const multer = require('multer');
const pinataSDK = require('@pinata/sdk');
const bodyParser = require('body-parser');
const cors = require('cors'); 

const app = express();
const port = 3001;

app.use(bodyParser.json());
app.use(cors())

const pinataApiKey="cc09081a0a80ef8809e0"
const pinataApiSecret="503c0ff4d74695e546fc08926b055c385ff2932fa54d2b1ec0fd707a597e3e81"
// const pinataApiKey = process.env.pinataApiKey
// const pinataApiSecret = process.env.pinataApiSecret 

// Multer configuration
const upload = multer({ dest: 'uploads/' });
const pinata = new pinataSDK(pinataApiKey, pinataApiSecret);

app.post('/pinString', async (req, res) => {
    const { text } = req.body;

    try {
        // Convert the text to a Buffer before pinning
        const buffer = Buffer.from(text);

        const options = {
            pinataOptions: {
                cidVersion: 0,
            },
        };

        const result = await pinata.pinJSONToIPFS({ message: text }, options);

        res.json({ success: true, cid: result.IpfsHash });
    } catch (error) {
        console.error('Error pinning string to IPFS:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});
app.post('/api/upload', upload.single('file'), async (req, res) => {
     const stream = fs.createReadStream(req.file.path);
       const options = {
        pinataMetadata: {
            name: String(req.file.originalname) // Use the original filename of the uploaded file
        }
    };
    console.log("filename",req.file.path)
    console.log("original name",req.file.originalname)

    try {
        const result = await pinata.pinFileToIPFS(stream , options);
        console.log('File uploaded to IPFS. CID:', result.IpfsHash);
        res.json({success:true,hash:result.IpfsHash})
    } catch (error) {
        console.error('Error uploading file to IPFS:', error);
        res.status(500).send('Internal server error.');
    }
});
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
