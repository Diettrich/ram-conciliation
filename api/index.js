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

app.post("/api/reconciliation", async (req, res) => {
    console.log("get reconciliation");
    console.log(req.body);

    try {
        const query = knexInstance.select().from("Réconciliation");
        if (req.body.type.rembourcement || req.body.type.vente) {
            if (req.body.type.rembourcement && req.body.type.vente) {
                query.where("type", "in", ["remboursement", "vente"]);
            } else if (req.body.type.rembourcement) {
                query.where("type", "remboursement");
            } else {
                query.where("type", "vente");
            }
        }
        if (req.body.dateDebut && req.body.dateFin) {
            query.whereBetween("PAYDATE", [
                // convert to sql date
                new Date(req.body.dateDebut).toISOString().split("T")[0],
                new Date(req.body.dateFin).toISOString().split("T")[0],
            ]);
        }
        // if (req.body.canal.APP) {
        //     query.where("canal", "APP");
        // }
        // if (req.body.canal.OGONE) {
        //     query.where("canal", "OGONE");
        // }
        // if (req.body.canal.CMI) {
        //     query.where("canal", "CMI");
        // }
        // if (req.body.canal.Altea) {
        //     query.where("canal", "Altea");
        // }
        // if (req.body.canal.Binga) {
        //     query.where("canal", "Binga");
        // }
        // if (req.body.canal.Fatourati) {
        //     query.where("canal", "Fatourati");
        // }

        const canals = [];

        Object.keys(req.body.canal).forEach((key) => {
            if (req.body.canal[key]) {
                canals.push(key);
            }
        });

        if (canals.length > 0) {
            query.where("canal", "in", canals);
        }

        const result = await query;

        // console.log(result);
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

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
