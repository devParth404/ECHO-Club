const { google } = require("googleapis");

export default async function handler(req, res) {
    // Only POST requests allowed
    if (req.method !== "POST") {
        return res.status(405).json({
            success: false,
            message: "Method not allowed"
        });
    }

    try {
        const {
            event,
            name,
            department,
            year,
            mobile,
            email
        } = req.body || {};

        // Check required fields
        if (!event ||
            !name ||
            !department ||
            !year ||
            !mobile ||
            !email
        ) {
            return res.status(400).json({
                success: false,
                message: "Please fill all required fields."
            });
        }

        // Environment variables
        const serviceAccountJson =
            process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

        const spreadsheetId =
            process.env.GOOGLE_EVENT_SHEET_ID;

        if (!serviceAccountJson || !spreadsheetId) {
            console.error(
                "Missing Google event registration environment variables"
            );

            return res.status(500).json({
                success: false,
                message: "Server configuration is incomplete."
            });
        }

        // Parse service account JSON
        const credentials = JSON.parse(serviceAccountJson);

        // Fix private key line breaks
        const privateKey = credentials.private_key
            .replace(/\\n/g, "\n")
            .trim();

        // Google authentication
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: credentials.client_email,
                private_key: privateKey
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

        // Indian date & time
        const timestamp = new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata"
        });

        // Add registration to Google Sheet
        await sheets.spreadsheets.values.append({
            spreadsheetId: spreadsheetId.trim(),

            // First sheet must be named Sheet1
            range: "Sheet1!A:G",

            valueInputOption: "USER_ENTERED",

            insertDataOption: "INSERT_ROWS",

            requestBody: {
                values: [
                    [
                        timestamp,
                        event.trim(),
                        name.trim(),
                        department.trim(),
                        year.trim(),
                        mobile.trim(),
                        email.trim()
                    ]
                ]
            }
        });

        console.log(
            "Event registration saved successfully:", {
                event: event.trim(),
                name: name.trim(),
                email: email.trim()
            }
        );

        return res.status(200).json({
            success: true,
            message: "Event registration submitted successfully!"
        });

    } catch (error) {

        console.error(
            "Event Google Sheets error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to save event registration. Please try again."
        });
    }
}