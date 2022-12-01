const os = require("os");

const express = require("express");
const multer = require("multer");
const cors = require("cors");
const csv = require("csvtojson");
const knex = require("knex");

const app = express();
const port = 4000;

const upload = multer({ dest: os.tmpdir() });

const knexInstance = knex({
    client: "mssql",
    connection: {
        host: "localhost",
        port: 1433,
        user: "sa",
        password: "Zougrar2022@",
        database: "Tickets",
        encrypt: false,
    },
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

async function getDta() {
    console.log("get reconciliation");
    try {
        const result = await knexInstance.select().from("Réconciliation");
        console.log(result);
    } catch (err) {
        console.log(err);
    }
}
getDta();

function validateCSVHeader(headers) {
    // issue_date,PNR,Entité,AmountALTEA,DeviceALTEA,MtCanal,DeviseCanal,Ecart
    return (
        headers.length === 8 &&
        headers.includes("issue_date") &&
        headers.includes("PNR") &&
        headers.includes("Entité") &&
        headers.includes("AmountALTEA") &&
        headers.includes("DeviceALTEA") &&
        headers.includes("MtCanal") &&
        headers.includes("DeviseCanal") &&
        headers.includes("Ecart")
    );
}

app.get("/api/reconciliation", async (req, res) => {
    console.log("get reconciliation");
    try {
        const result = await knexInstance.select().from("reconciliation");
        console.log(result);
        res.status(200).json({
            status: "success",
            result,
        });
    } catch (err) {
        res.status(500).json(err);
    }
});

app.post("/api/upload", upload.single("file"), (req, res) => {
    console.log("file received");
    console.log(req.file);

    csv()
        .fromFile(req.file.path)
        .on("header", (headers) => {
            const isValid = validateCSVHeader(headers);
            if (!isValid) {
                new Error("Invalid CSV file");
            }
        })
        .then((jsonObj) => {
            jsonObj = jsonObj.map((obj) => {
                obj.Entite = obj.Entité;
                delete obj.Entité;
                return obj;
            });

            console.log("here ---- ", jsonObj, " ---- here");
            knexInstance("Reconciliation")
                .insert(jsonObj)
                .then(() => {
                    res.status(200).json({
                        status: "success",
                        message: "fichier CSV importé avec succès",
                    });
                });
        })
        .catch((error) => {
            console.error(error);
            if (error.message === "Invalid CSV file") {
                res.status(400).json({
                    status: "error",
                    message: "fichier CSV invalide",
                });
            } else {
                res.status(500).json({
                    status: "error",
                    message: "erreur interne",
                });
            }
        });
});

// app.listen(port, () => {
//     console.log(`Example app listening on port ${port}`);
// });
