const express = require("express");
const qr = require("qr-image");
const authMiddleware = require("../middleware/auth");
const Session = require("../models/Session"); 
const router = express.Router();
const QRCode = require('qrcode');

// Simple test route
router.get('/test', (req, res) => {
    res.json({ msg: "QR code route working" });
});

// Generate QR Code
router.post('/generate', async (req, res) => {
    try {
        const { course, sessionId } = req.body;

        // Create data with timestamp and expiration
        const qrData = {
            course,
            sessionId,
            timestamp: Date.now(),
            expiresAt: Date.now() + (5 * 60 * 1000) // expires in 5 minutes
        };

        // Generate QR code
        const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
            width: 300,  // larger size for easier scanning
            margin: 2,
            errorCorrectionLevel: 'H'  // highest error correction
        });

        res.json({
            success: true,
            qrCode: qrCodeDataUrl,
            data: qrData,
            expiresIn: '5 minutes'
        });

    } catch (err) {
        console.error('QR Generation Error:', err);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to generate QR code'
        });
    }
});

// Verify QR Code
router.post('/verify', async (req, res) => {
    try {
        const { qrData } = req.body;

        // Validate input
        if (!qrData) {
            return res.status(400).json({
                success: false,
                error: 'QR data is required'
            });
        }

        // Parse QR data
        let parsedData;
        try {
            parsedData = typeof qrData === 'string' ? JSON.parse(qrData) : qrData;
        } catch (error) {
            return res.status(400).json({
                success: false,
                error: 'Invalid QR data format'
            });
        }

        // Check expiration
        if (parsedData.expiresAt && Date.now() > parsedData.expiresAt) {
            return res.status(400).json({
                success: false,
                error: 'QR code has expired'
            });
        }

        // Validate required fields
        if (!parsedData.course || !parsedData.sessionId) {
            return res.status(400).json({
                success: false,
                error: 'Invalid QR data structure'
            });
        }

        res.json({
            success: true,
            verified: true,
            data: {
                course: parsedData.course,
                sessionId: parsedData.sessionId,
                timestamp: parsedData.timestamp,
                expiresAt: parsedData.expiresAt
            }
        });
    } catch (err) {
        console.error('QR Verification Error:', err);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to verify QR code' 
        });
    }
});

module.exports = router;
