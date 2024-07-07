export const resetDeviceHTML = (user:string, resetLink:string) => {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Device Reset</title>
        
        <style>
        body, html {
            margin: 0;
            padding: 0;
        }
        /* Set background color for the whole email */
        body {
            background-color: #fafafa;
            /* Updated background color */
            font-family: 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #091e2b;
            /* Text color updated to match the darker color */
        }
        /* Container for the email content */
        .container {
            width: 100%;
            max-width: 600px;
            margin: 0 auto;
            background-color: #fafafa;
            /* Match the background color */
            padding: 20px;
            border-radius: 8px;
            box-sizing: border-box; /* Added to include padding in width calculation */
        }
        /* Header styles */
        .header {
            text-align: center;
        }
        /* Logo styles */
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #c49615;
            margin-bottom: 10px;
            /* Add some decorative styling */
            border-bottom: 2px solid #c49615;
            padding-bottom: 5px;
        }
        /* Body content styles */
        .content {
            padding: 5px 0 20px 0;
        }
        /* Button styles */
        .button {
            display: inline-block;
            padding: 8px 16px;
            background-color: #c49615;
            color: #fafafa;
            text-decoration: none;
            border-radius: 20px;
            text-align: center;
        }
        /* Footer styles */
        .footer {
            text-align: center;
            color: #c49615;
            /* Accent color remains the same */
        }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo" style="text-align: center; font-size: 24px; font-weight: bold; color: #c49615; margin-bottom: 10px;">
                    <span>learning</span>
                </div>
                <h2 style="color: #c49615;">Device Reset</h2>
            </div>
            <div class="content">
                <p style="color: #091e2b;">Dear ${user},</p>
                <p style="color: #091e2b;">You have requested to change device. Please click the button below from the new device</p>
                <div style="text-align: center;">
                    <a href="${resetLink}" class="button" style="color: #fafafa;">Reset Device</a>
                </div>
                <div style="text-align: center;">
                    your link is : ${resetLink}
                </div>
                <br>
                <p style="color: #091e2b;">If you did not request to change device, please ignore this email.</p>
            </div>
            <div class="footer">
                <p>This is an automated message. Please do not reply.</p>
            </div>
        </div>
    </body>
    
    </html>`;
};