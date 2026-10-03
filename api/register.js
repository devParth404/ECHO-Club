const { google } = require("googleapis");

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== "POST") {
        return res.status(405).json({
            success: false,
            message: "Method not allowed"
        });
    }

    try {
        // Get registration data
        const {
            name,
            email,
            phone,
            department,
            interest
        } = req.body || {};

        // Validate form data
        if (!name || !email || !phone || !department || !interest) {
            return res.status(400).json({
                success: false,
                message: "Please fill all required fields."
            });
        }

        // Get Google credentials from Vercel Environment Variables
        const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
        const privateKey = process.env.GOOGLE_PRIVATE_KEY;
        const spreadsheetId = process.env.GOOGLE_SHEET_ID;

        // Check environment variables
        if (!clientEmail || !privateKey || !spreadsheetId) {
            console.error("Missing Google environment variables");

            return res.status(500).json({
                success: false,
                message: "Server configuration is incomplete."
            });
        }

        // Fix Google private key formatting
        const formattedPrivateKey = privateKey
            .replace(/\\n/g, "\n")
            .replace(/^"(.*)"$/s, "$1")
            .trim();

        // Authenticate with Google
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: clientEmail.trim(),
                private_key: formattedPrivateKey
            },
            scopes: [
                "https://www.googleapis.com/auth/spreadsheets"
            ]
        });

        // Google Sheets API
        const sheets = google.sheets({
            version: "v4",
            auth
        });

        // Indian date and time
        const timestamp = new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata"
        });

        // Add registration to Google Sheet
        await sheets.spreadsheets.values.append({
            spreadsheetId: spreadsheetId.trim(),
            range: "Sheet1!A:F",
            valueInputOption: "USER_ENTERED",
            insertDataOption: "INSERT_ROWS",

            requestBody: {
                values: [
                    [
                        timestamp,
                        name.trim(),
                        email.trim(),
                        phone.trim(),
                        department.trim(),
                        interest.trim()
                    ]
                ]
            }
        });

        console.log("Registration saved successfully:", {
            name: name.trim(),
            email: email.trim(),
            interest: interest.trim()
        });

        return res.status(200).json({
            success: true,
            message: "Registration submitted successfully!"
        });

    } catch (error) {
        console.error("Google Sheets error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to save registration. Please try again."
        });
    }
}