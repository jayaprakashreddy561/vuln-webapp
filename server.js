const express = require("express");
const { exec } = require("child_process");
const fs = require("fs");

const app = express();

app.use(express.json());

// -------------------------------------------------------
// INTENTIONALLY VULNERABLE TEST APPLICATION
// DO NOT USE IN PRODUCTION
// -------------------------------------------------------


// 1. Hardcoded secret
// Expected detection: Secret scanning / Gitleaks

const databasePassword = "SuperSecretPassword123!";
const apiSecret = "test-api-secret-1234567890";


// -------------------------------------------------------
// 2. Reflected XSS
// Expected detection: CodeQL / SAST
// -------------------------------------------------------

app.get("/hello", (req, res) => {

    const name = req.query.name;

    res.send(`
        <html>
            <body>
                <h1>Hello ${name}</h1>
            </body>
        </html>
    `);

});


// -------------------------------------------------------
// 3. Command Injection
// Expected detection: CodeQL
// -------------------------------------------------------

app.get("/ping", (req, res) => {

    const host = req.query.host;

    exec("ping -c 1 " + host, (error, stdout) => {

        if (error) {
            return res.status(500).send(error.toString());
        }

        res.send(stdout);

    });

});


// -------------------------------------------------------
// 4. Path Traversal / Arbitrary File Read
// Expected detection: CodeQL / SAST
// -------------------------------------------------------

app.get("/file", (req, res) => {

    const filename = req.query.filename;

    fs.readFile(filename, "utf8", (error, data) => {

        if (error) {
            return res.status(500).send("Unable to read file");
        }

        res.send(data);

    });

});


// -------------------------------------------------------
// 5. Unsafe redirect
// Expected detection: CodeQL
// -------------------------------------------------------

app.get("/redirect", (req, res) => {

    const url = req.query.url;

    res.redirect(url);

});


// -------------------------------------------------------
// 6. Sensitive information disclosure
// -------------------------------------------------------

app.get("/debug", (req, res) => {

    res.json({

        databaseHost: "database.internal",
        databaseUser: "admin",
        databasePassword: databasePassword,
        apiSecret: apiSecret,
        environment: process.env

    });

});


// -------------------------------------------------------
// 7. Weak authentication logic
// -------------------------------------------------------

app.post("/login", (req, res) => {

    const username = req.body.username;
    const password = req.body.password;

    if (
        username === "admin" &&
        password === "admin123"
    ) {

        return res.json({
            message: "Login successful",
            token: "static-admin-token"
        });

    }

    res.status(401).json({
        message: "Invalid credentials"
    });

});


// -------------------------------------------------------
// 8. Missing security headers
// -------------------------------------------------------

app.get("/", (req, res) => {

    res.send(`
        <html>
            <head>
                <title>Vulnerable Test App</title>
            </head>

            <body>

                <h1>GitHub Security Workflow Test Application</h1>

                <p>This application is intentionally vulnerable.</p>

                <ul>
                    <li>/hello?name=test</li>
                    <li>/ping?host=127.0.0.1</li>
                    <li>/file?filename=test.txt</li>
                    <li>/redirect?url=https://example.com</li>
                    <li>/debug</li>
                </ul>

            </body>
        </html>
    `);

});


app.listen(3000, () => {

    console.log("Intentionally vulnerable application running on port 3000");

});