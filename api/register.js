const { google } = require("googleapis");

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({
            success: false,
            message: "Method not allowed"
        });
    }

    try {
        const {
            name,
            email,
            phone,
            department,
            interest
        } = req.body || {};

        if (!name || !email || !phone || !department || !interest) {
            return res.status(400).json({
                success: false,
                message: "Please fill all required fields."
            });
        }

        const serviceAccountJson =
            process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

        const spreadsheetId =
            process.env.GOOGLE_SHEET_ID;

        if (!serviceAccountJson || !spreadsheetId) {
            console.error("Missing Google environment variables");

            return res.status(500).json({
                success: false,
                message: "Server configuration is incomplete."
            });
        }

        // Parse complete Google service-account JSON
        const credentials = JSON.parse(serviceAccountJson);

        // Convert escaped newlines into real newlines
        const privateKey = credentials.private_key
            .replace(/\\n/g, "\n")
            .trim();

        // Authenticate with Google
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: credentials.client_email,
                private_key: privateKey
            },
            scopes: [
                "https://www.googleapis.com/auth/spreadsheets"
            ]
        });

        const sheets = google.sheets({
            version: "v4",
            auth
        });

        const timestamp = new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata"
        });

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